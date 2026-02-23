<script lang="ts">
  import DataTable from "$lib/components/ui/DataTable.svelte";

  const columns = [
    { key: "reference", label: "Reference" },
    { key: "date", label: "Date" },
    { key: "description", label: "Description" },
    { key: "amount", label: "Amount", align: "right" as const },
    { key: "sourceType", label: "Source" },
  ];
  const rows: Record<string, unknown>[] = [];
</script>

<svelte:head><title>Transactions – ZZ2 ERP</title></svelte:head>

<div class="page-header">
  <h2>Transactions</h2>
  <button class="btn-primary">+ Journal Entry</button>
</div>
<DataTable {columns} {rows} />

<style>
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
  h2 { margin: 0; color: #1b5e20; font-size: 1.3rem; }
  .btn-primary { background: #2e7d32; color: #fff; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 600; }
</style>
