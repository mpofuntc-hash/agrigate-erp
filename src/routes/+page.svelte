<script lang="ts">
  import { onMount, onDestroy, untrack } from "svelte";
  import { PUBLIC_CONVEX_URL } from "$env/static/public";

  // ── Types ─────────────────────────────────────────────────────────────────────
  type Worker   = { _id: string; name: string; saId: string; village: string };
  type YieldLog = { _id: string; workerId: string; binWeight: number; cropType: string; timestamp: number; lat?: number; lng?: number };

  // ── Sidebar nav ───────────────────────────────────────────────────────────────
  let activeSection  = $state("dashboard");
  let sidebarOpen    = $state(false);

  // ── Worker form ───────────────────────────────────────────────────────────────
  let wName = $state(""); let wSaId = $state(""); let wVillage = $state("");
  let saving = $state(false); let saved = $state(false); let regError = $state("");

  // ── Harvest form ──────────────────────────────────────────────────────────────
  let selectedWorker = $state(""); let binWeight = $state("");
  let cropType = $state("Tomatoes");
  let logging = $state(false); let logged = $state(false); let logError = $state("");
  let gpsStatus = $state<"idle"|"capturing"|"ok"|"denied">("idle");

  // ── Data ─────────────────────────────────────────────────────────────────────
  let workers     = $state<Worker[]>([]);
  let todayLogs   = $state<YieldLog[]>([]);
  let dataLoaded  = $state(false);
  let search      = $state("");

  // ── Derived stats ─────────────────────────────────────────────────────────────
  let filtered          = $derived(search.trim() === "" ? workers : workers.filter(w => w.village.toLowerCase().includes(search.trim().toLowerCase())));
  let totalKg           = $derived(todayLogs.reduce((s, l) => s + l.binWeight, 0));
  let totalTonnage      = $derived(totalKg / 1000);
  let totalBins         = $derived(todayLogs.length);
  let activeWorkerCount = $derived(new Set(todayLogs.map(l => l.workerId)).size);
  let avgBinWeight      = $derived(totalBins > 0 ? totalKg / totalBins : 0);
  let topVillage        = $derived((() => {
    if (!todayLogs.length) return "—";
    const t: Record<string, number> = {};
    for (const log of todayLogs) {
      const v = workers.find(w => w._id === log.workerId)?.village ?? "Unknown";
      t[v] = (t[v] ?? 0) + log.binWeight;
    }
    return Object.entries(t).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  })());

  // ── Counting animation for tonnage ────────────────────────────────────────────
  let displayTonnage = $state(0);
  let rafId = 0;
  $effect(() => {
    const target = totalTonnage;
    const from   = untrack(() => displayTonnage);
    cancelAnimationFrame(rafId);
    const t0  = performance.now();
    const dur = 1400;
    function tick(now: number) {
      const p = Math.min((now - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      displayTonnage = from + (target - from) * e;
      if (p < 1) rafId = requestAnimationFrame(tick);
      else displayTonnage = target;
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  });

  function workerName(id: string) {
    return workers.find(w => w._id === id)?.name ?? "Unknown";
  }

  // ── Convex client ─────────────────────────────────────────────────────────────
  let client: import("convex/browser").ConvexClient | null = null;
  let unsubWorkers: (() => void) | undefined;
  let unsubLogs:    (() => void) | undefined;

  // ── Leaflet map ───────────────────────────────────────────────────────────────
  let mapEl: HTMLDivElement | null = null;
  let leafletMap: any = null;
  let markerLayer: any = null;

  onMount(async () => {
    // ── Convex ─────────────────────────────────────────────────────────────────
    const [{ ConvexClient }, { api }] = await Promise.all([
      import("convex/browser"),
      import("../../convex/_generated/api"),
    ]);
    client = new ConvexClient(PUBLIC_CONVEX_URL);
    unsubWorkers = client.onUpdate(api.workers.listWorkers, {}, r => {
      workers = r ?? []; dataLoaded = true;
    });
    const startOfDay = new Date().setHours(0, 0, 0, 0);
    unsubLogs = client.onUpdate(api.yieldLogs.listTodayLogs, { startOfDay }, r => {
      todayLogs = r ?? [];
    });

    // ── Intersection observer for active nav ───────────────────────────────────
    const obs = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (e.isIntersecting) activeSection = e.target.getAttribute("data-s") ?? "dashboard";
      }
    }, { threshold: 0.25 });
    document.querySelectorAll("[data-s]").forEach(el => obs.observe(el));

    // ── Leaflet map ────────────────────────────────────────────────────────────
    if (mapEl) {
      const L = (await import("leaflet")).default;
      leafletMap  = L.map(mapEl).setView([-23.87, 30.14], 14);
      markerLayer = L.layerGroup().addTo(leafletMap);
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { attribution: "© Esri World Imagery", maxZoom: 19 }
      ).addTo(leafletMap);
    }
  });

  onDestroy(() => {
    cancelAnimationFrame(rafId);
    unsubWorkers?.(); unsubLogs?.(); client?.close();
    leafletMap?.remove();
  });

  // ── Sync map pins whenever logs change ────────────────────────────────────────
  $effect(() => {
    const logs = todayLogs; // reactive dependency
    if (!leafletMap || !markerLayer) return;
    untrack(async () => {
      const L = (await import("leaflet")).default;
      markerLayer.clearLayers();
      for (const log of logs) {
        if (log.lat == null || log.lng == null) continue;
        const icon = L.divIcon({
          className: "",
          html: `<div class="map-pin"><span>🌾</span></div>`,
          iconSize: [36, 36], iconAnchor: [18, 36],
        });
        L.marker([log.lat, log.lng], { icon })
          .bindPopup(`<b>${workerName(log.workerId)}</b><br>${log.cropType} · ${log.binWeight} kg`)
          .addTo(markerLayer);
      }
    });
  });

  // ── Mutations ─────────────────────────────────────────────────────────────────
  async function registerWorker(e: Event) {
    e.preventDefault(); regError = "";
    if (!client) return;
    saving = true;
    try {
      const { api } = await import("../../convex/_generated/api");
      await client.mutation(api.workers.registerWorker, { name: wName.trim(), saId: wSaId.trim(), village: wVillage.trim() });
      wName = ""; wSaId = ""; wVillage = "";
      saved = true; setTimeout(() => (saved = false), 4000);
    } catch { regError = "Failed to save. Please try again."; }
    finally { saving = false; }
  }

  async function getGPS(): Promise<{ lat: number; lng: number } | null> {
    return new Promise(resolve => {
      if (!navigator.geolocation) { resolve(null); return; }
      gpsStatus = "capturing";
      navigator.geolocation.getCurrentPosition(
        p  => { gpsStatus = "ok"; resolve({ lat: p.coords.latitude, lng: p.coords.longitude }); },
        () => { gpsStatus = "denied"; resolve(null); },
        { timeout: 6000 }
      );
    });
  }

  async function logBin(e: Event) {
    e.preventDefault(); logError = "";
    if (!client || !selectedWorker) return;
    const kg = parseFloat(binWeight);
    if (isNaN(kg) || kg <= 0) { logError = "Enter a valid weight."; return; }
    logging = true;
    try {
      const gps = await getGPS();
      const { api } = await import("../../convex/_generated/api");
      await client.mutation(api.yieldLogs.logBin, {
        workerId: selectedWorker as any, binWeight: kg, cropType, timestamp: Date.now(),
        ...(gps ? { lat: gps.lat, lng: gps.lng } : {}),
      });
      binWeight = "";
      logged = true; gpsStatus = "idle";
      setTimeout(() => (logged = false), 4000);
    } catch { logError = "Failed to log bin. Please try again."; }
    finally { logging = false; }
  }

  async function removeWorker(id: string) {
    if (!client || !confirm("Delete this worker? This cannot be undone.")) return;
    const { api } = await import("../../convex/_generated/api");
    await client.mutation(api.workers.deleteWorker, { id: id as any });
  }

  async function removeLog(id: string) {
    if (!client || !confirm("Delete this log entry?")) return;
    const { api } = await import("../../convex/_generated/api");
    await client.mutation(api.yieldLogs.deleteYieldLog, { id: id as any });
  }

  function exportCSV() { alert("Preparing Export…"); }

  function scrollTo(section: string) {
    document.querySelector(`[data-s="${section}"]`)?.scrollIntoView({ behavior: "smooth" });
    sidebarOpen = false;
  }

  const navItems = [
    { id: "dashboard", icon: "◈", label: "Dashboard"  },
    { id: "workers",   icon: "◉", label: "Workers"    },
    { id: "yield",     icon: "◌", label: "Yield Log"  },
    { id: "map",       icon: "◎", label: "Field Map"  },
    { id: "reports",   icon: "◫", label: "Reports"    },
  ];
