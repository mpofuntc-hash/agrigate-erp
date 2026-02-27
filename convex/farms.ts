import { v, ConvexError } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0/I/1
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

export const createFarm = mutation({
  args: {
    name:      v.string(),
    province:  v.optional(v.string()),
    cropTypes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const inviteCode = generateInviteCode();
    const farmId = await ctx.db.insert("farms", {
      name:      args.name,
      ownerId:   identity.subject,
      inviteCode,
      tier:      "basic",
      isHiring:  false,
      province:  args.province,
      cropTypes: args.cropTypes,
    });

    // Attach manager to farm and mark as vetted
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_convex_auth_id", (q) =>
        q.eq("convexAuthId", identity.subject)
      )
      .first();
    if (profile) {
      await ctx.db.patch(profile._id, { farmId, isVetted: true });
    }

    return { farmId, inviteCode };
  },
});

export const getFarm = query({
  args: { farmId: v.id("farms") },
  handler: async (ctx, { farmId }) => ctx.db.get(farmId),
});

export const getFarmByCode = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) =>
    ctx.db
      .query("farms")
      .withIndex("by_invite_code", (q) =>
        q.eq("inviteCode", code.toUpperCase())
      )
      .first(),
});

export const updateFarm = mutation({
  args: {
    farmId:    v.id("farms"),
    name:      v.optional(v.string()),
    isHiring:  v.optional(v.boolean()),
    province:  v.optional(v.string()),
    cropTypes: v.optional(v.array(v.string())),
    lat:       v.optional(v.number()),
    lng:       v.optional(v.number()),
    tier:      v.optional(v.union(v.literal("basic"), v.literal("standard"), v.literal("titan"))),
  },
  handler: async (ctx, { farmId, ...patch }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");
    const farm = await ctx.db.get(farmId);
    if (!farm) throw new ConvexError("Farm not found");
    if (farm.ownerId !== identity.subject) throw new ConvexError("Forbidden");
    await ctx.db.patch(farmId, patch);
  },
});

export const getAllFarms = query({
  args: {},
  handler: async (ctx) =>
    ctx.db
      .query("farms")
      .filter((q) => q.eq(q.field("isHiring"), true))
      .collect(),
});

export const getMyFarm = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_convex_auth_id", (q) =>
        q.eq("convexAuthId", identity.subject)
      )
      .first();
    if (!profile?.farmId) return null;
    return ctx.db.get(profile.farmId);
  },
});

// Internal — used by cron weather check
export const getAllFarmsInternal = internalQuery({
  args: {},
  handler: async (ctx) => ctx.db.query("farms").collect(),
});
