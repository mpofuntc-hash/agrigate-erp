import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Save a bin weight entry
export const logBin = mutation({
  args: {
    workerId:  v.id("workers"),
    binWeight: v.number(),
    cropType:  v.string(),
    timestamp: v.number(),
    lat:       v.optional(v.number()),
    lng:       v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("yieldLogs", args);
  },
});

// All logs from today (filtered by startOfDay timestamp passed from client)
export const listTodayLogs = query({
  args: { startOfDay: v.number() },
  handler: async (ctx, { startOfDay }) => {
    return await ctx.db
      .query("yieldLogs")
      .withIndex("by_timestamp", q => q.gte("timestamp", startOfDay))
      .order("desc")
      .collect();
  },
});

// Permanently delete a yield log entry
export const deleteYieldLog = mutation({
  args: { id: v.id("yieldLogs") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
