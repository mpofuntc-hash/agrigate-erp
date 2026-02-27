import { query } from "./_generated/server";

/**
 * Single aggregated query for the dashboard — manager view.
 * All data scoped to the caller's farm.
 */
export const getDashboardStats = query({
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

    const farm = await ctx.db.get(profile.farmId);
    if (!farm) return null;

    // ── Workers ──────────────────────────────────────────────────────────────
    const allOnFarm = await ctx.db
      .query("userProfiles")
      .withIndex("by_farm", (q) => q.eq("farmId", profile.farmId))
      .collect();
    const vettedWorkers = allOnFarm.filter((p) => p.isVetted && p.role === "worker");

    // ── Pending applications ─────────────────────────────────────────────────
    const pendingApps = await ctx.db
      .query("applications")
      .withIndex("by_farm_status", (q) =>
        q.eq("farmId", profile.farmId!).eq("status", "pending")
      )
      .collect();

    // ── Activities this month ────────────────────────────────────────────────
    const now      = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const monthActivities = await ctx.db
      .query("activities")
      .withIndex("by_farm", (q) => q.eq("farmId", profile.farmId!))
      .filter((q) => q.gte(q.field("timestamp"), monthStart))
      .collect();

    const todayActivities = monthActivities.filter((a) => a.timestamp >= todayStart);

    // ── Fuel balance ─────────────────────────────────────────────────────────
    const fuelLogs = monthActivities.filter((a) => a.category === "fuel");
    const fuelBalance = fuelLogs.reduce((sum, log) => {
      if (log.type === "fill") return sum + (log.value ?? 0);
      if (log.type === "use")  return sum - (log.value ?? 0);
      return sum;
    }, 0);

    // ── Monthly harvest (crop + livestock value) ─────────────────────────────
    const RATES: Record<string, number> = { crop: 0.85, livestock: 12 };
    let monthEarnings = 0;
    let monthKg       = 0;
    for (const a of monthActivities) {
      if ((a.category === "crop" || a.category === "livestock") && a.value) {
        monthKg       += a.value;
        monthEarnings += a.value * (RATES[a.category] ?? 0);
      }
    }

    return {
      farmName:        farm.name,
      farmTier:        farm.tier,
      workerCount:     vettedWorkers.length,
      pendingCount:    pendingApps.length,
      todayActivities: todayActivities.length,
      fuelBalance:     Math.round(fuelBalance * 10) / 10,
      monthKg:         Math.round(monthKg),
      monthEarnings:   Math.round(monthEarnings),
      role:            profile.role,
    };
  },
});
