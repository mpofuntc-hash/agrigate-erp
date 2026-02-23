<script lang="ts">
  import DataTable from "$lib/components/ui/DataTable.svelte";

  const columns = [
    { key: "name", label: "Customer Name" },
    { key: "contactPerson", label: "Contact" },
    { key: "phone", label: "Phone" },
    { key: "customerType", label: "Type" },
    { key: "isActive", label: "Active" },
  ];
  const rows: Record<string, unknown>[] = [];
</script>

<svelte:head><title>Customers – ZZ2 ERP</title></svelte:head>

<div class="page-header">
  <h2>Customers</h2>
  <button class="btn-primary">+ New Customer</button>
</div>
<DataTable {columns} {rows} />

<style>
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
  h2 { margin: 0; color: #1b5e20; font-size: 1.3rem; }
  .btn-primary { background: #2e7d32; color: #fff; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 600; }
</style>
