<script lang="ts">
  import type { NavItem } from "$lib/types";

  const nav: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: "📊" },
    {
      label: "Farm Management",
      href: "/farm-management",
      icon: "🌾",
      children: [
        { label: "Fields", href: "/farm-management/fields" },
        { label: "Crops", href: "/farm-management/crops" },
        { label: "Seasons", href: "/farm-management/seasons" },
      ],
    },
    {
      label: "Inventory",
      href: "/inventory",
      icon: "📦",
      children: [
        { label: "Products", href: "/inventory/products" },
        { label: "Warehouses", href: "/inventory/warehouses" },
        { label: "Stock Movements", href: "/inventory/stock-movements" },
      ],
    },
    {
      label: "Procurement",
      href: "/procurement",
      icon: "🛒",
      children: [
        { label: "Purchase Orders", href: "/procurement/purchase-orders" },
        { label: "Suppliers", href: "/procurement/suppliers" },
      ],
    },
    {
      label: "Sales",
      href: "/sales",
      icon: "💼",
      children: [
        { label: "Orders", href: "/sales/orders" },
        { label: "Customers", href: "/sales/customers" },
      ],
    },
    {
      label: "HR",
      href: "/hr",
      icon: "👷",
      children: [
        { label: "Employees", href: "/hr/employees" },
        { label: "Payroll", href: "/hr/payroll" },
      ],
    },
    {
      label: "Finance",
      href: "/finance",
      icon: "💰",
      children: [
        { label: "Accounts", href: "/finance/accounts" },
        { label: "Transactions", href: "/finance/transactions" },
        { label: "Reports", href: "/finance/reports" },
      ],
    },
    { label: "Reports",  href: "/reports",  icon: "📈" },
    { label: "Settings", href: "/settings", icon: "⚙️" },
  ];

  let expanded: Record<string, boolean> = {};
  function toggle(label: string) { expanded[label] = !expanded[label]; }
</script>

<aside class="sidebar">
  <div class="sidebar-header">
    <p class="sidebar-sup">ZZ2 Farm Operations</p>
    <span class="logo">AgriGate ERP</span>
  </div>

  <nav>
    {#each nav as item}
      {#if item.children}
        <div class="nav-group">
          <button class="nav-item group-toggle" onclick={() => toggle(item.label)}>
            <span>{item.label}</span>
            <span class="chevron">{expanded[item.label] ? "▾" : "▸"}</span>
          </button>
          {#if expanded[item.label]}
            <div class="nav-children">
              {#each item.children as child}
                <a class="nav-child" href={child.href}>{child.label}</a>
              {/each}
            </div>
          {/if}
        </div>
      {:else}
        <a class="nav-item" href={item.href}>
          <span>{item.label}</span>
        </a>
      {/if}
    {/each}
  </nav>

  <div class="sidebar-footer">
    <a href="/logout" class="logout-btn">
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M7 3H4a1 1 0 00-1 1v12a1 1 0 001 1h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M13 13l3-3-3-3M16 10H8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Sign out
    </a>
  </div>
</aside>

<style>
  .sidebar {
    width: 240px;
    height: 100vh;
    background: rgba(255, 255, 255, 0.82);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-right: 1px solid rgba(255, 255, 255, 0.55);
    box-shadow: 2px 0 24px rgba(0, 0, 0, 0.06);
    display: flex;
    flex-direction: column;
    padding: 0 0 1rem 0;
    position: sticky;
    top: 0;
    flex-shrink: 0;
    overflow-y: auto;
  }
  .sidebar-header {
    padding: 1.4rem 1.1rem 1rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    display: flex;
    flex-direction: column;
  }
  .sidebar-sup {
    font-size: 0.58rem; font-weight: 700; color: #6b7280;
    letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 0.25rem;
  }
  .logo { font-size: 1.1rem; font-weight: 800; color: #064e3b; letter-spacing: -0.01em; }

  .nav-item {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0.55rem 1.1rem;
    color: #374151; text-decoration: none;
    font-size: 0.82rem; font-weight: 500;
    cursor: pointer; background: none; border: none;
    width: 100%; text-align: left;
    transition: background 0.12s, color 0.12s;
  }
  .nav-item:hover { background: rgba(6, 95, 70, 0.06); color: #064e3b; }
  .group-toggle { justify-content: space-between; }
  .nav-children { padding-left: 1.4rem; border-left: 2px solid rgba(6,95,70,0.15); margin: 0.1rem 0 0.1rem 1.1rem; }
  .nav-child {
    display: block; padding: 0.38rem 0.75rem;
    color: #6b7280; text-decoration: none; font-size: 0.78rem;
    border-radius: 4px; transition: background 0.12s, color 0.12s;
  }
  .nav-child:hover { background: rgba(6,95,70,0.06); color: #064e3b; }
  .chevron { color: #9ca3af; font-size: 0.7rem; }

  .sidebar-footer {
    margin-top: auto;
    padding: 0.75rem 1rem 0.5rem;
    border-top: 1px solid rgba(0,0,0,0.06);
  }
  .logout-btn {
    display: flex; align-items: center; gap: 0.55rem;
    width: 100%; padding: 0.55rem 0.75rem;
    color: #6b7280; text-decoration: none;
    font-size: 0.8rem; font-weight: 500;
    border-radius: 6px;
    transition: background 0.12s, color 0.12s;
  }
  .logout-btn svg { width: 16px; height: 16px; flex-shrink: 0; }
  .logout-btn:hover { background: rgba(220, 38, 38, 0.07); color: #dc2626; }
</style>
