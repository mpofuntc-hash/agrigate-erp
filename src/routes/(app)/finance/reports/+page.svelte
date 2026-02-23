<script lang="ts">
  const reports = [
    { name: "Income Statement", description: "Revenue vs expenses for a period" },
    { name: "Balance Sheet", description: "Assets, liabilities and equity snapshot" },
    { name: "Trial Balance", description: "All account debit/credit balances" },
    { name: "Cash Flow", description: "Cash inflows and outflows" },
  ];
</script>

<svelte:head><title>Financial Reports – ZZ2 ERP</title></svelte:head>

<h2 class="page-heading">Financial Reports</h2>

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
