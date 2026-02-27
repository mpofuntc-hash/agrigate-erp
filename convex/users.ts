import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";

export const applyToFarm = mutation({
  args: {
    farmId:  v.id("farms"),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    // Prevent duplicate pending application
    const existing = await ctx.db
      .query("applications")
      .withIndex("by_worker", (q) => q.eq("workerId", identity.subject))
      .filter((q) =>
        q.and(
          q.eq(q.field("farmId"), args.farmId),
          q.eq(q.field("status"), "pending")
        )
      )
      .first();
    if (existing) throw new ConvexError("Application already pending");

    await ctx.db.insert("applications", {
      workerId:  identity.subject,
      farmId:    args.farmId,
      status:    "pending",
      appliedAt: Date.now(),
      message:   args.message,
    });
  },
});

export const joinFarmByCode = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const farm = await ctx.db
      .query("farms")
      .withIndex("by_invite_code", (q) =>
        q.eq("inviteCode", code.toUpperCase())
      )
      .first();
    if (!farm) throw new ConvexError("Invalid invite code");

    // Check for existing pending application
    const existing = await ctx.db
      .query("applications")
      .withIndex("by_worker", (q) => q.eq("workerId", identity.subject))
      .filter((q) =>
        q.and(
          q.eq(q.field("farmId"), farm._id),
          q.eq(q.field("status"), "pending")
        )
      )
      .first();
    if (existing) throw new ConvexError("Application already pending");

    await ctx.db.insert("applications", {
      workerId:  identity.subject,
      farmId:    farm._id,
      status:    "pending",
      appliedAt: Date.now(),
    });

    return farm._id;
  },
});

export const acceptWorker = mutation({
  args: { applicationId: v.id("applications") },
  handler: async (ctx, { applicationId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const app = await ctx.db.get(applicationId);
    if (!app) throw new ConvexError("Application not found");

    // Verify caller is farm manager
    const farm = await ctx.db.get(app.farmId);
    if (farm?.ownerId !== identity.subject) throw new ConvexError("Forbidden");

    await ctx.db.patch(applicationId, {
      status:     "accepted",
      reviewedAt: Date.now(),
      reviewedBy: identity.subject,
    });

    // Attach worker to farm + set vetted
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_convex_auth_id", (q) =>
        q.eq("convexAuthId", app.workerId)
      )
      .first();
    if (profile) {
      await ctx.db.patch(profile._id, { farmId: app.farmId, isVetted: true });
    }
  },
});

export const rejectWorker = mutation({
  args: { applicationId: v.id("applications") },
  handler: async (ctx, { applicationId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const app = await ctx.db.get(applicationId);
    if (!app) throw new ConvexError("Application not found");

    const farm = await ctx.db.get(app.farmId);
    if (farm?.ownerId !== identity.subject) throw new ConvexError("Forbidden");

    await ctx.db.patch(applicationId, {
      status:     "rejected",
      reviewedAt: Date.now(),
      reviewedBy: identity.subject,
    });
  },
});

export const getMarketplace = query({
  args: {},
  handler: async (ctx) =>
    ctx.db
      .query("farms")
      .filter((q) => q.eq(q.field("isHiring"), true))
      .collect(),
});

export const getPotentialHires = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const farm = await ctx.db
      .query("farms")
      .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
      .first();
    if (!farm) return [];

    return ctx.db
      .query("userProfiles")
      .filter((q) =>
        q.and(
          q.eq(q.field("isLookingForWork"), true),
          q.eq(q.field("farmId"), undefined)
        )
      )
      .collect();
  },
});

export const getPendingApplications = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const farm = await ctx.db
      .query("farms")
      .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
      .first();
    if (!farm) return [];

    return ctx.db
      .query("applications")
      .withIndex("by_farm_status", (q) =>
        q.eq("farmId", farm._id).eq("status", "pending")
      )
      .collect();
  },
});

export const getMyApplication = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return ctx.db
      .query("applications")
      .withIndex("by_worker", (q) => q.eq("workerId", identity.subject))
      .order("desc")
      .first();
  },
});
