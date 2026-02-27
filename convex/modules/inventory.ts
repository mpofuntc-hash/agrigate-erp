import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const listProducts = query({
  args: {},
  handler: async (ctx) => ctx.db.query("products").collect(),
});

export const listWarehouses = query({
  args: {},
  handler: async (ctx) => ctx.db.query("warehouses").collect(),
});

export const createProduct = mutation({
  args: {
    sku: v.string(),
    name: v.string(),
    category: v.string(),
    unit: v.string(),
    unitCost: v.optional(v.number()),
    reorderLevel: v.optional(v.number()),
    warehouseId: v.optional(v.id("warehouses")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("products", { ...args, isActive: true });
  },
});

export const recordStockMovement = mutation({
  args: {
    productId: v.id("products"),
    warehouseId: v.id("warehouses"),
    type: v.union(v.literal("in"), v.literal("out"), v.literal("adjustment")),
    quantity: v.number(),
    referenceType: v.optional(v.string()),
    referenceId: v.optional(v.string()),
    date: v.string(),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("stockMovements", args);
  },
});
