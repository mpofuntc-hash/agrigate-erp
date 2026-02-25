<script lang="ts">
  import { onMount, onDestroy, untrack } from "svelte";
  import { PUBLIC_CONVEX_URL } from "$env/static/public";

  type Worker          = { _id: string; name: string; saId: string; village: string };
  type YieldLog        = { _id: string; workerId: string; binWeight: number; cropType: string; timestamp: number; lat?: number; lng?: number };
  type RosterEntry     = { _id: string; date: string; workerId: string; orchardBlock: string; blockLat: number; blockLng: number; assignedBy: string };

  // ── Orchard blocks with ZZ2 Letsitele-area GPS centres ──────────────────────
  const ORCHARD_BLOCKS = [
    { id: "A-12-S4", label: "Block A-12, Sector 4", lat: -23.870, lng: 30.140 },
    { id: "A-8-S3",  label: "Block A-8, Sector 3",  lat: -23.872, lng: 30.142 },
    { id: "B-7-S2",  label: "Block B-7, Sector 2",  lat: -23.869, lng: 30.145 },
    { id: "B-3-S1",  label: "Block B-3, Sector 1",  lat: -23.875, lng: 30.138 },
    { id: "C-5-S4",  label: "Block C-5, Sector 4",  lat: -23.868, lng: 30.135 },
    { id: "C-9-S2",  label: "Block C-9, Sector 2",  lat: -23.878, lng: 30.143 },
    { id: "D-1-S1",  label: "Block D-1, Sector 1",  lat: -23.865, lng: 30.148 },
    { id: "D-6-S3",  label: "Block D-6, Sector 3",  lat: -23.882, lng: 30.136 },
  ];

  const OFFLINE_KEY = "agrigate_offline_queue";
  const TODAY = new Date().toISOString().slice(0, 10); // "2026-02-25"

  // ── Nav & Layout ─────────────────────────────────────────────────────────────
  let activeSection = $state("dashboard");
  let sidebarOpen   = $state(false);

  // ── Worker Registration ───────────────────────────────────────────────────────
  let wName = $state(""); let wSaId = $state(""); let wVillage = $state("");
  let saving = $state(false); let saved = $state(false); let regError = $state("");

  // ── Yield Logger ─────────────────────────────────────────────────────────────
  let selectedWorker = $state(""); let binWeight = $state("");
  let cropType  = $state("Tomatoes");
  let logging   = $state(false); let logged = $state(false); let logError = $state("");
  let gpsStatus = $state<"idle"|"capturing"|"ok"|"denied">("idle");
  let gpsDistanceM = $state<number | null>(null);

  // ── Roster ───────────────────────────────────────────────────────────────────
  let foremanInput        = $state("");
  let foremanOfDayName    = $state("");
  let savingForeman       = $state(false);
  let rosterAssignments   = $state<RosterEntry[]>([]);
  let selectedRosterWorker = $state("");
  let selectedBlock       = $state("");
  let savingRoster        = $state(false);
  let rosterSaved         = $state(false);

  // ── Eco-mode ─────────────────────────────────────────────────────────────────
  let ecoMode = $state(false);

  // ── Offline ──────────────────────────────────────────────────────────────────
  let isOnline     = $state(true);
  let offlineCount = $state(0);
  let syncing      = $state(false);

  // ── Data ─────────────────────────────────────────────────────────────────────
  let workers    = $state<Worker[]>([]);
  let todayLogs  = $state<YieldLog[]>([]);
  let dataLoaded = $state(false);
  let search     = $state("");

  // ── Derived metrics ──────────────────────────────────────────────────────────
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
  let binsPerHour = $derived((() => {
    if (totalBins === 0) return "0.0";
    const oldest = todayLogs[todayLogs.length - 1];
    const hrs = (Date.now() - oldest.timestamp) / 3_600_000;
    return hrs > 0.01 ? (totalBins / hrs).toFixed(1) : String(totalBins);
  })());

  // ── GPS Anti-Fraud ───────────────────────────────────────────────────────────
  let workerBlockAssignment = $derived(rosterAssignments.find(r => r.workerId === selectedWorker));
  let gpsLocked = $derived(gpsDistanceM !== null && gpsDistanceM <= 100);

  // ── Animated tonnage counter ─────────────────────────────────────────────────
  let displayTonnage = $state(0);
  let rafId = 0;
  $effect(() => {
    const target = totalTonnage;
    const from   = untrack(() => displayTonnage);
    cancelAnimationFrame(rafId);
    const t0 = performance.now(); const dur = 1400;
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

  // ── Eco-mode persistence ─────────────────────────────────────────────────────
  $effect(() => {
    if (typeof document !== "undefined") {
      document.body.classList.toggle("eco", ecoMode);
      localStorage.setItem("agrigate_eco", ecoMode ? "1" : "0");
    }
  });

  // ── Convex client ────────────────────────────────────────────────────────────
  let client: import("convex/browser").ConvexClient | null = null;
  let unsubWorkers: (() => void) | undefined;
  let unsubLogs:    (() => void) | undefined;
  let unsubRoster:  (() => void) | undefined;
  let unsubForeman: (() => void) | undefined;

  // ── Leaflet ──────────────────────────────────────────────────────────────────
  let mapEl: HTMLDivElement | null = null;
  let leafletMap: any = null;
  let markerLayer: any = null;

  // ── Offline queue helpers ─────────────────────────────────────────────────────
  function getQueue(): any[] { try { return JSON.parse(localStorage.getItem(OFFLINE_KEY) || "[]"); } catch { return []; } }
  function saveQueue(q: any[]) { localStorage.setItem(OFFLINE_KEY, JSON.stringify(q)); offlineCount = q.length; }

  async function processOfflineQueue() {
    const q = getQueue();
    if (!q.length || !client) return;
    syncing = true;
    const failed: any[] = [];
    const { api } = await import("../../convex/_generated/api");
    for (const entry of q) {
      try {
        if (entry.type === "logBin") await client.mutation(api.yieldLogs.logBin, entry.args);
      } catch { failed.push(entry); }
    }
    saveQueue(failed);
    syncing = false;
  }

  // ── Haversine distance (metres) ───────────────────────────────────────────────
  function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6_371_000;
    const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180, Δλ = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  onMount(async () => {
    // Restore eco-mode
    ecoMode = localStorage.getItem("agrigate_eco") === "1";

    // Offline state
    isOnline     = navigator.onLine;
    offlineCount = getQueue().length;
    window.addEventListener("online",  () => { isOnline = true;  processOfflineQueue(); });
    window.addEventListener("offline", () => { isOnline = false; });

    // Convex subscriptions
    const [{ ConvexClient }, { api }] = await Promise.all([
      import("convex/browser"),
      import("../../convex/_generated/api"),
    ]);
    client = new ConvexClient(PUBLIC_CONVEX_URL);

    unsubWorkers = client.onUpdate(api.workers.listWorkers, {}, r => { workers = r ?? []; dataLoaded = true; });
    const startOfDay = new Date().setHours(0, 0, 0, 0);
    unsubLogs   = client.onUpdate(api.yieldLogs.listTodayLogs, { startOfDay }, r => { todayLogs = r ?? []; });
    unsubRoster = client.onUpdate(api.roster.listTodayRoster, { date: TODAY }, r => { rosterAssignments = r ?? []; });
    unsubForeman = client.onUpdate(api.roster.getForemanOfDay, { date: TODAY }, r => { foremanOfDayName = r?.foremanName ?? ""; });

    // IntersectionObserver for active section
    const obs = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) activeSection = e.target.getAttribute("data-s") ?? "dashboard";
    }, { threshold: 0.25 });
    document.querySelectorAll("[data-s]").forEach(el => obs.observe(el));

    // Leaflet map
    if (mapEl) {
      const L = (await import("leaflet")).default;
      leafletMap  = L.map(mapEl).setView([-23.87, 30.14], 14);
      markerLayer = L.layerGroup().addTo(leafletMap);
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { attribution: "© Esri", maxZoom: 19 }).addTo(leafletMap);
    }
  });

  onDestroy(() => {
    cancelAnimationFrame(rafId);
    unsubWorkers?.(); unsubLogs?.(); unsubRoster?.(); unsubForeman?.();
    client?.close(); leafletMap?.remove();
    window.removeEventListener("online",  processOfflineQueue);
    window.removeEventListener("offline", () => {});
  });

  // ── Map markers ──────────────────────────────────────────────────────────────
  $effect(() => {
    const logs = todayLogs;
    if (!leafletMap || !markerLayer) return;
    untrack(async () => {
      const L = (await import("leaflet")).default;
      markerLayer.clearLayers();
      for (const log of logs) {
        if (log.lat == null || log.lng == null) continue;
        const icon = L.divIcon({ className: "", html: `<div class="map-pin"></div>`, iconSize: [12,12], iconAnchor: [6,6] });
        L.marker([log.lat, log.lng], { icon }).bindPopup(`<b>${workerName(log.workerId)}</b><br>${log.cropType} · ${log.binWeight} kg`).addTo(markerLayer);
      }
    });
  });

  // ── Helper functions ─────────────────────────────────────────────────────────
  function workerName(id: string) { return workers.find(w => w._id === id)?.name ?? "Unknown"; }
  function scrollTo(section: string) { document.querySelector(`[data-s="${section}"]`)?.scrollIntoView({ behavior: "smooth" }); sidebarOpen = false; }
  function exportCSV() { alert("Preparing export…"); }

  // ── Register Worker ──────────────────────────────────────────────────────────
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

  // ── GPS capture with anti-fraud distance check ────────────────────────────────
  async function getGPS(): Promise<{ lat: number; lng: number } | null> {
    return new Promise(resolve => {
      if (!navigator.geolocation) { resolve(null); return; }
      gpsStatus = "capturing"; gpsDistanceM = null;
      navigator.geolocation.getCurrentPosition(
        p => {
          gpsStatus = "ok";
          const pos = { lat: p.coords.latitude, lng: p.coords.longitude };
          // Anti-fraud: check distance to assigned block
          if (workerBlockAssignment) {
            gpsDistanceM = Math.round(haversineMeters(pos.lat, pos.lng, workerBlockAssignment.blockLat, workerBlockAssignment.blockLng));
          }
          resolve(pos);
        },
        () => { gpsStatus = "denied"; resolve(null); },
        { timeout: 6000 }
      );
    });
  }

  // ── Log Bin (with offline fallback) ─────────────────────────────────────────
  async function logBin(e: Event) {
    e.preventDefault(); logError = "";
    if (!selectedWorker) return;
    const kg = parseFloat(binWeight);
    if (isNaN(kg) || kg <= 0) { logError = "Enter a valid weight."; return; }
    logging = true;
    try {
      const gps = await getGPS();
      // GPS lock enforcement
      if (workerBlockAssignment && gpsDistanceM !== null && gpsDistanceM > 100) {
        logError = `GPS Lock: ${gpsDistanceM}m from block. Move within 100m to log.`;
        logging = false; return;
      }
      const args = {
        workerId: selectedWorker as any, binWeight: kg, cropType, timestamp: Date.now(),
        ...(gps ? { lat: gps.lat, lng: gps.lng } : {}),
      };
      if (!client || !isOnline) {
        // Save locally
        const q = getQueue();
        q.push({ type: "logBin", args, queuedAt: Date.now() });
        saveQueue(q);
        binWeight = ""; logged = true; gpsStatus = "idle"; gpsDistanceM = null;
        setTimeout(() => (logged = false), 4000);
      } else {
        const { api } = await import("../../convex/_generated/api");
        await client.mutation(api.yieldLogs.logBin, args);
        binWeight = ""; logged = true; gpsStatus = "idle"; gpsDistanceM = null;
        setTimeout(() => (logged = false), 4000);
      }
    } catch { logError = "Failed to log bin. Please try again."; }
    finally { logging = false; }
  }

  // ── Remove Worker / Log ──────────────────────────────────────────────────────
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

  // ── Roster functions ─────────────────────────────────────────────────────────
  async function saveForeman(e: Event) {
    e.preventDefault();
    if (!client || !foremanInput.trim()) return;
    savingForeman = true;
    try {
      const { api } = await import("../../convex/_generated/api");
      await client.mutation(api.roster.setForemanOfDay, { date: TODAY, foremanName: foremanInput.trim() });
      foremanInput = "";
    } finally { savingForeman = false; }
  }

  async function assignToBlock(e: Event) {
    e.preventDefault();
    if (!client || !selectedRosterWorker || !selectedBlock) return;
    savingRoster = true;
    try {
      const block = ORCHARD_BLOCKS.find(b => b.id === selectedBlock)!;
      const { api } = await import("../../convex/_generated/api");
      await client.mutation(api.roster.assignWorker, {
        date: TODAY, workerId: selectedRosterWorker as any,
        orchardBlock: block.label, blockLat: block.lat, blockLng: block.lng,
        assignedBy: foremanOfDayName || "Foreman",
      });
      selectedRosterWorker = ""; selectedBlock = "";
      rosterSaved = true; setTimeout(() => (rosterSaved = false), 3000);
    } finally { savingRoster = false; }
  }

  async function removeAssignment(id: string) {
    if (!client) return;
    const { api } = await import("../../convex/_generated/api");
    await client.mutation(api.roster.removeAssignment, { id: id as any });
  }

  // ── Nav ──────────────────────────────────────────────────────────────────────
  const navItems = [
    { id: "dashboard", label: "Overview"  },
    { id: "workers",   label: "Personnel" },
    { id: "roster",    label: "Roster"    },
    { id: "yield",     label: "Harvest"   },
    { id: "map",       label: "Field Map" },
    { id: "reports",   label: "Reports"   },
  ];

  // ── Log bin button label ─────────────────────────────────────────────────────
  let logBtnLabel = $derived((() => {
    if (logging) return "Saving…";
    if (!workerBlockAssignment) return "Log Bin";
    if (gpsStatus === "capturing") return "Capturing GPS…";
    if (gpsStatus === "ok" && gpsDistanceM !== null) {
      return gpsLocked ? `Log Bin ✓ GPS Verified (${gpsDistanceM}m)` : `GPS Lock: ${gpsDistanceM}m from block`;
    }
    return "Log Bin";
  })());

  let logBtnDisabled = $derived(
    logging || !selectedWorker ||
    (!!workerBlockAssignment && gpsStatus === "ok" && !gpsLocked)
  );
