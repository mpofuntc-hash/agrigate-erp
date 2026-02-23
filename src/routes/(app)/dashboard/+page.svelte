<script lang="ts">
  import StatCard from "$lib/components/ui/StatCard.svelte";
</script>

<svelte:head><title>Dashboard – ZZ2 ERP</title></svelte:head>

<h2 class="page-heading">Dashboard</h2>

<div class="stats-grid">
  <StatCard label="Active Fields" value="0" unit="ha" color="#2e7d32" />
  <StatCard label="Open Sales Orders" value="0" color="#1565c0" />
  <StatCard label="Open POs" value="0" color="#e65100" />
  <StatCard label="Employees" value="0" color="#6a1b9a" />
  <StatCard label="Month Revenue" value="R 0" color="#00838f" />
  <StatCard label="Stock Items" value="0" color="#558b2f" />
</div>

<style>
  .page-heading {
    font-size: 1.4rem;
    font-weight: 700;
    color: #1b5e20;
    margin: 0 0 1.5rem;
  }
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }
</style>
