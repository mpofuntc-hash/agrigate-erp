<script lang="ts">
  const reports = [
    { name: "Yield by Field", description: "Planned vs actual yield per field and season" },
    { name: "Inventory Valuation", description: "Current stock value by product and warehouse" },
    { name: "Sales by Customer", description: "Sales volume and revenue grouped by customer" },
    { name: "Procurement Summary", description: "PO totals by supplier and period" },
    { name: "HR Head Count", description: "Employee count by department" },
  ];
</script>

<svelte:head><title>Reports – ZZ2 ERP</title></svelte:head>

<h2 class="page-heading">Reports</h2>

<div class="report-grid">
  {#each reports as report}
    <button class="report-card">
      <strong>{report.name}</strong>
      <p>{report.description}</p>
    </button>
  {/each}
</div>

<style>
  .page-heading { margin: 0 0 1.5rem; color: #1b5e20; font-size: 1.3rem; }
  .report-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
  .report-card {
    background: #fff; border: 1px solid #c8e6c9; border-radius: 8px;
    padding: 1.25rem; text-align: left; cursor: pointer;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    transition: border-color 0.15s;
  }
  .report-card:hover { border-color: #2e7d32; }
  .report-card strong { color: #1b5e20; display: block; margin-bottom: 0.4rem; }
  .report-card p { margin: 0; color: #555; font-size: 0.85rem; }
</style>