</script>

<svelte:head>
  <title>ZZ2 AgriGate — Worker Hub</title>
</svelte:head>

{#if sidebarOpen}
  <div class="overlay" role="button" tabindex="-1" onclick={() => sidebarOpen = false} onkeydown={() => {}}></div>
{/if}

<!-- ══ OFFLINE INDICATOR ═══════════════════════════════════════════════════════ -->
{#if !isOnline || syncing}
  <div class="offline-badge" class:syncing>
    {#if syncing}
      <span class="spinner-sm"></span> Syncing {offlineCount} entr{offlineCount === 1 ? "y" : "ies"}…
    {:else}
      <span class="offline-dot"></span> Offline — Saving Locally
      {#if offlineCount > 0}<span class="offline-count">{offlineCount} pending</span>{/if}
    {/if}
  </div>
{/if}

<div class="shell">

  <!-- ══ SIDEBAR ══════════════════════════════════════════════════════════════ -->
  <nav class="sidebar" class:open={sidebarOpen}>
    <div class="sb-brand">
      <p class="sb-sup">ZZ2 Farm Operations</p>
      <p class="sb-name">AgriGate ERP</p>
    </div>

    <ul class="sb-nav">
      {#each navItems as item}
        <li>
          <button class="sb-item" class:active={activeSection === item.id} onclick={() => scrollTo(item.id)}>
            <span>{item.label}</span>
            {#if item.id === "dashboard" && totalBins > 0}
              <span class="sb-badge">{totalBins}</span>
            {/if}
          </button>
        </li>
      {/each}
    </ul>

    <div class="sb-footer">
      <div class="sb-sync">
        <span class="glow-dot {isOnline ? 'glow-green' : 'glow-red'}"></span>
        <span class="sb-sync-label">{isOnline ? "Live Sync Active" : "Offline Mode"}</span>
      </div>

      <!-- Eco-mode toggle -->
      <label class="eco-toggle" title="Power Saver — removes background effects to save battery">
        <input type="checkbox" bind:checked={ecoMode} />
        <span class="eco-track">
          <span class="eco-thumb"></span>
        </span>
        <span class="eco-label">⚡ Eco Mode</span>
      </label>

      <p class="sb-ver">v1.1.0-PRO</p>
    </div>
  </nav>

  <!-- ══ MAIN ══════════════════════════════════════════════════════════════════ -->
  <div class="main">

    <!-- System status bar -->
    <div class="status-bar">
      <span class="st-item"><span class="glow-dot glow-green"></span>Cloud Sync: {isOnline ? "Active" : "Offline"}</span>
      <span class="st-sep">·</span>
      <span class="st-item"><span class="glow-dot glow-green"></span>GPS: Fixed</span>
      <span class="st-sep">·</span>
      <span class="st-muted">Version 1.1.0-PRO</span>
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

      <!-- Foreman of the Day badge -->
      {#if foremanOfDayName}
        <div class="foreman-badge">
          <span class="glow-dot glow-amber"></span>
          <span class="foreman-label">Foreman: <strong>{foremanOfDayName}</strong></span>
        </div>
      {/if}

      <div class="topbar-chip">
        <span class="glow-dot glow-green"></span>
        {workers.length} workers
      </div>
    </header>

    <!-- ══ OVERVIEW ══════════════════════════════════════════════════════════ -->
    <section class="section" data-s="dashboard">
      <div class="section-inner">
        <p class="eyebrow">Today's Performance</p>

        <!-- Shift Summary for Foreman -->
        <div class="shift-summary panel">
          <div class="ss-head">
            <span class="glow-dot glow-amber"></span>
            <span class="ss-title">Shift Summary</span>
            {#if foremanOfDayName}<span class="ss-foreman">— {foremanOfDayName}</span>{/if}
          </div>
          <div class="ss-grid">
            <div class="ss-stat">
              <p class="ss-val">{activeWorkerCount}</p>
              <p class="ss-key">Workers Active</p>
            </div>
            <div class="ss-stat">
              <p class="ss-val">{binsPerHour}</p>
              <p class="ss-key">Bins / Hour</p>
            </div>
            <div class="ss-stat">
              <p class="ss-val">{totalTonnage.toFixed(3)}<span class="ss-unit">t</span></p>
              <p class="ss-key">Est. Tonnage</p>
            </div>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-tile kpi-harvest">
            <p class="kpi-label">Total Tonnage</p>
            <p class="kpi-value">{displayTonnage.toFixed(3)}<span class="kpi-unit">t</span></p>
            <p class="kpi-sub">Active harvest</p>
          </div>
          <div class="kpi-tile">
            <p class="kpi-label">Bins Logged</p>
            <p class="kpi-value">{totalBins}</p>
            <p class="kpi-sub">today</p>
          </div>
          <div class="kpi-tile">
            <p class="kpi-label">Active Workers</p>
            <p class="kpi-value">{activeWorkerCount}</p>
            <p class="kpi-sub">on field</p>
          </div>
          <div class="kpi-tile">
            <p class="kpi-label">Avg Bin Weight</p>
            <p class="kpi-value">{avgBinWeight.toFixed(1)}<span class="kpi-unit">kg</span></p>
            <p class="kpi-sub">per bin</p>
          </div>
          <div class="kpi-tile">
            <p class="kpi-label">Total Harvested</p>
            <p class="kpi-value">{totalKg.toFixed(0)}<span class="kpi-unit">kg</span></p>
            <p class="kpi-sub">gross weight</p>
          </div>
          <div class="kpi-tile">
            <p class="kpi-label">Top Village</p>
            <p class="kpi-value kpi-text">{topVillage}</p>
            <p class="kpi-sub">highest yield</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ══ PERSONNEL ══════════════════════════════════════════════════════════ -->
    <section class="section section-tinted" data-s="workers">
      <div class="section-inner">
        <div class="workers-hero">
          <div class="workers-hero-inner">
            <p class="eyebrow">Field Operations</p>
            <h2 class="workers-hero-title">Personnel Registry</h2>
            <p class="workers-hero-sub">{workers.length} registered · Real-time sync</p>
          </div>
        </div>
        <div class="two-col">
          <div class="panel">
            <div class="panel-hdr">New Registration</div>
            <form onsubmit={registerWorker} class="form">
              <div class="field">
                <label for="wname">Full Name</label>
                <input id="wname" type="text" bind:value={wName} placeholder="e.g. Thabo Nkosi" required disabled={saving} />
              </div>
              <div class="field">
                <label for="wsaid">SA ID Number</label>
                <input id="wsaid" type="text" bind:value={wSaId} placeholder="13-digit SA ID" maxlength="13" required disabled={saving} />
              </div>
              <div class="field">
                <label for="wvillage">Village / Area</label>
                <input id="wvillage" type="text" bind:value={wVillage} placeholder="e.g. Tzaneen" required disabled={saving} />
              </div>
              <button type="submit" class="btn" disabled={saving}>
                {#if saving}<span class="spinner"></span>Saving…{:else}Confirm Registration{/if}
              </button>
              {#if saved}<div class="alert alert-ok">Worker registered.</div>{/if}
              {#if regError}<div class="alert alert-err">{regError}</div>{/if}
            </form>
          </div>

          <div class="panel">
            <div class="panel-hdr">
              Registered Personnel
              <div class="search-wrap">
                <svg class="search-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M11 11l3 3"/></svg>
                <input class="search-input" id="wsearch" type="text" bind:value={search} placeholder="Filter by village…" />
                {#if search}<button class="clear-btn" onclick={() => search = ""}>×</button>{/if}
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
                  <thead><tr><th>#</th><th>Name</th><th>SA ID</th><th>Village</th><th>Block</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    {#each filtered as w, i}
                      {@const assignment = rosterAssignments.find(r => r.workerId === w._id)}
                      <tr class="tr">
                        <td class="td-n">{filtered.length - i}</td>
                        <td class="td-name">{w.name}</td>
                        <td class="td-mono">{w.saId}</td>
                        <td>{w.village}</td>
                        <td class="td-block">{assignment?.orchardBlock ?? <span class="td-na">—</span>}</td>
                        <td><span class="glow-dot {todayLogs.some(l=>l.workerId===w._id) ? 'glow-green' : 'glow-amber'}" title={todayLogs.some(l=>l.workerId===w._id) ? 'Active today' : 'No logs today'}></span></td>
                        <td><button class="del-btn" onclick={() => removeWorker(w._id)}>×</button></td>
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

    <!-- ══ DAILY ROSTER ═══════════════════════════════════════════════════════ -->
    <section class="section" data-s="roster">
      <div class="section-inner">
        <h2 class="section-title">Daily Roster — {TODAY}</h2>
        <p class="section-sub">Assign workers to orchard blocks. GPS Lock enforces location within 100m of the assigned block.</p>

        <div class="two-col">

          <!-- Left: Foreman + Assignment form -->
          <div class="panel">
            <div class="panel-hdr">Set Foreman of the Day</div>
            <form onsubmit={saveForeman} class="form">
              <div class="field">
                <label for="foreman-name">Foreman Name</label>
                <input id="foreman-name" type="text" bind:value={foremanInput} placeholder="e.g. Johannes van der Merwe" disabled={savingForeman} />
              </div>
              <button type="submit" class="btn" disabled={savingForeman || !foremanInput.trim()}>
                {savingForeman ? "Saving…" : foremanOfDayName ? "Update Foreman" : "Set Foreman"}
              </button>
              {#if foremanOfDayName}
                <div class="alert alert-ok">
                  <span class="glow-dot glow-amber" style="display:inline-block;margin-right:0.4rem"></span>
                  On duty: <strong>{foremanOfDayName}</strong>
                </div>
              {/if}
            </form>

            <div class="panel-hdr" style="margin-top:1px">Assign Worker to Block</div>
            <form onsubmit={assignToBlock} class="form">
              <div class="field">
                <label for="roster-worker">Worker</label>
                <select id="roster-worker" bind:value={selectedRosterWorker} disabled={savingRoster}>
                  <option value="" disabled>— Select worker —</option>
                  {#each workers as w}
                    <option value={w._id}>{w.name} · {w.village}</option>
                  {/each}
                </select>
              </div>
              <div class="field">
                <label for="roster-block">Orchard Block</label>
                <select id="roster-block" bind:value={selectedBlock} disabled={savingRoster}>
                  <option value="" disabled>— Select block —</option>
                  {#each ORCHARD_BLOCKS as b}
                    <option value={b.id}>{b.label}</option>
                  {/each}
                </select>
              </div>
              <button type="submit" class="btn" disabled={savingRoster || !selectedRosterWorker || !selectedBlock}>
                {savingRoster ? "Assigning…" : "Assign to Block"}
              </button>
              {#if rosterSaved}<div class="alert alert-ok">Assignment saved.</div>{/if}
            </form>
          </div>

          <!-- Right: Today's roster table -->
          <div class="panel">
            <div class="panel-hdr">Today's Roster ({rosterAssignments.length})</div>
            {#if rosterAssignments.length === 0}
              <div class="empty-state"><p>No assignments yet. Set foreman and assign workers to blocks above.</p></div>
            {:else}
              <div class="table-scroll">
                <table class="data-table">
                  <thead><tr><th>#</th><th>Worker</th><th>Block</th><th>Assigned By</th><th></th></tr></thead>
                  <tbody>
                    {#each rosterAssignments as r, i}
                      <tr class="tr">
                        <td class="td-n">{i + 1}</td>
                        <td class="td-name">{workerName(r.workerId)}</td>
                        <td class="td-block">{r.orchardBlock}</td>
                        <td class="td-mono">{r.assignedBy}</td>
                        <td><button class="del-btn" onclick={() => removeAssignment(r._id)}>×</button></td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            {/if}

            <!-- GPS Lock legend -->
            <div class="gps-lock-legend">
              <p class="legend-title">GPS Lock Rules</p>
              <p class="legend-item"><span class="glow-dot glow-green" style="width:7px;height:7px"></span> Within 100m — Log Bin enabled</p>
              <p class="legend-item"><span class="glow-dot glow-red" style="width:7px;height:7px"></span> Outside 100m — Blocked (anti-fraud)</p>
              <p class="legend-item"><span class="glow-dot glow-amber" style="width:7px;height:7px"></span> No assignment — GPS not enforced</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ══ HARVEST LOGGER ═════════════════════════════════════════════════════ -->
    <section class="section section-tinted" data-s="yield">
      <div class="section-inner">
        <h2 class="section-title">Harvest Logger</h2>
        <div class="two-col">
          <div class="panel">
            <div class="panel-hdr">Log Bin Entry</div>
            <form onsubmit={logBin} class="form">
              <div class="field">
                <label for="log-worker">Worker</label>
                <select id="log-worker" bind:value={selectedWorker} required disabled={logging} onchange={() => { gpsDistanceM = null; gpsStatus = "idle"; }}>
                  <option value="" disabled>— Select worker —</option>
                  {#each workers as w}
                    {@const hasBlock = rosterAssignments.some(r => r.workerId === w._id)}
                    <option value={w._id}>{w.name} · {w.village}{hasBlock ? " 📍" : ""}</option>
                  {/each}
                </select>
              </div>

              {#if workerBlockAssignment}
                <div class="block-info">
                  <span class="glow-dot glow-amber"></span>
                  Assigned: <strong>{workerBlockAssignment.orchardBlock}</strong>
                  <span class="block-gps-note">· GPS Lock active within 100m</span>
                </div>
              {/if}

              <div class="field">
                <label for="log-crop">Crop Type</label>
                <select id="log-crop" bind:value={cropType} disabled={logging}>
                  <option>Tomatoes</option><option>Avocados</option>
                  <option>Mangoes</option><option>Citrus</option>
                  <option>Peppers</option><option>Butternut</option><option>Other</option>
                </select>
              </div>
              <div class="field">
                <label for="log-weight">Bin Weight (kg)</label>
                <input id="log-weight" type="number" min="0.1" step="0.1" bind:value={binWeight} placeholder="e.g. 850" required disabled={logging} />
              </div>

              <div class="gps-row">
                {#if gpsStatus === "capturing"}
                  <span class="gps-tag gps-wait">Capturing GPS…</span>
                {:else if gpsStatus === "ok" && gpsDistanceM !== null}
                  <span class="gps-tag {gpsLocked ? 'gps-ok' : 'gps-err'}">
                    {gpsLocked ? `✓ GPS Locked · ${gpsDistanceM}m from block` : `✗ ${gpsDistanceM}m from block (max 100m)`}
                  </span>
                {:else if gpsStatus === "ok"}
                  <span class="gps-tag gps-ok">GPS Captured</span>
                {:else if gpsStatus === "denied"}
                  <span class="gps-tag gps-na">GPS Unavailable</span>
                {:else}
                  <span class="gps-tag">GPS auto-captured on submit</span>
                {/if}
              </div>

              <button
                type="submit"
                class="btn"
                class:btn-gps-locked={gpsLocked}
                class:btn-gps-blocked={workerBlockAssignment && gpsStatus === "ok" && !gpsLocked}
                disabled={logBtnDisabled}
              >
                {#if logging}<span class="spinner"></span>{/if}{logBtnLabel}
              </button>

              {#if !isOnline}
                <div class="alert alert-warn">Offline — bin will sync when signal returns</div>
              {/if}
              {#if logged}<div class="alert alert-ok">Bin logged{!isOnline ? " locally" : ""}.</div>{/if}
              {#if logError}<div class="alert alert-err">{logError}</div>{/if}
            </form>
          </div>

          <div class="panel">
            <div class="panel-hdr">Today's Bins ({totalBins})</div>
            {#if todayLogs.length === 0}
              <div class="empty-state"><p>No bins logged today.</p></div>
            {:else}
              <div class="table-scroll">
                <table class="data-table">
                  <thead><tr><th>#</th><th>Worker</th><th>Crop</th><th>kg</th><th>Time</th><th>GPS</th><th></th></tr></thead>
                  <tbody>
                    {#each todayLogs as log, i}
                      <tr class="tr">
                        <td class="td-n">{todayLogs.length - i}</td>
                        <td class="td-name">{workerName(log.workerId)}</td>
                        <td>{log.cropType}</td>
                        <td class="td-weight">{log.binWeight}</td>
                        <td class="td-mono">{new Date(log.timestamp).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}</td>
                        <td>{#if log.lat}<span class="glow-dot glow-green" title="GPS fixed"></span>{:else}<span class="td-na">—</span>{/if}</td>
                        <td><button class="del-btn" onclick={() => removeLog(log._id)}>×</button></td>
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
    <section class="section" data-s="map">
      <div class="section-inner">
        <h2 class="section-title">Field Map <span class="tag">Satellite</span></h2>
        <p class="section-sub">GPS pins appear automatically when a bin is logged with location data.</p>
        <div class="map-wrap" bind:this={mapEl}></div>
      </div>
    </section>

    <!-- ══ REPORTS ════════════════════════════════════════════════════════════ -->
    <section class="section section-tinted" data-s="reports">
      <div class="section-inner">
        <h2 class="section-title">Reports</h2>
        <div class="kpi-grid kpi-grid-sm">
          <div class="kpi-tile"><p class="kpi-label">Daily Bins</p><p class="kpi-value">{totalBins}</p></div>
          <div class="kpi-tile"><p class="kpi-label">Total Tonnage</p><p class="kpi-value">{totalTonnage.toFixed(3)}<span class="kpi-unit">t</span></p></div>
          <div class="kpi-tile"><p class="kpi-label">Active Workers</p><p class="kpi-value">{activeWorkerCount}</p></div>
          <div class="kpi-tile"><p class="kpi-label">Bins / Hour</p><p class="kpi-value">{binsPerHour}</p></div>
        </div>
        <div class="export-row">
          <p class="export-note">Export today's harvest data for payroll processing</p>
          <button class="btn btn-export" onclick={exportCSV}>
            <svg class="btn-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M8 2v8M4 8l4 4 4-4M2 14h12"/></svg>
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
    <button class="bn-item" class:active={activeSection === item.id} onclick={() => scrollTo(item.id)}>
      <span class="bn-label">{item.label}</span>
      {#if item.id === "dashboard" && totalBins > 0}<span class="bn-badge">{totalBins}</span>{/if}
    </button>
  {/each}
</nav>

<style>
  /* ══ GLOBAL ══════════════════════════════════════════════════════════════════ */
  :global(*), :global(*::before), :global(*::after) { box-sizing: border-box; margin: 0; padding: 0; }
  :global(body) { font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #111827; }

  /* Eco-mode: strip background image and blurs */
  :global(body.eco)::before { opacity: 0 !important; }
  :global(body.eco) .panel,
  :global(body.eco) .kpi-tile,
  :global(body.eco) .sidebar,
  :global(body.eco) .topbar,
  :global(body.eco) .status-bar,
  :global(body.eco) .shift-summary { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; background: rgba(255,255,255,0.97) !important; }
  :global(body.eco) video { display: none !important; }

  /* ══ LAYOUT ══════════════════════════════════════════════════════════════════ */
  .shell { display: flex; min-height: 100vh; }

  /* ══ SIDEBAR ═════════════════════════════════════════════════════════════════ */
  .sidebar {
    width: 216px; min-height: 100vh;
    background: rgba(255,255,255,0.82); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px);
    border-right: 1px solid rgba(255,255,255,0.6); box-shadow: 2px 0 24px rgba(0,0,0,0.06);
    display: flex; flex-direction: column;
    position: sticky; top: 0; height: 100vh; overflow-y: auto; flex-shrink: 0; z-index: 100;
    transition: transform 0.25s ease;
  }
  .sb-brand { padding: 1.25rem 1.1rem 1rem; border-bottom: 1px solid rgba(0,0,0,0.06); }
  .sb-sup  { font-size: 0.58rem; font-weight: 700; color: #9ca3af; letter-spacing: 0.16em; text-transform: uppercase; margin-bottom: 0.2rem; }
  .sb-name { font-size: 1rem; font-weight: 800; color: #064e3b; letter-spacing: -0.01em; }
  .sb-nav  { list-style: none; padding: 0.6rem 0.5rem; flex: 1; display: flex; flex-direction: column; gap: 0.1rem; }
  .sb-item {
    width: 100%; display: flex; align-items: center; justify-content: space-between;
    padding: 0.52rem 0.85rem; border-radius: 6px; background: none; border: none;
    color: #4b5563; font-family: 'Inter', sans-serif; font-size: 0.8rem; font-weight: 500;
    cursor: pointer; text-align: left; transition: background 0.12s, color 0.12s;
  }
  .sb-item:hover  { background: rgba(6,95,70,0.06); color: #064e3b; }
  .sb-item.active { background: #065f46; color: #fff; font-weight: 600; box-shadow: 0 2px 10px rgba(6,95,70,0.25); }
  .sb-badge { background: #d97706; color: #fff; font-size: 0.56rem; font-weight: 800; padding: 0.05rem 0.38rem; border-radius: 999px; }
  .sb-footer { padding: 0.8rem 1rem; border-top: 1px solid rgba(0,0,0,0.06); display: flex; flex-direction: column; gap: 0.6rem; }
  .sb-sync  { display: flex; align-items: center; gap: 0.45rem; }
  .sb-sync-label { font-size: 0.65rem; color: #6b7280; }
  .sb-ver   { font-size: 0.6rem; color: #d1d5db; }

  /* Eco-mode toggle */
  .eco-toggle { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
  .eco-toggle input { position: absolute; opacity: 0; width: 0; height: 0; }
  .eco-track {
    position: relative; width: 30px; height: 16px; border-radius: 999px; flex-shrink: 0;
    background: #d1d5db; transition: background 0.2s;
  }
  :global(.eco-toggle input:checked + .eco-track) { background: #065f46; }
  .eco-thumb {
    position: absolute; top: 2px; left: 2px; width: 12px; height: 12px;
    border-radius: 50%; background: #fff; transition: transform 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }
  :global(.eco-toggle input:checked ~ .eco-track .eco-thumb) { transform: translateX(14px); }
  .eco-label { font-size: 0.65rem; color: #6b7280; font-weight: 500; }

  /* ══ GLOW DOTS ═══════════════════════════════════════════════════════════════ */
  .glow-dot { display: inline-block; flex-shrink: 0; width: 8px; height: 8px; border-radius: 50%; }
  .glow-green { background: #22c55e; box-shadow: 0 0 10px #22c55e, 0 0 22px rgba(34,197,94,0.6), 0 0 40px rgba(34,197,94,0.25); }
  .glow-amber { background: #f59e0b; box-shadow: 0 0 10px #f59e0b, 0 0 22px rgba(245,158,11,0.6), 0 0 40px rgba(245,158,11,0.25); }
  .glow-red   { background: #ef4444; box-shadow: 0 0 10px #ef4444, 0 0 20px rgba(239,68,68,0.5); }

  /* ══ MAIN ════════════════════════════════════════════════════════════════════ */
  .main { flex: 1; min-width: 0; display: flex; flex-direction: column; }

  /* Status bar */
  .status-bar {
    background: rgba(255,255,255,0.88); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
    border-bottom: 1px solid rgba(0,0,0,0.06); height: 28px; padding: 0 1.5rem;
    display: flex; align-items: center; gap: 0.8rem;
    font-size: 0.65rem; color: #6b7280; letter-spacing: 0.02em;
    position: sticky; top: 0; z-index: 60; flex-shrink: 0;
  }
  .st-item { display: flex; align-items: center; gap: 0.38rem; }
  .st-sep  { color: #d1d5db; }
  .st-muted { color: #d1d5db; }
  .st-right { margin-left: auto; }

  /* Top bar */
  .topbar {
    background: rgba(255,255,255,0.85); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(0,0,0,0.07); padding: 0 1.5rem; height: 52px;
    display: flex; align-items: center; gap: 0.75rem;
    position: sticky; top: 28px; z-index: 50; flex-shrink: 0;
    box-shadow: 0 1px 8px rgba(0,0,0,0.04);
  }
  .hamburger { display: none; flex-direction: column; gap: 4px; background: none; border: none; cursor: pointer; padding: 4px; }
  .hamburger span { display: block; width: 18px; height: 1.5px; background: #6b7280; border-radius: 1px; }
  .topbar-brand { flex: 1; }
  .topbar-brand h1 { font-size: 0.9rem; font-weight: 700; color: #064e3b; }
  .topbar-date    { font-size: 0.62rem; color: #9ca3af; margin-top: 0.1rem; }

  /* Foreman badge */
  .foreman-badge {
    display: flex; align-items: center; gap: 0.38rem;
    background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3);
    padding: 0.22rem 0.7rem; border-radius: 999px;
    font-size: 0.68rem; color: #92400e;
  }
  .foreman-label strong { font-weight: 700; color: #78350f; }

  .topbar-chip {
    display: flex; align-items: center; gap: 0.38rem;
    font-size: 0.7rem; font-weight: 600; color: #065f46;
    background: rgba(6,95,70,0.08); border: 1px solid rgba(6,95,70,0.2);
    padding: 0.22rem 0.7rem; border-radius: 999px;
  }

  /* ══ OFFLINE BADGE ═══════════════════════════════════════════════════════════ */
  .offline-badge {
    position: fixed; bottom: 1rem; left: 1rem; z-index: 999;
    display: flex; align-items: center; gap: 0.45rem;
    background: #ef4444; color: #fff;
    padding: 0.45rem 0.85rem; border-radius: 999px;
    font-size: 0.68rem; font-weight: 700; letter-spacing: 0.02em;
    box-shadow: 0 4px 20px rgba(239,68,68,0.4);
    animation: slideup 0.25s ease;
  }
  .offline-badge.syncing { background: #d97706; box-shadow: 0 4px 20px rgba(217,119,6,0.4); }
  .offline-dot { width: 7px; height: 7px; border-radius: 50%; background: #fff; animation: blink 1s infinite; }
  .offline-count { background: rgba(255,255,255,0.25); padding: 0.05rem 0.35rem; border-radius: 999px; font-size: 0.6rem; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
  @keyframes slideup { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
  .spinner-sm { width: 10px; height: 10px; border-radius: 50%; border: 1.5px solid rgba(255,255,255,0.3); border-top-color: #fff; animation: spin 0.7s linear infinite; }

  /* ══ SECTIONS ════════════════════════════════════════════════════════════════ */
  .section        { padding: 1.75rem 1.5rem; }
  .section-tinted { background: rgba(255,255,255,0.25); }
  .section-inner  { max-width: 1200px; margin: 0 auto; }
  .eyebrow { font-size: 0.6rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.14em; margin-bottom: 0.7rem; }
  .section-title  { font-size: 1rem; font-weight: 700; color: #064e3b; margin-bottom: 1.1rem; display: flex; align-items: center; gap: 0.6rem; }
  .section-sub    { font-size: 0.75rem; color: #6b7280; margin-bottom: 0.85rem; margin-top: -0.6rem; }
  .tag { font-size: 0.56rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 0.12rem 0.45rem; border-radius: 4px; background: rgba(6,95,70,0.1); color: #065f46; border: 1px solid rgba(6,95,70,0.25); }

  /* ══ SHIFT SUMMARY CARD ══════════════════════════════════════════════════════ */
  .shift-summary {
    margin-bottom: 1.25rem; border-radius: 10px; overflow: hidden;
    background: rgba(255,255,255,0.72); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px);
    border: 1px solid rgba(255,255,255,0.55); box-shadow: 0 8px 32px rgba(0,0,0,0.08);
  }
  .ss-head  { display: flex; align-items: center; gap: 0.5rem; padding: 0.65rem 1rem; background: rgba(245,158,11,0.08); border-bottom: 1px solid rgba(245,158,11,0.15); }
  .ss-title { font-size: 0.68rem; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: 0.1em; }
  .ss-foreman { font-size: 0.68rem; color: #b45309; }
  .ss-grid  { display: grid; grid-template-columns: repeat(3,1fr); }
  .ss-stat  { padding: 0.85rem 1rem; text-align: center; border-right: 1px solid rgba(0,0,0,0.05); }
  .ss-stat:last-child { border-right: none; }
  .ss-val   { font-family: 'Roboto Slab', serif; font-size: 1.5rem; font-weight: 800; color: #064e3b; line-height: 1; }
  .ss-unit  { font-family: 'Inter', sans-serif; font-size: 0.75rem; color: #6b7280; margin-left: 0.1rem; }
  .ss-key   { font-size: 0.58rem; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 0.25rem; font-weight: 600; }

  /* ══ KPI GRID ════════════════════════════════════════════════════════════════ */
  .kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(155px, 1fr)); gap: 1px; background: rgba(0,0,0,0.07); border: 1px solid rgba(0,0,0,0.07); border-radius: 12px; overflow: hidden; margin-bottom: 1.5rem; }
  .kpi-grid-sm { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); }
  .kpi-tile { background: rgba(255,255,255,0.72); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); padding: 1.1rem 1.2rem; transition: background 0.12s; }
  .kpi-tile:hover { background: rgba(255,255,255,0.88); }
  .kpi-harvest { position: relative; background-image: url('/luis-guaman-6mtp5h4dG-A-unsplash.jpg'); background-size: cover; background-position: center; }
  .kpi-harvest::before { content: ''; position: absolute; inset: 0; background: rgba(255,255,255,0.78); backdrop-filter: blur(2px); }
  .kpi-harvest > * { position: relative; z-index: 1; }
  .kpi-label { font-size: 0.58rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.45rem; }
  .kpi-value { font-family: 'Roboto Slab', serif; font-size: 2rem; font-weight: 800; color: #064e3b; line-height: 1; letter-spacing: -0.03em; }
  .kpi-unit  { font-family: 'Inter', sans-serif; font-size: 0.82rem; font-weight: 400; color: #6b7280; margin-left: 0.15rem; }
  .kpi-text  { font-size: 1.1rem; }
  .kpi-sub   { font-size: 0.62rem; color: #9ca3af; margin-top: 0.3rem; }

  /* ══ WORKER HERO ═════════════════════════════════════════════════════════════ */
  .workers-hero { border-radius: 12px; overflow: hidden; margin-bottom: 1.25rem; position: relative; min-height: 110px; background-image: url('/luis-guaman-6mtp5h4dG-A-unsplash.jpg'); background-size: cover; background-position: center 35%; }
  .workers-hero::before { content: ''; position: absolute; inset: 0; background: rgba(227,243,253,0.72); backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px); }
  .workers-hero-inner { position: relative; z-index: 1; padding: 1.4rem 1.5rem; }
  .workers-hero-title { font-size: 1.15rem; font-weight: 800; color: #064e3b; letter-spacing: -0.02em; margin: 0.25rem 0 0.2rem; }
  .workers-hero-sub { font-size: 0.7rem; color: #065f46; font-weight: 500; }

  /* ══ TWO-COL ═════════════════════════════════════════════════════════════════ */
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

  /* ══ PANELS ══════════════════════════════════════════════════════════════════ */
  .panel { background: rgba(255,255,255,0.72); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); border: 1px solid rgba(255,255,255,0.55); border-radius: 10px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04); }
  .panel-hdr { padding: 0.6rem 0.95rem; background: rgba(255,255,255,0.88); border-bottom: 1px solid rgba(0,0,0,0.06); font-size: 0.65rem; font-weight: 700; color: #065f46; text-transform: uppercase; letter-spacing: 0.1em; display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap; }

  /* ══ BLOCK INFO / GPS LOCK ═══════════════════════════════════════════════════ */
  .block-info { display: flex; align-items: center; gap: 0.4rem; padding: 0.45rem 0.7rem; border-radius: 6px; background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.25); font-size: 0.72rem; color: #92400e; }
  .block-gps-note { font-size: 0.65rem; color: #b45309; }
  .gps-lock-legend { padding: 0.75rem 1rem; border-top: 1px solid rgba(0,0,0,0.06); display: flex; flex-direction: column; gap: 0.3rem; }
  .legend-title { font-size: 0.6rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.1rem; }
  .legend-item  { display: flex; align-items: center; gap: 0.45rem; font-size: 0.68rem; color: #6b7280; }

  /* ══ TABLES ══════════════════════════════════════════════════════════════════ */
  .table-scroll { overflow-y: auto; max-height: 340px; }
  .data-table   { width: 100%; border-collapse: collapse; font-size: 0.75rem; }
  .data-table thead tr { border-bottom: 1px solid rgba(0,0,0,0.08); }
  .data-table th { padding: 0.4rem 0.75rem; font-size: 0.58rem; font-weight: 700; color: #065f46; text-transform: uppercase; letter-spacing: 0.1em; text-align: left; background: rgba(6,95,70,0.05); position: sticky; top: 0; z-index: 2; }
  .data-table td { padding: 0.36rem 0.75rem; border-bottom: 1px solid rgba(0,0,0,0.05); vertical-align: middle; color: #374151; }
  .tr:hover td  { background: rgba(6,95,70,0.03); }
  .tr:last-child td { border-bottom: none; }
  .td-n      { color: #d1d5db; font-size: 0.62rem; width: 26px; }
  .td-name   { font-weight: 600; color: #064e3b; }
  .td-mono   { font-family: 'Courier New', monospace; font-size: 0.7rem; color: #6b7280; letter-spacing: 0.04em; }
  .td-weight { font-weight: 700; color: #065f46; }
  .td-block  { font-size: 0.7rem; color: #4b5563; }
  .td-na     { color: #d1d5db; }

  /* ══ FORM ════════════════════════════════════════════════════════════════════ */
  .form  { padding: 0.95rem; display: flex; flex-direction: column; gap: 0.7rem; }
  .field { display: flex; flex-direction: column; gap: 0.3rem; }
  .field label { font-size: 0.6rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em; }
  .field input, .field select { padding: 0.52rem 0.75rem; background: rgba(255,255,255,0.9); border: 1px solid rgba(0,0,0,0.12); border-radius: 6px; font-family: 'Inter', sans-serif; font-size: 0.82rem; color: #111827; width: 100%; transition: border-color 0.12s, box-shadow 0.12s; }
  .field input:focus, .field select:focus { outline: none; border-color: #065f46; box-shadow: 0 0 0 3px rgba(6,95,70,0.1); }
  .field input:disabled, .field select:disabled { opacity: 0.4; }

  /* ══ BUTTONS ═════════════════════════════════════════════════════════════════ */
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; padding: 0.6rem 1rem; width: 100%; margin-top: 0.2rem; background: #065f46; color: #fff; border: none; border-radius: 6px; font-family: 'Inter', sans-serif; font-size: 0.82rem; font-weight: 600; cursor: pointer; letter-spacing: 0.02em; box-shadow: 0 2px 10px rgba(6,95,70,0.2); transition: background 0.12s, transform 0.12s, box-shadow 0.12s; }
  .btn:hover:not(:disabled)  { background: #047857; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(6,95,70,0.3); }
  .btn:active:not(:disabled) { transform: none; }
  .btn:disabled { opacity: 0.45; cursor: not-allowed; }
  /* GPS locked — bright green glow */
  .btn-gps-locked  { background: #16a34a !important; box-shadow: 0 0 16px rgba(22,163,74,0.5), 0 2px 10px rgba(22,163,74,0.3) !important; }
  /* GPS blocked — red */
  .btn-gps-blocked { background: #dc2626 !important; opacity: 1 !important; cursor: not-allowed !important; }
  .btn-export { width: auto; background: rgba(255,255,255,0.8); color: #374151; border: 1px solid rgba(0,0,0,0.12); box-shadow: none; }
  .btn-export:hover { background: rgba(6,95,70,0.08); border-color: #065f46; color: #064e3b; transform: none; box-shadow: none; }
  .btn-icon { width: 13px; height: 13px; }
  .del-btn  { background: none; border: 1px solid rgba(220,38,38,0.2); border-radius: 4px; color: #dc2626; font-size: 0.82rem; font-weight: 700; cursor: pointer; padding: 0.08rem 0.32rem; line-height: 1; transition: background 0.12s; }
  .del-btn:hover { background: rgba(220,38,38,0.06); }

  /* ══ ALERTS ══════════════════════════════════════════════════════════════════ */
  .alert      { padding: 0.48rem 0.75rem; border-radius: 6px; font-size: 0.72rem; font-weight: 600; }
  .alert-ok   { background: rgba(22,163,74,0.08);  color: #14532d; border: 1px solid rgba(22,163,74,0.2); }
  .alert-err  { background: rgba(220,38,38,0.07);  color: #7f1d1d; border: 1px solid rgba(220,38,38,0.15); }
  .alert-warn { background: rgba(245,158,11,0.08); color: #78350f; border: 1px solid rgba(245,158,11,0.2); }

  /* ══ GPS ═════════════════════════════════════════════════════════════════════ */
  .gps-row { display: flex; align-items: center; }
  .gps-tag  { font-size: 0.68rem; padding: 0.22rem 0.55rem; border-radius: 4px; background: rgba(255,255,255,0.7); color: #6b7280; border: 1px solid rgba(0,0,0,0.1); }
  .gps-ok   { color: #14532d; border-color: rgba(22,163,74,0.25); background: rgba(22,163,74,0.07); }
  .gps-wait { color: #92400e; border-color: rgba(217,119,6,0.25); }
  .gps-err  { color: #7f1d1d; border-color: rgba(220,38,38,0.25); background: rgba(220,38,38,0.07); }
  .gps-na   { color: #7f1d1d; border-color: rgba(220,38,38,0.2); }

  /* ══ SEARCH ══════════════════════════════════════════════════════════════════ */
  .search-wrap { display: flex; align-items: center; gap: 0.38rem; background: rgba(255,255,255,0.85); border: 1px solid rgba(0,0,0,0.1); border-radius: 6px; padding: 0.28rem 0.55rem; transition: border-color 0.12s; flex: 1; max-width: 200px; }
  .search-wrap:focus-within { border-color: #065f46; }
  .search-icon  { width: 11px; height: 11px; color: #9ca3af; flex-shrink: 0; }
  .search-input { flex: 1; border: none; background: transparent; font-family: 'Inter', sans-serif; font-size: 0.72rem; color: #111827; outline: none; }
  .search-input::placeholder { color: #d1d5db; }
  .clear-btn    { background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 0.72rem; line-height: 1; }

  /* ══ MISC ════════════════════════════════════════════════════════════════════ */
  .empty-state { padding: 1.75rem 1rem; text-align: center; }
  .empty-state p { font-size: 0.75rem; color: #9ca3af; }
  .map-wrap { height: 420px; border-radius: 10px; overflow: hidden; border: 1px solid rgba(0,0,0,0.08); box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  :global(.map-pin) { width: 12px; height: 12px; border-radius: 50%; background: #16a34a; box-shadow: 0 0 8px #16a34a, 0 0 16px rgba(22,163,74,0.4); }
  .export-row  { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; padding-top: 1.1rem; margin-top: 1.1rem; border-top: 1px solid rgba(0,0,0,0.07); }
  .export-note { font-size: 0.72rem; color: #6b7280; }
  .overlay { position: fixed; inset: 0; background: rgba(255,255,255,0.3); backdrop-filter: blur(4px); z-index: 90; }
  .spinner { width: 11px; height: 11px; border-radius: 50%; border: 1.5px solid rgba(255,255,255,0.3); border-top-color: #fff; animation: spin 0.7s linear infinite; flex-shrink: 0; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ══ BOTTOM NAV ══════════════════════════════════════════════════════════════ */
  .bottom-nav { display: none; }

  /* ══ RESPONSIVE ══════════════════════════════════════════════════════════════ */
  @media (max-width: 1024px) {
    .two-col  { grid-template-columns: 1fr; }
    .kpi-grid { grid-template-columns: repeat(3,1fr); }
    .ss-grid  { grid-template-columns: repeat(3,1fr); }
  }
  @media (max-width: 768px) {
    .sidebar { position: fixed; top: 0; left: 0; height: 100vh; transform: translateX(-100%); z-index: 95; }
    .sidebar.open { transform: translateX(0); box-shadow: 4px 0 24px rgba(0,0,0,0.15); }
    .hamburger { display: flex; }
    .main      { padding-bottom: 60px; }
    .section   { padding: 1.25rem 1rem; }
    .map-wrap  { height: 300px; }
    .status-bar { padding: 0 1rem; font-size: 0.6rem; }
    .topbar    { top: 28px; padding: 0 1rem; }
    .kpi-grid  { grid-template-columns: repeat(2,1fr); }
    .foreman-badge { display: none; }
    .offline-badge { bottom: 4.5rem; }
    .bottom-nav {
      display: flex; position: fixed; bottom: 0; left: 0; right: 0;
      background: rgba(255,255,255,0.92); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
      border-top: 1px solid rgba(0,0,0,0.07); z-index: 200;
      padding-bottom: env(safe-area-inset-bottom, 0px); box-shadow: 0 -4px 20px rgba(0,0,0,0.06);
    }
    .bn-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.15rem; padding: 0.65rem 0.25rem; position: relative; background: none; border: none; cursor: pointer; color: #9ca3af; font-family: 'Inter', sans-serif; transition: color 0.12s; }
    .bn-item:hover  { color: #374151; }
    .bn-item.active { color: #064e3b; border-top: 2px solid #065f46; }
    .bn-label { font-size: 0.55rem; font-weight: 600; letter-spacing: 0.02em; }
    .bn-badge { position: absolute; top: 4px; right: calc(50% - 20px); background: #d97706; color: #fff; font-size: 0.5rem; font-weight: 800; padding: 0.05rem 0.28rem; border-radius: 999px; min-width: 14px; text-align: center; }
  }
  @media (max-width: 480px) {
    .kpi-grid { grid-template-columns: 1fr 1fr; }
    .ss-grid  { grid-template-columns: 1fr 1fr 1fr; }
  }
</style>
