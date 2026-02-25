import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ── Foreman of the Day ────────────────────────────────────────────────────────

export const setForemanOfDay = mutation({
  args: { date: v.string(), foremanName: v.string() },
  handler: async (ctx, { date, foremanName }) => {
    const existing = await ctx.db
      .query("foremanOfDay")
      .withIndex("by_date", q => q.eq("date", date))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { foremanName });
    } else {
      await ctx.db.insert("foremanOfDay", { date, foremanName });
    }
  },
});

export const getForemanOfDay = query({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    return await ctx.db
      .query("foremanOfDay")
      .withIndex("by_date", q => q.eq("date", date))
      .first();
  },
});

// ── Roster Assignments ────────────────────────────────────────────────────────

export const assignWorker = mutation({
  args: {
    date:         v.string(),
    workerId:     v.id("workers"),
    orchardBlock: v.string(),
    blockLat:     v.number(),
    blockLng:     v.number(),
    assignedBy:   v.string(),
  },
  handler: async (ctx, args) => {
    // Remove any existing assignment for this worker on this date first
    const existing = await ctx.db
      .query("rosterAssignments")
      .withIndex("by_date", q => q.eq("date", args.date))
      .collect();
    const prev = existing.find(r => r.workerId === args.workerId);
    if (prev) await ctx.db.delete(prev._id);
    return await ctx.db.insert("rosterAssignments", args);
  },
});

export const listTodayRoster = query({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    return await ctx.db
      .query("rosterAssignments")
      .withIndex("by_date", q => q.eq("date", date))
      .collect();
  },
});

export const removeAssignment = mutation({
  args: { id: v.id("rosterAssignments") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