</script>

<svelte:head>
  <title>ZZ2 Worker Hub – AgriGate ERP</title>
</svelte:head>

<!-- Mobile sidebar overlay -->
{#if sidebarOpen}
  <div class="overlay" role="button" tabindex="-1" onclick={() => sidebarOpen = false} onkeydown={() => {}}></div>
{/if}

<div class="shell">

  <!-- ══ SIDEBAR ══════════════════════════════════════════════════════════════ -->
  <nav class="sidebar" class:open={sidebarOpen}>
    <div class="sb-brand">
      <span class="sb-leaf">🌿</span>
      <div>
        <p class="sb-app">AgriGate ERP</p>
        <p class="sb-farm">ZZ2 Farms</p>
      </div>
    </div>

    <ul class="sb-nav">
      {#each navItems as item}
        <li>
          <button
            class="sb-item"
            class:active={activeSection === item.id}
            onclick={() => scrollTo(item.id)}
          >
            <span class="sb-icon">{item.icon}</span>
            <span class="sb-label">{item.label}</span>
            {#if item.id === "dashboard" && totalBins > 0}
              <span class="sb-badge">{totalBins}</span>
            {/if}
          </button>
        </li>
      {/each}
    </ul>

    <div class="sb-footer">
      <div class="sb-pulse-row">
        <span class="pulse-dot"></span>
        <span class="sb-live">Live sync active</span>
      </div>
      <p class="sb-version">v1.0 · MVP</p>
    </div>
  </nav>

  <!-- ══ MAIN ══════════════════════════════════════════════════════════════════ -->
  <div class="main">

    <!-- TOP BAR -->
    <header class="topbar">
      <button class="hamburger" onclick={() => sidebarOpen = !sidebarOpen} aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
      <div class="topbar-brand">
        <h1>ZZ2 Worker Hub</h1>
        <p class="topbar-date">{new Date().toLocaleDateString("en-ZA", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}</p>
      </div>
      <div class="topbar-chip">
        <span class="chip-dot"></span>
        {workers.length} workers
      </div>
    </header>

    <!-- ══ SECTION: DASHBOARD ═══════════════════════════════════════════════ -->
    <section class="section" data-s="dashboard">
      <div class="section-inner">

        <!-- Tonnage glass card -->
        <div class="glass-hero">
          <div class="glass-hero-content">
            <p class="glass-label">⚖️ &nbsp;Total Tonnage Today</p>
            <p class="glass-number">
              {displayTonnage.toFixed(3)}<span class="glass-unit">t</span>
            </p>
            <p class="glass-sub">{totalBins} bins · {totalKg.toFixed(0)} kg harvested</p>
          </div>
          <div class="glass-gps">
            <span class="gps-pulse"></span>
            <span class="gps-coords">
              GPS: {#if todayLogs.find(l => l.lat)}-23.87°S 30.14°E{:else}Awaiting log…{/if}
            </span>
          </div>
        </div>

        <!-- Stat glass cards -->
        <div class="stats-grid">
          <div class="glass-card stat-blue">
            <p class="sc-icon">👷</p>
            <p class="sc-label">Active Workers Today</p>
            <p class="sc-value">{activeWorkerCount}</p>
            <p class="sc-sub">logged a bin today</p>
          </div>
          <div class="glass-card stat-gold">
            <p class="sc-icon">📦</p>
            <p class="sc-label">Avg Bin Weight</p>
            <p class="sc-value">{avgBinWeight.toFixed(1)}<span class="sc-unit">kg</span></p>
            <p class="sc-sub">per bin logged</p>
          </div>
          <div class="glass-card stat-purple">
            <p class="sc-icon">🏆</p>
            <p class="sc-label">Top Village</p>
            <p class="sc-value top-v">{topVillage}</p>
            <p class="sc-sub">highest weight today</p>
          </div>
        </div>

      </div>
    </section>

    <!-- ══ SECTION: WORKERS ══════════════════════════════════════════════════ -->
    <section class="section section-white" data-s="workers">
      <div class="section-inner">
        <h2 class="section-title">Workers Registry</h2>
        <div class="two-col">

          <!-- Register form -->
          <div class="card">
            <div class="card-header">Register New Worker</div>
            <form onsubmit={registerWorker} class="form">
              <div class="field">
                <label>Full Name</label>
                <input type="text" bind:value={wName} placeholder="e.g. Thabo Nkosi" required disabled={saving} />
              </div>
              <div class="field">
                <label>SA ID Number</label>
                <input type="text" bind:value={wSaId} placeholder="13-digit SA ID" maxlength="13" required disabled={saving} />
              </div>
              <div class="field">
                <label>Village / Area</label>
                <input type="text" bind:value={wVillage} placeholder="e.g. Tzaneen" required disabled={saving} />
              </div>
              <button type="submit" class="btn btn-primary" disabled={saving}>
                {#if saving}<span class="spinner"></span>Saving…{:else}✓&nbsp;Confirm Registration{/if}
              </button>
              {#if saved}<div class="alert alert-success">Worker registered!</div>{/if}
              {#if regError}<div class="alert alert-error">{regError}</div>{/if}
            </form>
          </div>

          <!-- Workers list -->
          <div class="card">
            <div class="card-header">Registered Workers</div>
            <div class="search-wrap">
              <span>🔍</span>
              <input class="search-input" type="text" bind:value={search} placeholder="Filter by village…" />
              {#if search}<button class="clear-btn" onclick={() => search = ""}>✕</button>{/if}
            </div>

            {#if !dataLoaded}
              <div class="loading-state">
                <span class="sprout">🌱</span>
                <p>Loading…</p>
              </div>
            {:else if workers.length === 0}
              <div class="empty-state"><span>👷</span><p>No workers yet.</p></div>
            {:else if filtered.length === 0}
              <div class="empty-state"><span>🔍</span><p>No match for "{search}".</p></div>
            {:else}
              <ul class="list">
                {#each filtered as w, i}
                  <li class="list-row worker-row">
                    <span class="row-num">{filtered.length - i}</span>
                    <div class="row-info">
                      <p class="row-name">{w.name}</p>
                      <p class="row-sub">ID: {w.saId} · {w.village}</p>
                    </div>
                    <span class="badge-active">Active</span>
                    <button class="del-btn" title="Delete" onclick={() => removeWorker(w._id)}>🗑</button>
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        </div>
      </div>
    </section>

    <!-- ══ SECTION: YIELD ════════════════════════════════════════════════════ -->
    <section class="section" data-s="yield">
      <div class="section-inner">
        <h2 class="section-title light">Harvest Logger</h2>
        <div class="two-col">

          <!-- Log form -->
          <div class="card">
            <div class="card-header harvest-hdr">🌾 &nbsp;Log a Bin</div>
            <form onsubmit={logBin} class="form">
              <div class="field">
                <label>Select Worker</label>
                <select bind:value={selectedWorker} required disabled={logging}>
                  <option value="" disabled>-- Choose a worker --</option>
                  {#each workers as w}
                    <option value={w._id}>{w.name} · {w.village}</option>
                  {/each}
                </select>
              </div>
              <div class="field">
                <label>Crop Type</label>
                <select bind:value={cropType} disabled={logging}>
                  <option>Tomatoes</option><option>Avocados</option><option>Mangoes</option>
                  <option>Citrus</option><option>Peppers</option><option>Butternut</option><option>Other</option>
                </select>
              </div>
              <div class="field">
                <label>Bin Weight (kg)</label>
                <input type="number" min="0.1" step="0.1" bind:value={binWeight} placeholder="e.g. 850" required disabled={logging} />
              </div>
              <div class="gps-row">
                {#if gpsStatus === "capturing"}
                  <span class="gps-tag gps-wait">📡 Capturing GPS…</span>
                {:else if gpsStatus === "ok"}
                  <span class="gps-tag gps-ok">✓ GPS captured</span>
                {:else if gpsStatus === "denied"}
                  <span class="gps-tag gps-na">GPS unavailable</span>
                {:else}
                  <span class="gps-tag">📍 GPS will be captured on submit</span>
                {/if}
              </div>
              <button type="submit" class="btn btn-gold" disabled={logging || !selectedWorker}>
                {#if logging}<span class="spinner"></span>Saving…{:else}🌾&nbsp;Log Bin{/if}
              </button>
              {#if logged}<div class="alert alert-success">Bin logged!</div>{/if}
              {#if logError}<div class="alert alert-error">{logError}</div>{/if}
            </form>
          </div>

          <!-- Today's logs -->
          <div class="card">
            <div class="card-header harvest-hdr">Today's Bins ({totalBins})</div>
            {#if todayLogs.length === 0}
              <div class="empty-state"><span>🌾</span><p>No bins logged today.</p></div>
            {:else}
              <ul class="list log-list">
                {#each todayLogs as log, i}
                  <li class="list-row log-row">
                    <span class="row-num harvest-num">{todayLogs.length - i}</span>
                    <div class="row-info">
                      <p class="row-name">{workerName(log.workerId)}</p>
                      <p class="row-sub">{log.cropType} · {new Date(log.timestamp).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}{log.lat ? " · 📍 GPS" : ""}</p>
                    </div>
                    <span class="log-weight">{log.binWeight} kg</span>
                    <button class="del-btn" title="Delete" onclick={() => removeLog(log._id)}>🗑</button>
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        </div>
      </div>
    </section>

    <!-- ══ SECTION: MAP ══════════════════════════════════════════════════════ -->
    <section class="section section-white" data-s="map">
      <div class="section-inner">
        <h2 class="section-title">Field Map <span class="map-tag">Satellite View</span></h2>
        <p class="section-sub">Pins appear automatically when a bin is logged with GPS data. Allow location access when prompted.</p>
        <div class="map-wrap" bind:this={mapEl}></div>
        {#if todayLogs.filter(l => l.lat).length === 0}
          <p class="map-hint">No GPS pins yet — log a bin with location enabled to see pins on the map.</p>
        {/if}
      </div>
    </section>

    <!-- ══ SECTION: REPORTS ══════════════════════════════════════════════════ -->
    <section class="section" data-s="reports">
      <div class="section-inner">
        <h2 class="section-title light">Reports &amp; Export</h2>
        <div class="report-cards">
          <div class="report-card">
            <p class="rcard-icon">📊</p>
            <p class="rcard-title">Daily Summary</p>
            <p class="rcard-sub">{totalBins} bins · {totalTonnage.toFixed(3)} tons · {activeWorkerCount} workers</p>
          </div>
          <div class="report-card">
            <p class="rcard-icon">🏆</p>
            <p class="rcard-title">Top Performer</p>
            <p class="rcard-sub">Village: {topVillage}</p>
          </div>
          <div class="report-card">
            <p class="rcard-icon">⚖️</p>
            <p class="rcard-title">Average Bin</p>
            <p class="rcard-sub">{avgBinWeight.toFixed(1)} kg per bin</p>
          </div>
        </div>
        <div class="export-row">
          <p class="export-note">📋 Export today's harvest data for payroll processing</p>
          <button class="btn btn-export" onclick={exportCSV}>⬇&nbsp; Export to CSV for Payroll</button>
        </div>
      </div>
    </section>

  </div><!-- /main -->
</div><!-- /shell -->

<style>
  /* ══════════════════════════════════════════════════════════════════════════════
     MD3 DESIGN TOKENS
  ══════════════════════════════════════════════════════════════════════════════ */
  :global(*), :global(*::before), :global(*::after) { box-sizing: border-box; margin: 0; padding: 0; }
  :global(body) {
    font-family: 'Inter', system-ui, sans-serif;
    background: #0d1f0d;
    color: #1a1a1a;
    --c-primary:       #2E7D32;
    --c-primary-dark:  #1B5E20;
    --c-primary-light: #4CAF50;
    --c-gold:          #FF8F00;
    --c-gold-dark:     #E65100;
    --c-surface:       #FFFFFF;
    --c-bg:            #0d1f0d;
    --c-bg2:           #F3F7F3;
    --radius-full:     9999px;
    --radius-xl:       20px;
    --radius-lg:       14px;
    --radius-md:       10px;
    --shadow-card:     0 4px 24px rgba(0,0,0,0.12);
    --shadow-deep:     0 8px 40px rgba(0,0,0,0.28);
  }

  /* ══ SHELL ═══════════════════════════════════════════════════════════════════ */
  .shell { display: flex; min-height: 100vh; }

  /* ══ SIDEBAR ═════════════════════════════════════════════════════════════════ */
  .sidebar {
    width: 256px;
    min-height: 100vh;
    background: #0a160a;
    border-right: 1px solid rgba(255,255,255,0.07);
    display: flex;
    flex-direction: column;
    position: sticky;
    top: 0;
    height: 100vh;
    overflow-y: auto;
    flex-shrink: 0;
    z-index: 100;
    transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
  }

  .sb-brand {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 1.5rem 1.25rem 1.25rem;
    border-bottom: 1px solid rgba(255,255,255,0.07);
  }
  .sb-leaf  { font-size: 2rem; }
  .sb-app   { font-size: 0.65rem; color: #81c784; letter-spacing: 0.14em; text-transform: uppercase; font-weight: 700; }
  .sb-farm  { font-size: 1rem; font-weight: 800; color: #fff; margin-top: 0.1rem; }

  .sb-nav { list-style: none; padding: 1rem 0.75rem; flex: 1; display: flex; flex-direction: column; gap: 0.25rem; }
  .sb-item {
    width: 100%; display: flex; align-items: center; gap: 0.75rem;
    padding: 0.75rem 1rem; border-radius: var(--radius-full);
    background: none; border: none; color: #a5d6a7;
    font-family: 'Inter', sans-serif; font-size: 0.88rem; font-weight: 500;
    cursor: pointer; text-align: left;
    transition: background 0.18s, color 0.18s;
    position: relative;
  }
  .sb-item:hover { background: rgba(255,255,255,0.07); color: #fff; }
  .sb-item.active { background: var(--c-primary); color: #fff; font-weight: 700; box-shadow: 0 4px 16px rgba(46,125,50,0.35); }
  .sb-icon  { font-size: 1.1rem; width: 1.3rem; text-align: center; }
  .sb-label { flex: 1; }
  .sb-badge {
    background: var(--c-gold); color: #fff;
    font-size: 0.65rem; font-weight: 800;
    padding: 0.1rem 0.45rem; border-radius: var(--radius-full);
  }

  .sb-footer { padding: 1rem 1.25rem; border-top: 1px solid rgba(255,255,255,0.07); }
  .sb-pulse-row { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.3rem; }
  .pulse-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #69f0ae; box-shadow: 0 0 8px #69f0ae;
    animation: pulse 2s infinite; flex-shrink: 0;
  }
  .sb-live    { font-size: 0.72rem; color: #81c784; font-weight: 600; }
  .sb-version { font-size: 0.65rem; color: #4a7a4a; }

  /* ══ MAIN ════════════════════════════════════════════════════════════════════ */
  .main { flex: 1; min-width: 0; display: flex; flex-direction: column; }

  /* ── Top bar ── */
  .topbar {
    background: #0a160a;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    padding: 0 1.5rem;
    height: 60px;
    display: flex;
    align-items: center;
    gap: 1rem;
    position: sticky;
    top: 0;
    z-index: 50;
  }
  .hamburger {
    display: none; flex-direction: column; gap: 4px; background: none; border: none; cursor: pointer; padding: 4px;
  }
  .hamburger span { display: block; width: 20px; height: 2px; background: #a5d6a7; border-radius: 2px; }
  .topbar-brand { flex: 1; }
  .topbar-brand h1 { font-size: 1rem; font-weight: 800; color: #fff; }
  .topbar-date   { font-size: 0.68rem; color: #4a7a4a; margin-top: 0.1rem; }
  .topbar-chip {
    display: flex; align-items: center; gap: 0.4rem;
    background: rgba(46,125,50,0.3); border: 1px solid rgba(76,175,80,0.4);
    color: #a5d6a7; font-size: 0.75rem; font-weight: 600;
    padding: 0.3rem 0.85rem; border-radius: var(--radius-full);
    white-space: nowrap;
  }
  .chip-dot { width: 6px; height: 6px; border-radius: 50%; background: #69f0ae; box-shadow: 0 0 6px #69f0ae; animation: pulse 2s infinite; }

  /* ══ SECTIONS ════════════════════════════════════════════════════════════════ */
  .section       { padding: 2.5rem 1.5rem; background: var(--c-bg); }
  .section-white { background: var(--c-bg2); }
  .section-inner { max-width: 1200px; margin: 0 auto; }
  .section-title { font-size: 1.4rem; font-weight: 800; color: #fff; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem; }
  .section-title.light { color: #fff; }
  .section-white .section-title { color: var(--c-primary-dark); }
  .section-sub { font-size: 0.82rem; color: #5a8a5a; margin-bottom: 1rem; margin-top: -1rem; }
  .map-tag { background: var(--c-gold); color: #fff; font-size: 0.65rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: var(--radius-full); letter-spacing: 0.05em; }

  /* ══ GLASS HERO ══════════════════════════════════════════════════════════════ */
  .glass-hero {
    background: rgba(255,255,255,0.07);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: var(--radius-xl);
    padding: 2rem 2.5rem;
    margin-bottom: 1.25rem;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
  }
  .glass-label { font-size: 0.75rem; font-weight: 700; color: #a5d6a7; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.5rem; }
  .glass-number { font-size: 4rem; font-weight: 900; color: #fff; line-height: 1; letter-spacing: -0.03em; }
  .glass-unit   { font-size: 1.6rem; font-weight: 600; color: #81c784; margin-left: 0.25rem; }
  .glass-sub    { font-size: 0.8rem; color: #81c784; margin-top: 0.4rem; }
  .glass-gps    { display: flex; align-items: center; gap: 0.6rem; }
  .gps-pulse {
    width: 10px; height: 10px; border-radius: 50%;
    background: var(--c-gold); box-shadow: 0 0 0 0 rgba(255,143,0,0.7);
    animation: gps-ping 1.5s infinite;
  }
  .gps-coords { font-size: 0.78rem; color: #ffc107; font-weight: 600; font-family: monospace; }

  /* ══ STATS GLASS CARDS ═══════════════════════════════════════════════════════ */
  .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
  .glass-card {
    background: rgba(255,255,255,0.08);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: var(--radius-xl);
    padding: 1.5rem;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .glass-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.3); }
  .stat-blue   { border-top: 3px solid #42a5f5; }
  .stat-gold   { border-top: 3px solid var(--c-gold); }
  .stat-purple { border-top: 3px solid #ab47bc; }
  .sc-icon  { font-size: 1.5rem; margin-bottom: 0.5rem; }
  .sc-label { font-size: 0.68rem; font-weight: 700; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.4rem; }
  .sc-value { font-size: 2.2rem; font-weight: 900; color: #fff; line-height: 1; }
  .sc-unit  { font-size: 1rem; font-weight: 500; color: rgba(255,255,255,0.5); }
  .sc-sub   { font-size: 0.7rem; color: rgba(255,255,255,0.45); margin-top: 0.35rem; }
  .top-v    { font-size: 1.4rem; word-break: break-word; }

  /* ══ TWO-COLUMN LAYOUT ═══════════════════════════════════════════════════════ */
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }

  /* ══ CARDS ═══════════════════════════════════════════════════════════════════ */
  .card { background: #fff; border-radius: var(--radius-xl); overflow: hidden; box-shadow: var(--shadow-card); }
  .card-header {
    background: var(--c-primary-dark);
    color: #fff; padding: 1rem 1.25rem;
    font-size: 0.88rem; font-weight: 700; letter-spacing: 0.02em;
  }
  .harvest-hdr { background: var(--c-gold-dark); }

  /* ══ FORM ════════════════════════════════════════════════════════════════════ */
  .form { padding: 1.25rem; display: flex; flex-direction: column; gap: 0.9rem; }
  .field { display: flex; flex-direction: column; gap: 0.3rem; }
  .field label {
    font-size: 0.7rem; font-weight: 700; color: var(--c-primary);
    text-transform: uppercase; letter-spacing: 0.07em;
  }
  .field input, .field select {
    padding: 0.72rem 0.9rem;
    border: 1.5px solid #e0e0e0; border-radius: var(--radius-md);
    font-family: 'Inter', sans-serif; font-size: 0.93rem; color: #1a1a1a;
    background: #fafafa; transition: border-color 0.15s, box-shadow 0.15s; width: 100%;
  }
  .field input:focus, .field select:focus {
    outline: none; border-color: var(--c-primary);
    box-shadow: 0 0 0 3px rgba(46,125,50,0.15);
  }
  .field input:disabled, .field select:disabled { opacity: 0.55; }

  /* ══ BUTTONS ═════════════════════════════════════════════════════════════════ */
  .btn {
    width: 100%; padding: 0.85rem; border: none; border-radius: var(--radius-full);
    font-family: 'Inter', sans-serif; font-size: 0.92rem; font-weight: 700;
    cursor: pointer; letter-spacing: 0.03em;
    display: flex; align-items: center; justify-content: center; gap: 0.4rem;
    transition: transform 0.15s, box-shadow 0.15s, filter 0.15s;
    margin-top: 0.25rem;
  }
  .btn:hover:not(:disabled)  { transform: translateY(-2px); filter: brightness(1.08); box-shadow: 0 6px 20px rgba(0,0,0,0.2); }
  .btn:active:not(:disabled) { transform: none; }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-primary { background: var(--c-primary); color: #fff; box-shadow: 0 2px 12px rgba(46,125,50,0.3); }
  .btn-gold    { background: var(--c-gold);    color: #fff; box-shadow: 0 2px 12px rgba(255,143,0,0.3); }
  .del-btn {
    background: none; border: 1px solid #ffcdd2; border-radius: var(--radius-md);
    color: #ef5350; font-size: 0.85rem; cursor: pointer; padding: 0.3rem 0.45rem;
    transition: background 0.15s, transform 0.1s; line-height: 1; flex-shrink: 0;
  }
  .del-btn:hover { background: #ffebee; transform: scale(1.1); }

  /* ══ ALERTS ══════════════════════════════════════════════════════════════════ */
  .alert { padding: 0.65rem 1rem; border-radius: var(--radius-md); font-size: 0.83rem; font-weight: 600; text-align: center; }
  .alert-success { background: #e8f5e9; color: #1b5e20; border: 1px solid #a5d6a7; }
  .alert-error   { background: #ffebee; color: #c62828; border: 1px solid #ef9a9a; }

  /* ══ GPS ROW ═════════════════════════════════════════════════════════════════ */
  .gps-row { display: flex; align-items: center; }
  .gps-tag { font-size: 0.74rem; padding: 0.3rem 0.75rem; border-radius: var(--radius-full); background: rgba(0,0,0,0.05); color: #666; }
  .gps-ok   { background: #e8f5e9; color: #1b5e20; }
  .gps-wait { background: #fff8e1; color: #e65100; }
  .gps-na   { background: #ffebee; color: #c62828; }

  /* ══ LIST ROWS ═══════════════════════════════════════════════════════════════ */
  .list { list-style: none; max-height: 380px; overflow-y: auto; }
  .list-row {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 0.75rem 1.1rem;
    border-bottom: 1px solid #f0f0f0;
    transition: background 0.15s;
    cursor: default;
  }
  .list-row:last-child { border-bottom: none; }
  .worker-row:hover { background: rgba(100, 221, 23, 0.08); }
  .log-row:hover    { background: rgba(255,143,0,0.07); }
  .row-num {
    width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
    background: var(--c-primary); color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.68rem; font-weight: 800;
  }
  .harvest-num { background: var(--c-gold-dark); }
  .row-info  { flex: 1; min-width: 0; }
  .row-name  { font-size: 0.88rem; font-weight: 700; color: #1a1a1a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .row-sub   { font-size: 0.72rem; color: #888; margin-top: 0.1rem; }
  .badge-active { background: #e8f5e9; color: var(--c-primary); font-size: 0.65rem; font-weight: 700; padding: 0.15rem 0.55rem; border-radius: var(--radius-full); border: 1px solid #c8e6c9; flex-shrink: 0; }
  .log-weight { font-size: 0.88rem; font-weight: 800; color: var(--c-gold-dark); white-space: nowrap; }

  /* ══ SEARCH ══════════════════════════════════════════════════════════════════ */
  .search-wrap {
    display: flex; align-items: center; gap: 0.5rem;
    margin: 0.85rem 1.1rem;
    background: #f4f4f4; border: 1.5px solid #e8e8e8;
    border-radius: var(--radius-full); padding: 0.48rem 1rem;
    transition: border-color 0.15s;
  }
  .search-wrap:focus-within { border-color: var(--c-primary); background: #fff; }
  .search-input { flex: 1; border: none; background: transparent; font-family: 'Inter', sans-serif; font-size: 0.88rem; color: #1a1a1a; outline: none; }
  .search-input::placeholder { color: #bbb; }
  .clear-btn { background: none; border: none; color: #bbb; cursor: pointer; font-size: 0.75rem; }
  .clear-btn:hover { color: #555; }

  /* ══ STATES ══════════════════════════════════════════════════════════════════ */
  .loading-state { padding: 2.5rem 1rem; text-align: center; }
  .sprout { font-size: 2.5rem; display: block; animation: grow 1.2s ease-in-out infinite alternate; margin-bottom: 0.5rem; }
  .loading-state p { font-size: 0.85rem; color: #999; }
  .empty-state  { padding: 2rem 1rem; text-align: center; color: #aaa; }
  .empty-state span { font-size: 2rem; display: block; margin-bottom: 0.4rem; }
  .empty-state p { font-size: 0.85rem; font-weight: 600; }

  /* ══ MAP ═════════════════════════════════════════════════════════════════════ */
  .map-wrap { height: 480px; border-radius: var(--radius-xl); overflow: hidden; box-shadow: var(--shadow-deep); }
  .map-hint { font-size: 0.78rem; color: #5a8a5a; text-align: center; margin-top: 0.75rem; }
  :global(.map-pin) {
    width: 36px; height: 36px; background: var(--c-gold); border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg); display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 2px solid #fff;
  }
  :global(.map-pin span) { transform: rotate(45deg); font-size: 1rem; }

  /* ══ REPORTS ═════════════════════════════════════════════════════════════════ */
  .report-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem; }
  .report-card {
    background: rgba(255,255,255,0.07);
    backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: var(--radius-xl); padding: 1.5rem;
    transition: transform 0.2s;
  }
  .report-card:hover { transform: translateY(-3px); }
  .rcard-icon  { font-size: 2rem; margin-bottom: 0.6rem; }
  .rcard-title { font-size: 0.9rem; font-weight: 700; color: #fff; margin-bottom: 0.3rem; }
  .rcard-sub   { font-size: 0.78rem; color: rgba(255,255,255,0.55); }
  .export-row  { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
  .export-note { font-size: 0.82rem; color: #81c784; }
  .btn-export  {
    background: transparent; color: #fff; border: 2px solid var(--c-primary-light);
    border-radius: var(--radius-full); padding: 0.75rem 1.75rem;
    font-family: 'Inter', sans-serif; font-size: 0.88rem; font-weight: 700; cursor: pointer;
    transition: background 0.18s, color 0.18s; white-space: nowrap;
    display: inline-flex; align-items: center; gap: 0.4rem; width: auto;
  }
  .btn-export:hover { background: var(--c-primary-light); color: #fff; }

  /* ══ OVERLAY (mobile) ════════════════════════════════════════════════════════ */
  .overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.55);
    z-index: 90; backdrop-filter: blur(2px);
  }

  /* ══ SPINNER ═════════════════════════════════════════════════════════════════ */
  .spinner {
    width: 14px; height: 14px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
    animation: spin 0.7s linear infinite; flex-shrink: 0;
  }

  /* ══ ANIMATIONS ══════════════════════════════════════════════════════════════ */
  @keyframes pulse   { 0%,100% { opacity:1; } 50% { opacity:0.35; } }
  @keyframes spin    { to { transform: rotate(360deg); } }
  @keyframes grow    { from { transform: scale(0.85); } to { transform: scale(1.15); } }
  @keyframes gps-ping {
    0%   { box-shadow: 0 0 0 0 rgba(255,193,7,0.7); }
    70%  { box-shadow: 0 0 0 10px rgba(255,193,7,0); }
    100% { box-shadow: 0 0 0 0 rgba(255,193,7,0); }
  }

  /* ══ RESPONSIVE ══════════════════════════════════════════════════════════════ */

  /* Tablet */
  @media (max-width: 1024px) {
    .stats-grid  { grid-template-columns: repeat(3,1fr); }
    .two-col     { grid-template-columns: 1fr; }
    .report-cards { grid-template-columns: 1fr 1fr; }
  }

  /* Mobile: sidebar off-canvas */
  @media (max-width: 768px) {
    .sidebar {
      position: fixed; top: 0; left: 0; height: 100vh;
      transform: translateX(-100%); z-index: 95;
    }
    .sidebar.open { transform: translateX(0); box-shadow: 4px 0 24px rgba(0,0,0,0.5); }
    .hamburger   { display: flex; }
    .main        { margin-left: 0; }
    .stats-grid  { grid-template-columns: 1fr 1fr; }
    .glass-number { font-size: 2.8rem; }
    .section     { padding: 1.75rem 1rem; }
    .map-wrap    { height: 340px; }
    .report-cards { grid-template-columns: 1fr; }
    .export-row  { flex-direction: column; align-items: stretch; }
    .btn-export  { width: 100%; justify-content: center; }
  }

  /* Small phone */
  @media (max-width: 480px) {
    .stats-grid  { grid-template-columns: 1fr; }
    .glass-number { font-size: 2.2rem; }
    .glass-hero  { padding: 1.25rem; }
    .section     { padding: 1.25rem 0.75rem; }
    .topbar      { padding: 0 1rem; }
  }
</style>
