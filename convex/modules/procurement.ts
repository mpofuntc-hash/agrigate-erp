import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const listSuppliers = query({
  args: {},
  handler: async (ctx) => ctx.db.query("suppliers").collect(),
});

export const listPurchaseOrders = query({
  args: {},
  handler: async (ctx) => ctx.db.query("purchaseOrders").collect(),
});

export const createSupplier = mutation({
  args: {
    name: v.string(),
    contactPerson: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("suppliers", { ...args, isActive: true });
  },
});

export const createPurchaseOrder = mutation({
  args: {
    poNumber: v.string(),
    supplierId: v.id("suppliers"),
    orderDate: v.string(),
    expectedDate: v.optional(v.string()),
    totalAmount: v.number(),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("purchaseOrders", { ...args, status: "draft" });
  },
});

export const updatePOStatus = mutation({
  args: {
    id: v.id("purchaseOrders"),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("partial"),
      v.literal("received"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, { id, status }) => {
    await ctx.db.patch(id, { status });
  },
});
