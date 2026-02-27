import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  // ── @convex-dev/auth internal tables (authAccounts, authSessions, authUsers, …) ─
  ...authTables,

  // ── Workers ──────────────────────────────────────────────────────────────────
  workers: defineTable({
    name: v.string(),
    saId: v.string(),
    village: v.string(),
  }),

  // ── Yield / Harvest logs ──────────────────────────────────────────────────────
  yieldLogs: defineTable({
    workerId:  v.id("workers"),
    binWeight: v.number(),            // kg
    cropType:  v.string(),
    timestamp: v.number(),            // Date.now()
    lat:       v.optional(v.number()), // GPS latitude
    lng:       v.optional(v.number()), // GPS longitude
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_worker",    ["workerId"]),

  // ── Auth / Users (legacy — kept for existing module foreign-key references) ───
  users: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("manager"), v.literal("staff")),
    department: v.optional(v.string()),
    isActive: v.boolean(),
  }).index("by_email", ["email"]),

  // ── User Profiles — OAuth + RBAC + POPIA ─────────────────────────────────────
  userProfiles: defineTable({
    // Linked to Convex Auth (identity.subject)
    convexAuthId:      v.string(),
    email:             v.optional(v.string()),
    provider:          v.optional(v.string()),    // "google" | "apple" | "microsoft"

    // POPIA-protected fields — wiped on anonymisation request
    fullName:          v.optional(v.string()),
    saId:              v.optional(v.string()),    // 13-digit SA ID or passport number
    phone:             v.optional(v.string()),
    isAnonymized:      v.boolean(),               // soft-delete / right-to-erasure flag
    isProfileComplete: v.boolean(),               // first-login gate

    // RBAC — multi-tenant roles
    role: v.union(
      v.literal("manager"),   // owns/manages a farm
      v.literal("worker")     // labourer, needs vetting
    ),
    isActive: v.boolean(),

    // Multi-tenancy
    farmId:           v.optional(v.id("farms")),
    isVetted:         v.optional(v.boolean()),          // manager approved this worker
    isLookingForWork: v.optional(v.boolean()),           // shows in getPotentialHires
    trustScore:       v.optional(v.number()),            // 0-100, computed from activity history
  })
    .index("by_convex_auth_id", ["convexAuthId"])
    .index("by_email",          ["email"])
    .index("by_farm",           ["farmId"]),

  // ── Farms (root tenant) ──────────────────────────────────────────────────────
  farms: defineTable({
    name:       v.string(),
    ownerId:    v.string(),          // convexAuthId of manager
    inviteCode: v.string(),          // 6-char uppercase alphanumeric (no O/0/I/1)
    tier:       v.union(v.literal("basic"), v.literal("standard"), v.literal("titan")),
    isHiring:   v.boolean(),         // shows up in worker marketplace
    lat:        v.optional(v.number()),
    lng:        v.optional(v.number()),
    province:   v.optional(v.string()),
    cropTypes:  v.optional(v.array(v.string())), // ["citrus", "stone fruit"]
  })
    .index("by_owner",       ["ownerId"])
    .index("by_invite_code", ["inviteCode"]),

  // ── Universal Activity Log ────────────────────────────────────────────────────
  activities: defineTable({
    farmId:    v.id("farms"),
    workerId:  v.optional(v.string()),  // convexAuthId — optional (system events)
    category:  v.union(
      v.literal("crop"),
      v.literal("livestock"),
      v.literal("fuel"),
      v.literal("security"),
      v.literal("weather")
    ),
    type:         v.string(),           // "harvest", "spray", "clock_in", "fuel_fill", etc.
    value:        v.optional(v.number()),
    unit:         v.optional(v.string()),
    lat:          v.optional(v.number()),
    lng:          v.optional(v.number()),
    accuracy:     v.optional(v.number()),
    isSuspicious: v.optional(v.boolean()),
    notes:        v.optional(v.string()),
    timestamp:    v.number(),           // Date.now()
    syncedAt:     v.optional(v.number()),
  })
    .index("by_farm",      ["farmId"])
    .index("by_worker",    ["workerId"])
    .index("by_timestamp", ["timestamp"]),

  // ── Worker Applications ───────────────────────────────────────────────────────
  applications: defineTable({
    workerId:   v.string(),            // convexAuthId
    farmId:     v.id("farms"),
    status:     v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected")),
    appliedAt:  v.number(),
    reviewedAt: v.optional(v.number()),
    reviewedBy: v.optional(v.string()), // convexAuthId of manager
    message:    v.optional(v.string()),
  })
    .index("by_worker",      ["workerId"])
    .index("by_farm",        ["farmId"])
    .index("by_farm_status", ["farmId", "status"]),

  // ── Clock Events — GPS anti-fraud / ghost worker prevention ──────────────────
  clockEvents: defineTable({
    workerId:         v.id("workers"),
    type:             v.union(v.literal("in"), v.literal("out")),
    timestamp:        v.number(),
    lat:              v.number(),
    lng:              v.number(),
    accuracy:         v.number(),                // metres — <5m triggers suspicion
    isSuspicious:     v.boolean(),               // mock location flag
    suspiciousReason: v.optional(v.string()),
    reviewedBy:       v.optional(v.string()),    // convexAuthId of employer who cleared it
  })
    .index("by_worker",     ["workerId"])
    .index("by_suspicious", ["isSuspicious"]),

  // ── Farm Management ──────────────────────────────────────────────────────────
  fields: defineTable({
    name: v.string(),
    hectares: v.number(),
    location: v.string(),
    soilType: v.optional(v.string()),
    irrigationType: v.optional(v.string()),
    isActive: v.boolean(),
  }),

  crops: defineTable({
    name: v.string(),
    variety: v.optional(v.string()),
    category: v.string(), // e.g. "vegetable", "fruit", "grain"
    growthDays: v.optional(v.number()),
  }),

  seasons: defineTable({
    name: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    fieldId: v.id("fields"),
    cropId: v.id("crops"),
    plannedYieldTons: v.optional(v.number()),
    actualYieldTons: v.optional(v.number()),
    status: v.union(
      v.literal("planned"),
      v.literal("active"),
      v.literal("harvested"),
      v.literal("closed")
    ),
    notes: v.optional(v.string()),
  })
    .index("by_field", ["fieldId"])
    .index("by_crop", ["cropId"]),

  // ── Inventory ────────────────────────────────────────────────────────────────
  warehouses: defineTable({
    name: v.string(),
    location: v.string(),
    capacityTons: v.optional(v.number()),
    isActive: v.boolean(),
  }),

  products: defineTable({
    sku: v.string(),
    name: v.string(),
    category: v.string(), // "produce", "input", "equipment", "packaging"
    unit: v.string(),     // "kg", "ton", "litre", "each"
    unitCost: v.optional(v.number()),
    reorderLevel: v.optional(v.number()),
    warehouseId: v.optional(v.id("warehouses")),
    isActive: v.boolean(),
  }).index("by_sku", ["sku"]),

  stockMovements: defineTable({
    productId: v.id("products"),
    warehouseId: v.id("warehouses"),
    type: v.union(v.literal("in"), v.literal("out"), v.literal("adjustment")),
    quantity: v.number(),
    referenceType: v.optional(v.string()), // "purchase_order", "sales_order", "manual"
    referenceId: v.optional(v.string()),
    date: v.string(),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
  })
    .index("by_product", ["productId"])
    .index("by_warehouse", ["warehouseId"]),

  // ── Procurement ──────────────────────────────────────────────────────────────
  suppliers: defineTable({
    name: v.string(),
    contactPerson: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    category: v.optional(v.string()),
    isActive: v.boolean(),
  }),

  purchaseOrders: defineTable({
    poNumber: v.string(),
    supplierId: v.id("suppliers"),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("partial"),
      v.literal("received"),
      v.literal("cancelled")
    ),
    orderDate: v.string(),
    expectedDate: v.optional(v.string()),
    totalAmount: v.number(),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
  })
    .index("by_supplier", ["supplierId"])
    .index("by_status", ["status"]),

  purchaseOrderLines: defineTable({
    purchaseOrderId: v.id("purchaseOrders"),
    productId: v.id("products"),
    quantity: v.number(),
    unitPrice: v.number(),
    receivedQty: v.optional(v.number()),
  }).index("by_order", ["purchaseOrderId"]),

  // ── Sales ────────────────────────────────────────────────────────────────────
  customers: defineTable({
    name: v.string(),
    contactPerson: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    customerType: v.optional(v.string()), // "retail", "wholesale", "export"
    isActive: v.boolean(),
  }),

  salesOrders: defineTable({
    soNumber: v.string(),
    customerId: v.id("customers"),
    status: v.union(
      v.literal("draft"),
      v.literal("confirmed"),
      v.literal("packed"),
      v.literal("dispatched"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    orderDate: v.string(),
    deliveryDate: v.optional(v.string()),
    totalAmount: v.number(),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
  })
    .index("by_customer", ["customerId"])
    .index("by_status", ["status"]),

  salesOrderLines: defineTable({
    salesOrderId: v.id("salesOrders"),
    productId: v.id("products"),
    quantity: v.number(),
    unitPrice: v.number(),
  }).index("by_order", ["salesOrderId"]),

  // ── HR ───────────────────────────────────────────────────────────────────────
  employees: defineTable({
    employeeNumber: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    idNumber: v.optional(v.string()),
    department: v.string(),
    jobTitle: v.string(),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    salaryType: v.union(v.literal("monthly"), v.literal("daily"), v.literal("piecework")),
    salaryAmount: v.number(),
    bankAccount: v.optional(v.string()),
    isActive: v.boolean(),
  }).index("by_employee_number", ["employeeNumber"]),

  payrollRuns: defineTable({
    period: v.string(), // "2025-01"
    status: v.union(v.literal("draft"), v.literal("approved"), v.literal("paid")),
    totalGross: v.number(),
    totalDeductions: v.number(),
    totalNet: v.number(),
    createdBy: v.id("users"),
    approvedBy: v.optional(v.id("users")),
  }),

  // ── Roster / Foreman ─────────────────────────────────────────────────────────
  rosterAssignments: defineTable({
    date:         v.string(),         // "2026-02-25"
    workerId:     v.id("workers"),
    orchardBlock: v.string(),         // "Block A-12, Sector 4"
    blockLat:     v.number(),         // GPS center latitude of block
    blockLng:     v.number(),         // GPS center longitude of block
    assignedBy:   v.string(),         // foreman name
  }).index("by_date", ["date"]),

  foremanOfDay: defineTable({
    date:        v.string(),          // "2026-02-25"
    foremanName: v.string(),
  }).index("by_date", ["date"]),

  // ── Finance ──────────────────────────────────────────────────────────────────
  accounts: defineTable({
    code: v.string(),
    name: v.string(),
    type: v.union(
      v.literal("asset"),
      v.literal("liability"),
      v.literal("equity"),
      v.literal("income"),
      v.literal("expense")
    ),
    parentCode: v.optional(v.string()),
    isActive: v.boolean(),
  }).index("by_code", ["code"]),

  transactions: defineTable({
    reference: v.string(),
    date: v.string(),
    description: v.string(),
    debitAccountId: v.id("accounts"),
    creditAccountId: v.id("accounts"),
    amount: v.number(),
    sourceType: v.optional(v.string()), // "purchase_order", "sales_order", "payroll", "manual"
    sourceId: v.optional(v.string()),
    createdBy: v.id("users"),
  })
    .index("by_date", ["date"])
    .index("by_debit", ["debitAccountId"])
    .index("by_credit", ["creditAccountId"]),
});
