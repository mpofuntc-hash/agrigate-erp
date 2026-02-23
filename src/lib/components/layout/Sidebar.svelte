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
    { label: "Reports", href: "/reports", icon: "📈" },
    { label: "Settings", href: "/settings", icon: "⚙️" },
  ];

  let expanded: Record<string, boolean> = {};

  function toggle(label: string) {
    expanded[label] = !expanded[label];
  }
</script>

<aside class="sidebar">
  <div class="sidebar-header">
    <span class="logo">ZZ2 ERP</span>
    <small class="subtitle">AgriGate</small>
  </div>

  <nav>
    {#each nav as item}
      {#if item.children}
        <div class="nav-group">
          <button class="nav-item group-toggle" onclick={() => toggle(item.label)}>
            <span class="icon">{item.icon}</span>
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
          <span class="icon">{item.icon}</span>
          <span>{item.label}</span>
        </a>
      {/if}
    {/each}
  </nav>
</aside>

<style>
  .sidebar {
    width: 240px;
    height: 100vh;
    background: #1a2e1a;
    color: #e8f5e9;
    display: flex;
    flex-direction: column;
    padding: 0 0 1rem 0;
    /* Sticky on desktop */
    position: sticky;
    top: 0;
    flex-shrink: 0;
    overflow-y: auto;
  }
  .sidebar-header {
    padding: 1.5rem 1rem 1rem;
    border-bottom: 1px solid #2e5c2e;
    display: flex;
    flex-direction: column;
  }
  .logo {
    font-size: 1.4rem;
    font-weight: 700;
    color: #81c784;
  }
  .subtitle {
    font-size: 0.75rem;
    color: #a5d6a7;
  }
  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    color: #c8e6c9;
    text-decoration: none;
    font-size: 0.9rem;
    cursor: pointer;
    background: none;
    border: none;
    width: 100%;
    text-align: left;
    transition: background 0.15s;
  }
  .nav-item:hover {
    background: #2e5c2e;
    color: #fff;
  }
  .group-toggle {
    justify-content: space-between;
  }
  .nav-children {
    padding-left: 1.5rem;
  }
  .nav-child {
    display: block;
    padding: 0.4rem 0.75rem;
    color: #a5d6a7;
    text-decoration: none;
    font-size: 0.85rem;
  }
  .nav-child:hover {
    color: #fff;
  }
  .icon { width: 1.2rem; text-align: center; }
  .chevron { margin-left: auto; }
</style>
