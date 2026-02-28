<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { convex, api } from "$lib/convex/client";

  type Stats = {
    farmName: string;
    farmTier: string;
    workerCount: number;
    pendingCount: number;
    todayActivities: number;
    fuelBalance: number;
    monthKg: number;
    monthEarnings: number;
    role: string;
  };

  let stats = $state<Stats | null>(null);
  let unsub: (() => void) | undefined;

  const now        = new Date();
  const monthLabel = now.toLocaleString("en-ZA", { month: "long", year: "numeric" });

  onMount(() => {
    const token = localStorage.getItem("convexAuthToken");
    if (token) {
      convex.setAuth(async () => token);
      unsub = convex.onUpdate(api.dashboard.getDashboardStats, {}, (data) => {
        stats = data as Stats | null;
      });
    }
  });

  onDestroy(() => unsub?.());

  const reportCards = [
    { icon: "🌾", name: "Yield by Field",        description: "Planned vs actual yield per field and season",         soon: true  },
    { icon: "📦", name: "Inventory Valuation",    description: "Current stock value by product and warehouse",         soon: true  },
    { icon: "💼", name: "Sales by Customer",      description: "Sales volume and revenue grouped by customer",         soon: true  },
    { icon: "🛒", name: "Procurement Summary",    description: "PO totals by supplier and period",                     soon: true  },
    { icon: "👷", name: "HR Head Count",          description: "Vetted worker count and application pipeline",         soon: true  },
    { icon: "📈", name: "Monthly Activity Log",   description: "All farm activities this month by category",           soon: true  },
  ];
</script>

<svelte:head><title>Reports — AgriGate</title></svelte:head>

<!-- Live KPI summary -->
<div class="rpt-header">
  <div>
    <p class="rpt-eyebrow">
      {stats?.farmName ?? "Your Farm"} · {monthLabel}
    </p>
    <h2 class="rpt-title">Reports & Analytics</h2>
  </div>
</div>

<div class="kpi-row">
  <div class="kpi">
    <span class="kpi-val">{stats != null ? stats.monthKg.toLocaleString() : "–"}</span>
    <span class="kpi-lbl">kg Harvested</span>
  </div>
  <div class="kpi">
    <span class="kpi-val">{stats != null ? `R ${stats.monthEarnings.toLocaleString()}` : "–"}</span>
    <span class="kpi-lbl">Month Earnings</span>
  </div>
  <div class="kpi">
    <span class="kpi-val">{stats?.workerCount ?? "–"}</span>
    <span class="kpi-lbl">Vetted Workers</span>
  </div>
  <div class="kpi">
    <span class="kpi-val">{stats != null ? stats.fuelBalance : "–"}</span>
    <span class="kpi-lbl">Fuel Balance (L)</span>
  </div>
  <div class="kpi">
    <span class="kpi-val">{stats?.todayActivities ?? "–"}</span>
    <span class="kpi-lbl">Today's Activities</span>
  </div>
</div>

<!-- Report catalogue -->
<h3 class="section-title">Report Catalogue</h3>
<div class="report-grid">
  {#each reportCards as r}
    <div class="report-card">
      <span class="r-icon">{r.icon}</span>
      <div class="r-body">
        <strong>{r.name}</strong>
        <p>{r.description}</p>
      </div>
      {#if r.soon}
        <span class="r-soon">Soon</span>
      {/if}
    </div>
  {/each}
</div>

<style>
  /* ── Header ── */
  .rpt-header {
    display: flex; align-items: flex-start; justify-content: space-between;
    padding-bottom: 1.25rem;
    border-bottom: 1px solid rgba(0,0,0,0.06);
    margin-bottom: 1.25rem;
  }
  .rpt-eyebrow {
    font-size: 0.58rem; font-weight: 700; color: #5c9470;
    text-transform: uppercase; letter-spacing: 0.18em; margin-bottom: 0.25rem;
  }
  .rpt-title {
    font-size: 1.2rem; font-weight: 800; color: #064e3b;
    letter-spacing: -0.02em; margin: 0;
  }

  /* ── KPI row ── */
  .kpi-row {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 0.75rem;
    margin-bottom: 2rem;
  }
  .kpi {
    background: rgba(255,255,255,0.75);
    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.55);
    border-top: 3px solid #065f46;
    border-radius: 8px; padding: 1rem 1.1rem;
    box-shadow: 0 4px 16px rgba(0,0,0,0.05);
  }
  .kpi-val {
    display: block;
    font-family: 'Roboto Slab', serif;
    font-size: 1.6rem; font-weight: 800; color: #064e3b;
    line-height: 1; letter-spacing: -0.02em; margin-bottom: 0.35rem;
  }
  .kpi-lbl {
    font-size: 0.6rem; font-weight: 700; color: #9ca3af;
    text-transform: uppercase; letter-spacing: 0.1em;
  }

  /* ── Report catalogue ── */
  .section-title {
    font-size: 0.75rem; font-weight: 700; color: #6b7280;
    text-transform: uppercase; letter-spacing: 0.12em;
    margin: 0 0 0.9rem;
  }
  .report-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 0.75rem;
  }
  .report-card {
    background: rgba(255,255,255,0.75);
    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.55);
    border-radius: 10px; padding: 1rem 1.1rem;
    display: flex; align-items: center; gap: 0.85rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }
  .r-icon { font-size: 1.4rem; flex-shrink: 0; }
  .r-body { flex: 1; }
  .r-body strong { font-size: 0.85rem; color: #111827; display: block; margin-bottom: 0.15rem; }
  .r-body p      { margin: 0; font-size: 0.75rem; color: #6b7280; line-height: 1.4; }
  .r-soon {
    flex-shrink: 0;
    font-size: 0.6rem; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; padding: 0.18rem 0.5rem;
    background: #f0fdf4; border: 1px solid #bbf7d0;
    color: #065f46; border-radius: 999px;
  }

  @media (max-width: 600px) {
    .kpi-row { grid-template-columns: repeat(2, 1fr); }
  }
</style>
