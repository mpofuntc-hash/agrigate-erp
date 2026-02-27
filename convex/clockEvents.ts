import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ── Mock Location Detection Thresholds ───────────────────────────────────────
// Accuracy < 5m  → suspiciously precise (common mock location signature)
// Position age   > 30,000ms → stale/cached GPS fix
// Altitude       === 0 exactly (not null) → mock location default value
const ACCURACY_THRESHOLD_M = 5;
const POSITION_AGE_THRESHOLD_MS = 30_000;

function detectMockLocation(
  accuracy: number,
  positionAge: number,
  altitude: number | null
): { isSuspicious: boolean; reason?: string } {
  const reasons: string[] = [];

  if (accuracy < ACCURACY_THRESHOLD_M) {
    reasons.push(`GPS accuracy ${accuracy.toFixed(1)}m (<${ACCURACY_THRESHOLD_M}m) — possible mock location`);
  }
  if (positionAge > POSITION_AGE_THRESHOLD_MS) {
    reasons.push(`Position age ${positionAge}ms (>${POSITION_AGE_THRESHOLD_MS}ms) — possible cached/fake position`);
  }
  if (altitude === 0) {
    reasons.push("Altitude exactly 0 — possible mock location default");
  }

  return {
    isSuspicious: reasons.length > 0,
    reason: reasons.length > 0 ? reasons.join("; ") : undefined,
  };
}

// ── Mutations ────────────────────────────────────────────────────────────────

export const clockIn = mutation({
  args: {
    workerId: v.id("workers"),
    lat: v.number(),
    lng: v.number(),
    accuracy: v.number(),
    positionAge: v.number(),       // milliseconds since GPS fix was taken
    altitude: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const { isSuspicious, reason } = detectMockLocation(
      args.accuracy,
      args.positionAge,
      args.altitude ?? null
    );

    return await ctx.db.insert("clockEvents", {
      workerId: args.workerId,
      type: "in",
      timestamp: Date.now(),
      lat: args.lat,
      lng: args.lng,
      accuracy: args.accuracy,
      isSuspicious,
      suspiciousReason: reason,
    });
  },
});

export const clockOut = mutation({
  args: {
    workerId: v.id("workers"),
    lat: v.number(),
    lng: v.number(),
    accuracy: v.number(),
    positionAge: v.number(),
    altitude: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const { isSuspicious, reason } = detectMockLocation(
      args.accuracy,
      args.positionAge,
      args.altitude ?? null
    );

    return await ctx.db.insert("clockEvents", {
      workerId: args.workerId,
      type: "out",
      timestamp: Date.now(),
      lat: args.lat,
      lng: args.lng,
      accuracy: args.accuracy,
      isSuspicious,
      suspiciousReason: reason,
    });
  },
});

/** Employer clears a suspicious clock event after manual review. */
export const clearSuspiciousEvent = mutation({
  args: {
    eventId: v.id("clockEvents"),
    reviewNote: v.optional(v.string()),
  },
  handler: async (ctx, { eventId, reviewNote }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.patch(eventId, {
      isSuspicious: false,
      reviewedBy: identity.subject,
      suspiciousReason: reviewNote,
    });
  },
});

// ── Queries ──────────────────────────────────────────────────────────────────

export const listWorkerEvents = query({
  args: { workerId: v.id("workers") },
  handler: async (ctx, { workerId }) => {
    return ctx.db
      .query("clockEvents")
      .withIndex("by_worker", (q) => q.eq("workerId", workerId))
      .order("desc")
      .collect();
  },
});
