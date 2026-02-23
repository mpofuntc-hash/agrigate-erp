<script lang="ts">
  const sections = [
    { label: "Company Info", description: "Business name, registration, tax details" },
    { label: "Users & Roles", description: "Manage users and access permissions" },
    { label: "Departments", description: "Organisational departments" },
    { label: "Product Categories", description: "Inventory and product classification" },
    { label: "Integrations", description: "External service connections" },
  ];
</script>

<svelte:head><title>Settings – ZZ2 ERP</title></svelte:head>

<h2 class="page-heading">Settings</h2>

<div class="settings-list">
  {#each sections as section}
    <button class="settings-item">
      <div>
        <strong>{section.label}</strong>
        <p>{section.description}</p>
      </div>
      <span class="arrow">›</span>
    </button>
  {/each}
</div>

<style>
  .page-heading { margin: 0 0 1.5rem; color: #1b5e20; font-size: 1.3rem; }
  .settings-list { display: flex; flex-direction: column; gap: 0.5rem; max-width: 600px; }
  .settings-item {
    background: #fff; border: 1px solid #e0e0e0; border-radius: 8px;
    padding: 1rem 1.25rem; display: flex; align-items: center;
    justify-content: space-between; cursor: pointer; text-align: left;
    transition: border-color 0.15s;
  }
  .settings-item:hover { border-color: #2e7d32; }
  .settings-item strong { color: #1b5e20; display: block; }
  .settings-item p { margin: 0.2rem 0 0; color: #666; font-size: 0.85rem; }
  .arrow { font-size: 1.4rem; color: #aaa; }
</style>
