import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const listAccounts = query({
  args: {},
  handler: async (ctx) => ctx.db.query("accounts").collect(),
});

export const listTransactions = query({
  args: {},
  handler: async (ctx) => ctx.db.query("transactions").collect(),
});

export const createAccount = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("accounts", { ...args, isActive: true });
  },
});

export const createTransaction = mutation({
  args: {
    reference: v.string(),
    date: v.string(),
    description: v.string(),
    debitAccountId: v.id("accounts"),
    creditAccountId: v.id("accounts"),
    amount: v.number(),
    sourceType: v.optional(v.string()),
    sourceId: v.optional(v.string()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("transactions", args);
  },
});
