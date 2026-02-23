<script lang="ts">
  import Sidebar from "$lib/components/layout/Sidebar.svelte";
  import TopBar  from "$lib/components/layout/TopBar.svelte";
  import { page } from "$app/state";

  let { children } = $props();

  const bottomNav = [
    { href: "/dashboard",              prefix: "/dashboard",        icon: "📊", label: "Dashboard" },
    { href: "/farm-management/fields", prefix: "/farm-management",  icon: "🌾", label: "Farm"      },
    { href: "/inventory/products",     prefix: "/inventory",        icon: "📦", label: "Inventory" },
    { href: "/hr/employees",           prefix: "/hr",               icon: "👷", label: "HR"        },
    { href: "/settings",               prefix: "/settings",         icon: "⚙️",  label: "Settings"  },
  ];
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

<!-- Mobile bottom navigation -->
<nav class="bottom-nav" aria-label="Main navigation">
  {#each bottomNav as item}
    <a
      class="bn-item"
      class:active={page.url.pathname.startsWith(item.prefix)}
      href={item.href}
    >
      <span class="bn-icon">{item.icon}</span>
      <span class="bn-label">{item.label}</span>
    </a>
  {/each}
</nav>

<style>
  :global(*, *::before, *::after) { box-sizing: border-box; }
  :global(body) {
    margin: 0;
    font-family: 'Inter', system-ui, sans-serif;
    background: #f5f5f5;
  }

  /* ── Desktop shell ──────────────────────────────────────────────────────── */
  .app-shell {
    display: flex;
    min-height: 100vh;
  }

  .main-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 0;
  }

  .content {
    flex: 1;
    padding: 1.5rem;
    overflow-y: auto;
  }

  /* ── Bottom nav – hidden on desktop ────────────────────────────────────── */
  .bottom-nav { display: none; }

  /* ── Mobile layout ──────────────────────────────────────────────────────── */
  @media (max-width: 768px) {
    /* Hide desktop sidebar */
    :global(.sidebar) { display: none !important; }

    /* Push content above the bottom nav */
    .content { padding: 1rem 1rem calc(1rem + 60px); }

    /* Bottom nav bar */
    .bottom-nav {
      display: flex;
      position: fixed; bottom: 0; left: 0; right: 0;
      background: #1a2e1a;
      border-top: 1px solid rgba(255,255,255,0.1);
      z-index: 200;
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }

    .bn-item {
      flex: 1;
      display: flex; flex-direction: column; align-items: center;
      gap: 0.2rem; padding: 0.6rem 0.25rem;
      color: #7cb87e; text-decoration: none;
      font-family: 'Inter', sans-serif;
      transition: background 0.15s, color 0.15s;
    }
    .bn-item:hover   { background: rgba(255,255,255,0.06); color: #fff; }
    .bn-item.active  { color: #fff; background: rgba(46,125,50,0.35); }

    .bn-icon  { font-size: 1.15rem; line-height: 1; }
    .bn-label { font-size: 0.58rem; font-weight: 600; letter-spacing: 0.02em; }
  }
</style>
