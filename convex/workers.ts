import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Save a new worker to the database
export const registerWorker = mutation({
  args: {
    name: v.string(),
    saId: v.string(),
    village: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("workers", args);
  },
});

// Return all workers, newest first
export const listWorkers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("workers").order("desc").collect();
  },
});

// Permanently delete a worker record
export const deleteWorker = mutation({
  args: { id: v.id("workers") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
