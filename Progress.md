# AgriGate – Project Progress & Roadmap

## What We Have Built

### Foundation
- **SvelteKit 5** project with TypeScript, Vite, and `@sveltejs/adapter-auto`
- **Convex** real-time backend connected and configured (`src/lib/convex/client.ts`)
- **Inter** font, **Leaflet** map library loaded globally via `src/app.html`
- Shared utility helpers (`src/lib/utils/format.ts`) and shared types (`src/lib/types/index.ts`)

### App Shell / Navigation
- `(app)` route group with a persistent shell layout (`src/routes/(app)/+layout.svelte`)
- **Sidebar** component with links to all modules (`src/lib/components/layout/Sidebar.svelte`)
- **TopBar** component (`src/lib/components/layout/TopBar.svelte`)
- **Login page** scaffolded (`src/routes/(auth)/login/+page.svelte`)
- Root redirect (`src/routes/+page.svelte` / `+page.ts`)

### Reusable UI Components
- `StatCard` – KPI metric cards used on the dashboard
- `DataTable` – generic sortable/filterable table wrapper

### Convex Database Schema (`convex/schema.ts`)
Full schema defined and deployed for every planned module:
| Table | Purpose |
|---|---|
| `workers` | Field-worker identities (name, SA ID, village) |
| `yieldLogs` | Harvest bin-weight entries with optional GPS coords |
| `users` | App user accounts with role-based access |
| `fields` | Farm fields with hectares & soil/irrigation type |
| `crops` | Crop catalogue with variety & growth days |
| `seasons` | Planting seasons linking fields → crops |
| `warehouses` | Storage locations |
| `products` | Inventory SKU catalogue |
| `stockMovements` | Inventory in/out/adjustment journal |
| `suppliers` | Procurement supplier directory |
| `purchaseOrders` + `purchaseOrderLines` | Purchase order management |
| `customers` | Sales customer directory |
| `salesOrders` + `salesOrderLines` | Sales order management |
| `employees` | HR employee records with salary type |
| `payrollRuns` | Payroll period summaries |
| `accounts` | Chart of accounts (asset/liability/equity/income/expense) |
| `transactions` | Double-entry financial journal |

### Convex Backend Functions
- **`convex/workers.ts`** – CRUD mutations/queries for worker registry
- **`convex/yieldLogs.ts`** – `logBin` mutation, `listTodayLogs` query, `deleteYieldLog` mutation

### Pages Completed
| Route | Status |
|---|---|
| `/dashboard` | Live dashboard with StatCards and today's summary |
| `/` (Yield Logger) | Full bin-weight logging UI with GPS capture and Leaflet map |
| `/farm-management/fields` | Scaffold |
| `/farm-management/crops` | Scaffold |
| `/farm-management/seasons` | Scaffold |
| `/inventory/products` | Scaffold |
| `/inventory/warehouses` | Scaffold |
| `/inventory/stock-movements` | Scaffold |
| `/procurement/suppliers` | Scaffold |
| `/procurement/purchase-orders` | Scaffold |
| `/sales/customers` | Scaffold |
| `/sales/orders` | Scaffold |
| `/hr/employees` | Scaffold |
| `/hr/payroll` | Scaffold |
| `/finance/accounts` | Scaffold |
| `/finance/transactions` | Scaffold |
| `/finance/reports` | Scaffold |
| `/reports` | Scaffold |
| `/settings` | Scaffold |

---

## What Is Working Right Now
- Workers can be **registered** (name, SA ID, village) and listed via Convex
- Bin weights can be **logged** with crop type, GPS coordinates, and timestamp
- Today's yield logs **stream live** from Convex to the UI
- Individual yield log entries can be **deleted**
- GPS location is captured via the browser Geolocation API and plotted on a Leaflet map
- The dashboard **stat cards** pull and aggregate today's log data in real time

---

## Next Step – Worker Registry Full CRUD UI

The Convex backend for workers is complete. The immediate next task is to build the **Worker Registry page** (`/workers`) with a full management UI:

1. **List view** – DataTable showing all registered workers (name, SA ID, village, entry count)
2. **Add Worker form** – modal/drawer with validation (name required, SA ID format check)
3. **Edit Worker** – inline or modal editing of existing records
4. **Delete Worker** – confirmation dialog before removal
5. **Link workers to Yield Logger** – populate the worker dropdown from the live `workers` table instead of a hard-coded list

Once the Worker Registry UI is complete the next priority is the **Farm Management** module (Fields → Crops → Seasons).

---

*Last updated: 2026-02-23*
