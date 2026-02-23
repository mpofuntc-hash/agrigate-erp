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

    const obs = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (e.isIntersecting) activeSection = e.target.getAttribute("data-s") ?? "dashboard";
      }
    }, { threshold: 0.25 });
    document.querySelectorAll("[data-s]").forEach(el => obs.observe(el));

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

  $effect(() => {
    const logs = todayLogs;
    if (!leafletMap || !markerLayer) return;
    untrack(async () => {
      const L = (await import("leaflet")).default;
      markerLayer.clearLayers();
      for (const log of logs) {
        if (log.lat == null || log.lng == null) continue;
        const icon = L.divIcon({
          className: "",
          html: `<div class="map-pin"></div>`,
          iconSize: [10, 10], iconAnchor: [5, 5],
        });
        L.marker([log.lat, log.lng], { icon })
          .bindPopup(`<b>${workerName(log.workerId)}</b><br>${log.cropType} · ${log.binWeight} kg`)
          .addTo(markerLayer);
      }
    });
  });

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

  function exportCSV() { alert("Preparing export…"); }

  function scrollTo(section: string) {
    document.querySelector(`[data-s="${section}"]`)?.scrollIntoView({ behavior: "smooth" });
    sidebarOpen = false;
  }

  const navItems = [
    { id: "dashboard", label: "Overview"  },
    { id: "workers",   label: "Personnel" },
    { id: "yield",     label: "Harvest"   },
    { id: "map",       label: "Field Map" },
    { id: "reports",   label: "Reports"   },
  ];
</script>

<svelte:head>
  <title>ZZ2 AgriGate — Worker Hub</title>
</svelte:head>

<!-- Subtle orchard corner photo -->
<div class="corner-photo" aria-hidden="true"></div>

