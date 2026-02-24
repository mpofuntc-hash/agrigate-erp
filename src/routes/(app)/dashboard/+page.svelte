<script lang="ts">
  import StatCard from "$lib/components/ui/StatCard.svelte";

  const lastUpdated = new Date().toLocaleString("en-ZA", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });
</script>

<svelte:head><title>Dashboard — AgriGate ERP</title></svelte:head>

<!-- System status bar -->
<div class="status-bar">
  <span class="st-item"><span class="glow-dot glow-green"></span>Cloud Sync: Active</span>
  <span class="st-sep">·</span>
  <span class="st-item"><span class="glow-dot glow-green"></span>GPS: Fixed</span>
  <span class="st-sep">·</span>
  <span class="st-muted">Version 1.0.4-PRO</span>
</div>

<div class="dash-header">
  <p class="dash-eyebrow">ZZ2 Farms · Real-Time Operations</p>
  <h2 class="dash-title">Operations Dashboard</h2>
  <p class="dash-sub">Farm · Inventory · Finance · HR — live overview</p>
</div>

<div class="stats-grid">
  <StatCard label="Active Fields"     value="0" unit="ha" color="#4a7c59" />
  <StatCard label="Open Sales Orders" value="0"           color="#4a6a8a" />
  <StatCard label="Open POs"          value="0"           color="#7a5a3a" />
  <StatCard label="Employees"         value="0"           color="#5a4a7a" />
  <StatCard label="Month Revenue"     value="R 0"         color="#3a6a6a" />
  <StatCard label="Stock Items"       value="0"           color="#4a6a4a" />
</div>

<!-- Live timestamp footer -->
<div class="last-updated">
  <span class="glow-dot glow-green"></span>
  Last Updated: {lastUpdated}
</div>

<style>
  /* ── Status bar ── */
  .status-bar {
    background: rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    margin: -1.5rem -1.5rem 0;
    height: 28px; padding: 0 1.5rem;
    display: flex; align-items: center; gap: 0.8rem;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 0.65rem; color: #6b7280; letter-spacing: 0.02em;
  }
  .st-item  { display: flex; align-items: center; gap: 0.38rem; }
  .st-sep   { color: #d1d5db; }
  .st-muted { color: #d1d5db; }

  /* Glow dots */
  .glow-dot { display: inline-block; flex-shrink: 0; width: 8px; height: 8px; border-radius: 50%; }
  .glow-green {
    background: #22c55e;
    box-shadow: 0 0 10px #22c55e, 0 0 22px rgba(34,197,94,0.6), 0 0 40px rgba(34,197,94,0.25);
  }

  /* ── Header ── */
  .dash-header {
    padding: 1.5rem 0 1.25rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    margin-bottom: 1.25rem;
  }
  .dash-eyebrow { font-size: 0.58rem; font-weight: 700; color: #5c9470; text-transform: uppercase; letter-spacing: 0.18em; margin-bottom: 0.3rem; }
  .dash-title   { font-size: 1.25rem; font-weight: 800; color: #064e3b; letter-spacing: -0.02em; }
  .dash-sub     { font-size: 0.72rem; color: #9ca3af; margin-top: 0.2rem; }

  /* ── KPI grid ── */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  /* ── Last Updated timestamp ── */
  .last-updated {
    display: flex; align-items: center; gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.55);
    border-radius: 8px;
    font-size: 0.65rem; color: #6b7280; letter-spacing: 0.02em;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  }

  @media (max-width: 768px) {
    .status-bar { margin: -1rem -1rem 0; padding: 0 1rem; }
    .dash-header { padding: 1.1rem 0 1rem; }
  }
</style>
