import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("fields").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    hectares: v.number(),
    location: v.string(),
    soilType: v.optional(v.string()),
    irrigationType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("fields", { ...args, isActive: true });
  },
});

export const update = mutation({
  args: {
    id: v.id("fields"),
    name: v.optional(v.string()),
    hectares: v.optional(v.number()),
    location: v.optional(v.string()),
    soilType: v.optional(v.string()),
    irrigationType: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, ...patch }) => {
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("fields") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { isActive: false });
  },
});
