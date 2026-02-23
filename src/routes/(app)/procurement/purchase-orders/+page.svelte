<script lang="ts">
  import DataTable from "$lib/components/ui/DataTable.svelte";

  const columns = [
    { key: "poNumber", label: "PO Number" },
    { key: "supplier", label: "Supplier" },
    { key: "orderDate", label: "Date" },
    { key: "totalAmount", label: "Total", align: "right" as const },
    { key: "status", label: "Status" },
  ];
  const rows: Record<string, unknown>[] = [];
</script>

<svelte:head><title>Purchase Orders – ZZ2 ERP</title></svelte:head>

<div class="page-header">
  <h2>Purchase Orders</h2>
  <button class="btn-primary">+ New PO</button>
</div>
<DataTable {columns} {rows} />

<style>
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
  h2 { margin: 0; color: #1b5e20; font-size: 1.3rem; }
  .btn-primary { background: #2e7d32; color: #fff; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 600; }
  .btn-primary:hover { background: #1b5e20; }
</style>
