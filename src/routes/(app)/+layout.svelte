<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { page } from "$app/state";
  import { convex, api } from "$lib/convex/client";
  import Sidebar from "$lib/components/layout/Sidebar.svelte";
  import TopBar  from "$lib/components/layout/TopBar.svelte";

  let { children, data } = $props();

  let userName = $state<string | null>(null);
  let userRole = $state<string | null>(null);
  let unsub: (() => void) | undefined;

  onMount(() => {
    const token = localStorage.getItem("convexAuthToken");
    if (token) {
      convex.setAuth(async () => token);
      unsub = convex.onUpdate(api.userProfile.getMyProfile, {}, (profile: any) => {
        userName = profile?.fullName ?? null;
        userRole = profile?.role    ?? null;
      });
    }
  });

  onDestroy(() => unsub?.());

  const bottomNav = [
    { href: "/dashboard",              prefix: "/dashboard",       icon: "📊", label: "Dashboard" },
    { href: "/farm-management/fields", prefix: "/farm-management", icon: "🌾", label: "Farm"      },
    { href: "/inventory/products",     prefix: "/inventory",       icon: "📦", label: "Inventory" },
    { href: "/hr/employees",           prefix: "/hr",              icon: "👷", label: "HR"        },
    { href: "/finance/accounts",       prefix: "/finance",         icon: "💰", label: "Finance"   },
    { href: "/settings",               prefix: "/settings",        icon: "⚙️",  label: "Settings"  },
  ];
</script>

<div class="app-shell">
  <Sidebar />
  <div class="main-area">
    <TopBar tier={data.tier} {userName} {userRole} />
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

  .bottom-nav { display: none; }

  @media (max-width: 768px) {
    :global(.sidebar) { display: none !important; }
    .content { padding: 1rem 1rem calc(1rem + 64px); }

    .bottom-nav {
      display: flex;
      position: fixed; bottom: 0; left: 0; right: 0;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-top: 1px solid rgba(0, 0, 0, 0.07);
      z-index: 200;
      padding-bottom: env(safe-area-inset-bottom, 0px);
      box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.06);
    }
    .bn-item {
      flex: 1; display: flex; flex-direction: column; align-items: center;
      gap: 0.2rem; padding: 0.6rem 0.25rem;
      color: #9ca3af; text-decoration: none;
      font-family: 'Inter', sans-serif;
      transition: color 0.12s;
    }
    .bn-item:hover  { color: #374151; }
    .bn-item.active { color: #064e3b; border-top: 2px solid #065f46; }
    .bn-icon  { font-size: 1.1rem; line-height: 1; }
    .bn-label { font-size: 0.58rem; font-weight: 600; }
  }
</style>
