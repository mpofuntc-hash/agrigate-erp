import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const listCustomers = query({
  args: {},
  handler: async (ctx) => ctx.db.query("customers").collect(),
});

export const listSalesOrders = query({
  args: {},
  handler: async (ctx) => ctx.db.query("salesOrders").collect(),
});

export const createCustomer = mutation({
  args: {
    name: v.string(),
    contactPerson: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    customerType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("customers", { ...args, isActive: true });
  },
});

export const createSalesOrder = mutation({
  args: {
    soNumber: v.string(),
    customerId: v.id("customers"),
    orderDate: v.string(),
    deliveryDate: v.optional(v.string()),
    totalAmount: v.number(),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("salesOrders", { ...args, status: "draft" });
  },
});

export const updateSOStatus = mutation({
  args: {
    id: v.id("salesOrders"),
    status: v.union(
      v.literal("draft"),
      v.literal("confirmed"),
      v.literal("packed"),
      v.literal("dispatched"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, { id, status }) => {
    await ctx.db.patch(id, { status });
  },
});
