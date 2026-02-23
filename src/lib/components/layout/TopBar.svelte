<script lang="ts">
  let { title = "ZZ2 ERP" }: { title?: string } = $props();
</script>

<header class="topbar">
  <h1 class="page-title">{title}</h1>
  <div class="topbar-right">
    <span class="user-chip">Admin</span>
  </div>
</header>

<style>
  .topbar {
    height: 56px;
    background: #fff;
    border-bottom: 1px solid #e0e0e0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1.5rem;
    position: sticky;
    top: 0;
    z-index: 10;
  }
  .page-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1b5e20;
    margin: 0;
  }
  .user-chip {
    background: #e8f5e9;
    color: #2e7d32;
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 600;
  }
</style>