{#if sidebarOpen}
  <div class="overlay" role="button" tabindex="-1"
       onclick={() => sidebarOpen = false} onkeydown={() => {}}></div>
{/if}

<div class="shell">

  <!-- ══ SIDEBAR ══════════════════════════════════════════════════════════════ -->
  <nav class="sidebar" class:open={sidebarOpen}>
    <div class="sb-brand">
      <p class="sb-app">AgriGate ERP</p>
      <p class="sb-farm">ZZ2 Farms</p>
    </div>

    <ul class="sb-nav">
      {#each navItems as item}
        <li>
          <button
            class="sb-item"
            class:active={activeSection === item.id}
            onclick={() => scrollTo(item.id)}
          >
            <span class="sb-label">{item.label}</span>
            {#if item.id === "dashboard" && totalBins > 0}
              <span class="sb-badge">{totalBins}</span>
            {/if}
          </button>
        </li>
      {/each}
    </ul>

    <div class="sb-footer">
      <div class="sb-sync-row">
        <span class="glow-dot glow-green"></span>
        <span class="sb-sync-label">Live Sync Active</span>
      </div>
      <p class="sb-version">v1.0.4-PRO</p>
    </div>
  </nav>

  <!-- ══ MAIN ══════════════════════════════════════════════════════════════════ -->
  <div class="main">

    <!-- System status bar -->
    <div class="status-bar">
      <span class="st-item">
        <span class="glow-dot glow-green"></span>Cloud Sync: Active
      </span>
      <span class="st-sep">·</span>
      <span class="st-item">
        <span class="glow-dot glow-green"></span>GPS: Fixed
      </span>
      <span class="st-sep">·</span>
      <span class="st-item st-muted">Version 1.0.4-PRO</span>
      <div class="st-right">
        <span class="st-item">{workers.length} registered workers</span>
      </div>
    </div>

    <!-- Top bar -->
    <header class="topbar">
      <button class="hamburger" onclick={() => sidebarOpen = !sidebarOpen} aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
      <div class="topbar-brand">
        <h1>ZZ2 Worker Hub</h1>
        <p class="topbar-date">{new Date().toLocaleDateString("en-ZA", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}</p>
      </div>
    </header>

    <!-- ══ OVERVIEW ══════════════════════════════════════════════════════════ -->
    <section class="section" data-s="dashboard">
      <div class="section-inner">
        <p class="section-eyebrow">Today's Performance</p>
        <div class="kpi-grid">
          <div class="kpi-tile">
            <p class="kpi-label">Total Tonnage</p>
            <p class="kpi-value">{displayTonnage.toFixed(3)}<span class="kpi-unit">t</span></p>
          </div>
          <div class="kpi-tile">
            <p class="kpi-label">Bins Logged</p>
            <p class="kpi-value">{totalBins}</p>
          </div>
          <div class="kpi-tile">
            <p class="kpi-label">Active Workers</p>
            <p class="kpi-value">{activeWorkerCount}</p>
          </div>
          <div class="kpi-tile">
            <p class="kpi-label">Avg Bin Weight</p>
            <p class="kpi-value">{avgBinWeight.toFixed(1)}<span class="kpi-unit">kg</span></p>
          </div>
          <div class="kpi-tile">
            <p class="kpi-label">Total Harvested</p>
            <p class="kpi-value">{totalKg.toFixed(0)}<span class="kpi-unit">kg</span></p>
          </div>
          <div class="kpi-tile">
            <p class="kpi-label">Top Village</p>
            <p class="kpi-value kpi-text">{topVillage}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ══ PERSONNEL ══════════════════════════════════════════════════════════ -->
    <section class="section section-alt" data-s="workers">
      <div class="section-inner">
        <div class="section-hdr">
          <h2 class="section-title">Personnel Registry</h2>
        </div>
        <div class="two-col">

          <!-- Registration form -->
          <div class="panel">
            <div class="panel-hdr">New Registration</div>
            <form onsubmit={registerWorker} class="form">
              <div class="field">
                <label>Full Name</label>
                <input type="text" bind:value={wName} placeholder="e.g. Thabo Nkosi"
                       required disabled={saving} />
              </div>
              <div class="field">
                <label>SA ID Number</label>
                <input type="text" bind:value={wSaId} placeholder="13-digit SA ID"
                       maxlength="13" required disabled={saving} />
              </div>
              <div class="field">
                <label>Village / Area</label>
                <input type="text" bind:value={wVillage} placeholder="e.g. Tzaneen"
                       required disabled={saving} />
              </div>
              <button type="submit" class="btn" disabled={saving}>
                {#if saving}<span class="spinner"></span>Saving…{:else}Confirm Registration{/if}
              </button>
              {#if saved}<div class="alert alert-ok">Worker registered.</div>{/if}
              {#if regError}<div class="alert alert-err">{regError}</div>{/if}
            </form>
          </div>

          <!-- Personnel table -->
          <div class="panel">
            <div class="panel-hdr">
              Registered Personnel
              <div class="search-wrap">
                <svg class="search-icon" viewBox="0 0 16 16" fill="none"
                     stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                  <circle cx="6.5" cy="6.5" r="4.5"/>
                  <path d="M11 11l3 3"/>
                </svg>
                <input class="search-input" type="text" bind:value={search}
                       placeholder="Filter by village…" />
                {#if search}
                  <button class="clear-btn" onclick={() => search = ""}>×</button>
                {/if}
              </div>
            </div>

            {#if !dataLoaded}
              <div class="empty-state"><p>Connecting…</p></div>
            {:else if workers.length === 0}
              <div class="empty-state"><p>No workers registered.</p></div>
            {:else if filtered.length === 0}
              <div class="empty-state"><p>No match for "{search}".</p></div>
            {:else}
              <div class="table-scroll">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>SA ID</th>
                      <th>Village</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each filtered as w, i}
                      <tr class="tr">
                        <td class="td-n">{filtered.length - i}</td>
                        <td class="td-name">{w.name}</td>
                        <td class="td-mono">{w.saId}</td>
                        <td>{w.village}</td>
                        <td><span class="glow-dot glow-green" title="Active"></span></td>
                        <td>
                          <button class="del-btn" title="Remove worker"
                                  onclick={() => removeWorker(w._id)}>×</button>
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </section>

    <!-- ══ HARVEST LOGGER ═════════════════════════════════════════════════════ -->
    <section class="section" data-s="yield">
      <div class="section-inner">
        <div class="section-hdr">
          <h2 class="section-title">Harvest Logger</h2>
        </div>
        <div class="two-col">

          <!-- Log form -->
          <div class="panel">
            <div class="panel-hdr">Log Bin Entry</div>
            <form onsubmit={logBin} class="form">
              <div class="field">
                <label>Worker</label>
                <select bind:value={selectedWorker} required disabled={logging}>
                  <option value="" disabled>— Select worker —</option>
                  {#each workers as w}
                    <option value={w._id}>{w.name} · {w.village}</option>
                  {/each}
                </select>
              </div>
              <div class="field">
                <label>Crop Type</label>
                <select bind:value={cropType} disabled={logging}>
                  <option>Tomatoes</option><option>Avocados</option>
                  <option>Mangoes</option><option>Citrus</option>
                  <option>Peppers</option><option>Butternut</option><option>Other</option>
                </select>
              </div>
              <div class="field">
                <label>Bin Weight (kg)</label>
                <input type="number" min="0.1" step="0.1" bind:value={binWeight}
                       placeholder="e.g. 850" required disabled={logging} />
              </div>
              <div class="gps-row">
                {#if gpsStatus === "capturing"}
                  <span class="gps-tag gps-wait">Capturing GPS…</span>
                {:else if gpsStatus === "ok"}
                  <span class="gps-tag gps-ok">GPS Captured</span>
                {:else if gpsStatus === "denied"}
                  <span class="gps-tag gps-na">GPS Unavailable</span>
                {:else}
                  <span class="gps-tag">GPS auto-captured on submit</span>
                {/if}
              </div>
              <button type="submit" class="btn" disabled={logging || !selectedWorker}>
                {#if logging}<span class="spinner"></span>Saving…{:else}Log Bin{/if}
              </button>
              {#if logged}<div class="alert alert-ok">Bin logged.</div>{/if}
              {#if logError}<div class="alert alert-err">{logError}</div>{/if}
            </form>
          </div>

          <!-- Today's bins table -->
          <div class="panel">
            <div class="panel-hdr">Today's Bins ({totalBins})</div>
            {#if todayLogs.length === 0}
              <div class="empty-state"><p>No bins logged today.</p></div>
            {:else}
              <div class="table-scroll">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Worker</th>
                      <th>Crop</th>
                      <th>kg</th>
                      <th>Time</th>
                      <th>GPS</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each todayLogs as log, i}
                      <tr class="tr">
                        <td class="td-n">{todayLogs.length - i}</td>
                        <td class="td-name">{workerName(log.workerId)}</td>
                        <td>{log.cropType}</td>
                        <td class="td-weight">{log.binWeight}</td>
                        <td class="td-mono">{new Date(log.timestamp).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}</td>
                        <td>
                          {#if log.lat}
                            <span class="glow-dot glow-green" title="GPS fixed"></span>
                          {:else}
                            <span class="td-na">—</span>
                          {/if}
                        </td>
                        <td>
                          <button class="del-btn" onclick={() => removeLog(log._id)}>×</button>
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </section>

    <!-- ══ FIELD MAP ══════════════════════════════════════════════════════════ -->
    <section class="section section-alt" data-s="map">
      <div class="section-inner">
        <div class="section-hdr">
          <h2 class="section-title">
            Field Map
            <span class="tag">Satellite</span>
          </h2>
        </div>
        <p class="section-sub">GPS pins populate automatically when a bin is logged with location data.</p>
        <div class="map-wrap" bind:this={mapEl}></div>
      </div>
    </section>

    <!-- ══ REPORTS ════════════════════════════════════════════════════════════ -->
    <section class="section" data-s="reports">
      <div class="section-inner">
        <div class="section-hdr">
          <h2 class="section-title">Reports</h2>
        </div>
        <div class="kpi-grid kpi-grid--sm">
          <div class="kpi-tile">
            <p class="kpi-label">Daily Bins</p>
            <p class="kpi-value">{totalBins}</p>
          </div>
          <div class="kpi-tile">
            <p class="kpi-label">Total Tonnage</p>
            <p class="kpi-value">{totalTonnage.toFixed(3)}<span class="kpi-unit">t</span></p>
          </div>
          <div class="kpi-tile">
            <p class="kpi-label">Active Workers</p>
            <p class="kpi-value">{activeWorkerCount}</p>
          </div>
          <div class="kpi-tile">
            <p class="kpi-label">Avg Bin Weight</p>
            <p class="kpi-value">{avgBinWeight.toFixed(1)}<span class="kpi-unit">kg</span></p>
          </div>
        </div>
        <div class="export-row">
          <p class="export-note">Export today's harvest data for payroll processing</p>
          <button class="btn btn-export" onclick={exportCSV}>
            <svg class="btn-icon" viewBox="0 0 16 16" fill="none"
                 stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path d="M8 2v8M4 8l4 4 4-4M2 14h12"/>
            </svg>
            Export to CSV
          </button>
        </div>
      </div>
    </section>

  </div><!-- /main -->
</div><!-- /shell -->

<!-- Mobile bottom nav -->
<nav class="bottom-nav" aria-label="Section navigation">
  {#each navItems as item}
    <button
      class="bn-item"
      class:active={activeSection === item.id}
      onclick={() => scrollTo(item.id)}
    >
      <span class="bn-label">{item.label}</span>
      {#if item.id === "dashboard" && totalBins > 0}
        <span class="bn-badge">{totalBins}</span>
      {/if}
    </button>
  {/each}
</nav>

<style>
  /* ══ DESIGN TOKENS ═══════════════════════════════════════════════════════════ */
  :global(*), :global(*::before), :global(*::after) { box-sizing: border-box; margin: 0; padding: 0; }
  :global(body) {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    background: #1a1f1c;
    color: #cdd8ce;
    --bg:           #1a1f1c;
    --bg-alt:       #1c2220;
    --bg-panel:     #202621;
    --bg-elevated:  #252d26;
    --border:       rgba(255,255,255,0.07);
    --border-mid:   rgba(255,255,255,0.11);
    --text-1:       #dce8dd;
    --text-2:       #7a8f7d;
    --text-3:       #445447;
    --olive:        #4a7c59;
    --olive-dark:   #2a3d30;
    --olive-light:  #5c9470;
    --glow-green:   #22c55e;
    --glow-amber:   #f59e0b;
    --r-sm:         3px;
    --r-md:         6px;
    --shadow:       0 1px 6px rgba(0,0,0,0.35);
  }

  /* ══ CORNER ORCHARD PHOTO ════════════════════════════════════════════════════ */
  .corner-photo {
    position: fixed;
    bottom: 0; right: 0;
    width: 42vw; height: 52vh;
    background-image: url('/waqar-mujahid-NU_s4KI_zME-unsplash.jpg');
    background-size: cover;
    background-position: center;
    opacity: 0.07;
    pointer-events: none;
    z-index: 0;
    mask-image: linear-gradient(to top left, rgba(0,0,0,0.7) 0%, transparent 65%);
    -webkit-mask-image: linear-gradient(to top left, rgba(0,0,0,0.7) 0%, transparent 65%);
  }

  /* ══ SHELL ═══════════════════════════════════════════════════════════════════ */
  .shell { display: flex; min-height: 100vh; position: relative; z-index: 1; }

  /* ══ SIDEBAR ═════════════════════════════════════════════════════════════════ */
  .sidebar {
    width: 216px; min-height: 100vh;
    background: #111613;
    border-right: 1px solid var(--border);
    display: flex; flex-direction: column;
    position: sticky; top: 0; height: 100vh;
    overflow-y: auto; flex-shrink: 0; z-index: 100;
    transition: transform 0.25s ease;
  }
  .sb-brand {
    padding: 1.2rem 1rem 0.9rem;
    border-bottom: 1px solid var(--border);
  }
  .sb-app  { font-size: 0.58rem; color: var(--olive-light); letter-spacing: 0.18em; text-transform: uppercase; font-weight: 700; margin-bottom: 0.2rem; }
  .sb-farm { font-size: 0.95rem; font-weight: 800; color: var(--text-1); letter-spacing: -0.01em; }

  .sb-nav { list-style: none; padding: 0.65rem 0.5rem; flex: 1; display: flex; flex-direction: column; gap: 0.1rem; }
  .sb-item {
    width: 100%; display: flex; align-items: center; justify-content: space-between;
    padding: 0.5rem 0.8rem; border-radius: var(--r-sm);
    background: none; border: none; color: var(--text-2);
    font-family: 'Inter', sans-serif; font-size: 0.78rem; font-weight: 500;
    cursor: pointer; text-align: left; letter-spacing: 0.01em;
    transition: background 0.12s, color 0.12s;
  }
  .sb-item:hover  { background: rgba(255,255,255,0.04); color: var(--text-1); }
  .sb-item.active {
    background: var(--olive-dark); color: var(--text-1); font-weight: 600;
    border-left: 2px solid var(--olive); padding-left: calc(0.8rem - 2px);
  }
  .sb-label { flex: 1; }
  .sb-badge {
    background: var(--glow-amber); color: #000;
    font-size: 0.56rem; font-weight: 800;
    padding: 0.05rem 0.38rem; border-radius: 999px; min-width: 16px; text-align: center;
  }
  .sb-footer { padding: 0.8rem 1rem; border-top: 1px solid var(--border); }
  .sb-sync-row { display: flex; align-items: center; gap: 0.45rem; margin-bottom: 0.2rem; }
  .sb-sync-label { font-size: 0.65rem; color: var(--text-2); }
  .sb-version    { font-size: 0.6rem; color: var(--text-3); }

  /* ══ GLOW DOTS ═══════════════════════════════════════════════════════════════ */
  .glow-dot {
    display: inline-block; flex-shrink: 0;
    width: 8px; height: 8px; border-radius: 50%;
  }
  .glow-green { background: var(--glow-green); box-shadow: 0 0 10px var(--glow-green); }
  .glow-amber { background: var(--glow-amber); box-shadow: 0 0 10px var(--glow-amber); }

  /* ══ MAIN ════════════════════════════════════════════════════════════════════ */
  .main { flex: 1; min-width: 0; display: flex; flex-direction: column; }

  /* System status bar */
  .status-bar {
    background: #0f1410;
    border-bottom: 1px solid var(--border);
    height: 28px; padding: 0 1.5rem;
    display: flex; align-items: center; gap: 0.8rem;
    font-size: 0.65rem; color: var(--text-2); letter-spacing: 0.02em;
    position: sticky; top: 0; z-index: 60;
    flex-shrink: 0;
  }
  .st-item  { display: flex; align-items: center; gap: 0.38rem; }
  .st-sep   { color: var(--text-3); }
  .st-muted { color: var(--text-3); }
  .st-right { margin-left: auto; }

  /* Top bar */
  .topbar {
    background: var(--bg-alt);
    border-bottom: 1px solid var(--border);
    padding: 0 1.5rem; height: 50px;
    display: flex; align-items: center; gap: 1rem;
    position: sticky; top: 28px; z-index: 50; flex-shrink: 0;
  }
  .hamburger {
    display: none; flex-direction: column; gap: 4px;
    background: none; border: none; cursor: pointer; padding: 4px;
  }
  .hamburger span { display: block; width: 18px; height: 1.5px; background: var(--text-2); border-radius: 1px; }
  .topbar-brand { flex: 1; }
  .topbar-brand h1 { font-size: 0.88rem; font-weight: 700; color: var(--text-1); letter-spacing: 0.01em; }
  .topbar-date    { font-size: 0.62rem; color: var(--text-3); margin-top: 0.1rem; }

  /* ══ SECTIONS ════════════════════════════════════════════════════════════════ */
  .section     { padding: 1.75rem 1.5rem; background: var(--bg); }
  .section-alt { background: var(--bg-alt); }
  .section-inner { max-width: 1200px; margin: 0 auto; }
  .section-hdr {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 1.1rem;
  }
  .section-eyebrow {
    font-size: 0.6rem; font-weight: 700; color: var(--text-3);
    text-transform: uppercase; letter-spacing: 0.14em; margin-bottom: 0.6rem;
  }
  .section-title { font-size: 0.95rem; font-weight: 700; color: var(--text-1); display: flex; align-items: center; gap: 0.6rem; }
  .section-sub   { font-size: 0.75rem; color: var(--text-2); margin-bottom: 0.85rem; margin-top: -0.6rem; }
  .tag {
    font-size: 0.56rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
    padding: 0.12rem 0.45rem; border-radius: var(--r-sm);
    background: rgba(74,124,89,0.18); color: var(--olive-light);
    border: 1px solid rgba(74,124,89,0.35);
  }

  /* ══ KPI GRID ════════════════════════════════════════════════════════════════ */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1px; background: var(--border-mid);
    border: 1px solid var(--border-mid); border-radius: var(--r-md);
    overflow: hidden;
  }
  .kpi-grid--sm { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); }
  .kpi-tile {
    background: var(--bg-panel); padding: 1rem 1.1rem;
    transition: background 0.12s;
  }
  .kpi-tile:hover { background: var(--bg-elevated); }
  .kpi-label { font-size: 0.6rem; font-weight: 700; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.45rem; }
  .kpi-value { font-size: 1.7rem; font-weight: 800; color: var(--text-1); line-height: 1; letter-spacing: -0.03em; }
  .kpi-unit  { font-size: 0.78rem; font-weight: 400; color: var(--text-2); margin-left: 0.15rem; }
  .kpi-text  { font-size: 1rem; }

  /* ══ TWO-COL ═════════════════════════════════════════════════════════════════ */
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 0; }

  /* ══ PANELS ══════════════════════════════════════════════════════════════════ */
  .panel {
    background: var(--bg-panel);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    overflow: hidden;
    box-shadow: var(--shadow);
  }
  .panel-hdr {
    padding: 0.55rem 0.9rem;
    background: var(--bg-elevated);
    border-bottom: 1px solid var(--border);
    font-size: 0.65rem; font-weight: 700;
    color: var(--text-2); text-transform: uppercase; letter-spacing: 0.1em;
    display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
    flex-wrap: wrap;
  }

  /* ══ HIGH-DENSITY DATA TABLES ════════════════════════════════════════════════ */
  .table-scroll { overflow-y: auto; max-height: 340px; }
  .data-table   { width: 100%; border-collapse: collapse; font-size: 0.75rem; color: var(--text-1); }
  .data-table thead tr  { border-bottom: 1px solid var(--border-mid); }
  .data-table th {
    padding: 0.38rem 0.7rem;
    font-size: 0.58rem; font-weight: 700; color: var(--text-3);
    text-transform: uppercase; letter-spacing: 0.1em; text-align: left;
    background: var(--bg-elevated); position: sticky; top: 0; z-index: 2;
  }
  .data-table td { padding: 0.34rem 0.7rem; border-bottom: 1px solid var(--border); vertical-align: middle; }
  .tr:hover td  { background: rgba(255,255,255,0.02); }
  .tr:last-child td { border-bottom: none; }
  .td-n      { color: var(--text-3); font-size: 0.62rem; width: 26px; }
  .td-name   { font-weight: 600; }
  .td-mono   { font-family: 'Courier New', monospace; font-size: 0.7rem; color: var(--text-2); letter-spacing: 0.04em; }
  .td-weight { font-weight: 700; color: var(--olive-light); }
  .td-na     { color: var(--text-3); }

  /* ══ FORM ════════════════════════════════════════════════════════════════════ */
  .form  { padding: 0.9rem; display: flex; flex-direction: column; gap: 0.65rem; }
  .field { display: flex; flex-direction: column; gap: 0.28rem; }
  .field label {
    font-size: 0.6rem; font-weight: 700; color: var(--text-3);
    text-transform: uppercase; letter-spacing: 0.1em;
  }
  .field input, .field select {
    padding: 0.5rem 0.7rem;
    background: var(--bg); border: 1px solid var(--border-mid); border-radius: var(--r-sm);
    font-family: 'Inter', sans-serif; font-size: 0.8rem; color: var(--text-1); width: 100%;
    transition: border-color 0.12s;
  }
  .field input:focus, .field select:focus {
    outline: none; border-color: var(--olive);
    box-shadow: 0 0 0 2px rgba(74,124,89,0.15);
  }
  .field input:disabled, .field select:disabled { opacity: 0.4; }
  .field select option { background: var(--bg-panel); }

  /* ══ BUTTONS — Muted Olive with 2px border ═══════════════════════════════════ */
  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem;
    padding: 0.55rem 1rem; width: 100%; margin-top: 0.2rem;
    background: var(--olive-dark); color: #bfd4bf;
    border: 2px solid var(--olive); border-radius: var(--r-sm);
    font-family: 'Inter', sans-serif; font-size: 0.78rem; font-weight: 600;
    cursor: pointer; letter-spacing: 0.03em;
    transition: background 0.12s, border-color 0.12s, color 0.12s;
  }
  .btn:hover:not(:disabled)  { background: #334a38; border-color: var(--olive-light); color: #d5e8d5; }
  .btn:active:not(:disabled) { background: #243329; }
  .btn:disabled { opacity: 0.38; cursor: not-allowed; }

  .btn-export {
    width: auto; background: transparent;
    color: var(--text-2); border-color: var(--border-mid);
  }
  .btn-export:hover { border-color: var(--olive); color: var(--text-1); background: var(--olive-dark); }
  .btn-icon { width: 13px; height: 13px; }

  .del-btn {
    background: none; border: 1px solid rgba(220,80,80,0.25); border-radius: var(--r-sm);
    color: #c47070; font-size: 0.82rem; font-weight: 700;
    cursor: pointer; padding: 0.08rem 0.32rem; line-height: 1;
    transition: background 0.12s;
  }
  .del-btn:hover { background: rgba(220,80,80,0.1); color: #e08080; }

  /* ══ ALERTS ══════════════════════════════════════════════════════════════════ */
  .alert { padding: 0.45rem 0.7rem; border-radius: var(--r-sm); font-size: 0.72rem; font-weight: 600; }
  .alert-ok  { background: rgba(34,197,94,0.07);  color: #4ade80; border: 1px solid rgba(34,197,94,0.18); }
  .alert-err { background: rgba(220,80,80,0.07);  color: #f08080; border: 1px solid rgba(220,80,80,0.18); }

  /* ══ GPS ═════════════════════════════════════════════════════════════════════ */
  .gps-row { display: flex; align-items: center; }
  .gps-tag { font-size: 0.68rem; padding: 0.22rem 0.55rem; border-radius: var(--r-sm); background: var(--bg); color: var(--text-3); border: 1px solid var(--border); }
  .gps-ok   { color: #4ade80; border-color: rgba(34,197,94,0.25); }
  .gps-wait { color: var(--glow-amber); border-color: rgba(245,158,11,0.25); }
  .gps-na   { color: #f08080; border-color: rgba(220,80,80,0.25); }

  /* ══ SEARCH ══════════════════════════════════════════════════════════════════ */
  .search-wrap {
    display: flex; align-items: center; gap: 0.38rem;
    background: var(--bg); border: 1px solid var(--border); border-radius: var(--r-sm);
    padding: 0.28rem 0.55rem; transition: border-color 0.12s; flex: 1; max-width: 200px;
  }
  .search-wrap:focus-within { border-color: var(--olive); }
  .search-icon  { width: 11px; height: 11px; color: var(--text-3); flex-shrink: 0; }
  .search-input { flex: 1; border: none; background: transparent; font-family: 'Inter', sans-serif; font-size: 0.72rem; color: var(--text-1); outline: none; }
  .search-input::placeholder { color: var(--text-3); }
  .clear-btn    { background: none; border: none; color: var(--text-3); cursor: pointer; font-size: 0.72rem; line-height: 1; }
  .clear-btn:hover { color: var(--text-1); }

  /* ══ EMPTY / LOADING ═════════════════════════════════════════════════════════ */
  .empty-state { padding: 1.75rem 1rem; text-align: center; }
  .empty-state p { font-size: 0.75rem; color: var(--text-3); }

  /* ══ MAP ═════════════════════════════════════════════════════════════════════ */
  .map-wrap { height: 420px; border-radius: var(--r-md); overflow: hidden; border: 1px solid var(--border); }
  :global(.map-pin) {
    width: 10px; height: 10px; border-radius: 50%;
    background: var(--glow-green); box-shadow: 0 0 8px var(--glow-green);
  }

  /* ══ EXPORT ROW ══════════════════════════════════════════════════════════════ */
  .export-row {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 1rem;
    padding-top: 1.1rem; margin-top: 1.1rem;
    border-top: 1px solid var(--border);
  }
  .export-note { font-size: 0.72rem; color: var(--text-2); }

  /* ══ OVERLAY ═════════════════════════════════════════════════════════════════ */
  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 90; }

  /* ══ SPINNER ═════════════════════════════════════════════════════════════════ */
  .spinner {
    width: 11px; height: 11px; border-radius: 50%;
    border: 1.5px solid rgba(200,220,200,0.25); border-top-color: #bfd4bf;
    animation: spin 0.7s linear infinite; flex-shrink: 0;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ══ MOBILE BOTTOM NAV ═══════════════════════════════════════════════════════ */
  .bottom-nav { display: none; }

  /* ══ RESPONSIVE ══════════════════════════════════════════════════════════════ */
  @media (max-width: 1024px) {
    .two-col { grid-template-columns: 1fr; }
    .kpi-grid { grid-template-columns: repeat(3,1fr); }
  }

  @media (max-width: 768px) {
    .sidebar { position: fixed; top: 0; left: 0; height: 100vh; transform: translateX(-100%); z-index: 95; }
    .sidebar.open { transform: translateX(0); box-shadow: 4px 0 20px rgba(0,0,0,0.5); }
    .hamburger { display: flex; }
    .main      { padding-bottom: 56px; }
    .section   { padding: 1.25rem 1rem; }
    .map-wrap  { height: 300px; }
    .status-bar { padding: 0 1rem; gap: 0.6rem; font-size: 0.6rem; }
    .topbar    { top: 28px; padding: 0 1rem; }
    .kpi-grid  { grid-template-columns: repeat(2,1fr); }

    .bottom-nav {
      display: flex; position: fixed; bottom: 0; left: 0; right: 0;
      background: #0f1410; border-top: 1px solid var(--border);
      z-index: 200; padding-bottom: env(safe-area-inset-bottom, 0px);
    }
    .bn-item {
      flex: 1; display: flex; flex-direction: column; align-items: center;
      gap: 0.15rem; padding: 0.65rem 0.25rem; position: relative;
      background: none; border: none; cursor: pointer;
      color: var(--text-3); font-family: 'Inter', sans-serif;
      transition: color 0.12s;
    }
    .bn-item:hover  { color: var(--text-2); }
    .bn-item.active { color: var(--text-1); border-top: 2px solid var(--olive); }
    .bn-label { font-size: 0.56rem; font-weight: 600; letter-spacing: 0.02em; }
    .bn-badge {
      position: absolute; top: 4px; right: calc(50% - 20px);
      background: var(--glow-amber); color: #000;
      font-size: 0.5rem; font-weight: 800; padding: 0.05rem 0.28rem;
      border-radius: 999px; min-width: 14px; text-align: center;
    }
  }

  @media (max-width: 480px) {
    .kpi-grid { grid-template-columns: 1fr 1fr; }
  }
</style>
