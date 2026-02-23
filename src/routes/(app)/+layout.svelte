<script lang="ts">
  import Sidebar from "$lib/components/layout/Sidebar.svelte";
  import TopBar from "$lib/components/layout/TopBar.svelte";

  let { children } = $props();
</script>

<div class="app-shell">
  <Sidebar />
  <div class="main-area">
    <TopBar />
    <main class="content">
      {@render children()}
    </main>
  </div>
</div>

<style>
  :global(*, *::before, *::after) { box-sizing: border-box; }
  :global(body) { margin: 0; font-family: system-ui, sans-serif; background: #f5f5f5; }

  .app-shell {
    display: flex;
    min-height: 100vh;
  }
  .main-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .content {
    flex: 1;
    padding: 1.5rem;
    overflow-y: auto;
  }
</style>
