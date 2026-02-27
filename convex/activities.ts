import { v, ConvexError } from "convex/values";
import { mutation, query, internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

export const logActivity = mutation({
  args: {
    category:  v.union(
      v.literal("crop"),
      v.literal("livestock"),
      v.literal("fuel"),
      v.literal("security"),
      v.literal("weather")
    ),
    type:      v.string(),
    value:     v.optional(v.number()),
    unit:      v.optional(v.string()),
    lat:       v.optional(v.number()),
    lng:       v.optional(v.number()),
    accuracy:  v.optional(v.number()),
    notes:     v.optional(v.string()),
    timestamp: v.optional(v.number()), // allow past timestamps from offline queue
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_convex_auth_id", (q) =>
        q.eq("convexAuthId", identity.subject)
      )
      .first();
    if (!profile?.farmId) throw new ConvexError("Not attached to a farm");

    const isSuspicious = args.accuracy !== undefined && args.accuracy < 5;
    const ts = args.timestamp ?? Date.now();

    await ctx.db.insert("activities", {
      farmId:       profile.farmId,
      workerId:     identity.subject,
      category:     args.category,
      type:         args.type,
      value:        args.value,
      unit:         args.unit,
      lat:          args.lat,
      lng:          args.lng,
      accuracy:     args.accuracy,
      notes:        args.notes,
      isSuspicious,
      timestamp:    ts,
      syncedAt:     args.timestamp ? Date.now() : undefined, // marks offline sync
    });
  },
});

export const getActivities = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 100 }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_convex_auth_id", (q) =>
        q.eq("convexAuthId", identity.subject)
      )
      .first();
    if (!profile?.farmId) return [];

    return ctx.db
      .query("activities")
      .withIndex("by_farm", (q) => q.eq("farmId", profile.farmId!))
      .order("desc")
      .take(limit);
  },
});

export const getFuelBalance = query({
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

    const fuelLogs = await ctx.db
      .query("activities")
      .withIndex("by_farm", (q) => q.eq("farmId", profile.farmId!))
      .filter((q) => q.eq(q.field("category"), "fuel"))
      .collect();

    return fuelLogs.reduce((sum, log) => {
      if (log.type === "fill") return sum + (log.value ?? 0);
      if (log.type === "use")  return sum - (log.value ?? 0);
      return sum;
    }, 0);
  },
});

// Internal — called by cron or CCTV webhook
export const logWeatherAlert = internalMutation({
  args: {
    farmId: v.id("farms"),
    type:   v.string(),
    notes:  v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("activities", {
      farmId:    args.farmId,
      category:  "weather",
      type:      args.type,
      notes:     args.notes,
      timestamp: Date.now(),
    });
  },
});

// Internal — called daily by cron at 05:00 UTC
export const checkWeather = internalAction({
  args: {},
  handler: async (ctx) => {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) return;

    const farms = await ctx.runQuery(internal.farms.getAllFarmsInternal, {});

    for (const farm of farms.filter((f) => f.lat && f.lng)) {
      try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${farm.lat}&lon=${farm.lng}&appid=${apiKey}`;
        const data = await (await fetch(url)).json();
        const tempC = (data.main?.temp ?? 273.15) - 273.15;
        const weatherId: number = data.weather?.[0]?.id ?? 800;

        const isFrost = tempC <= 2;
        const isStorm =
          (weatherId >= 200 && weatherId < 300) ||
          (weatherId >= 500 && weatherId < 600) ||
          weatherId >= 900;

        if (isFrost || isStorm) {
          await ctx.runMutation(internal.activities.logWeatherAlert, {
            farmId: farm._id,
            type:   isFrost ? "frost_warning" : "storm_warning",
            notes:  `Temp: ${tempC.toFixed(1)}°C, Condition: ${data.weather?.[0]?.description ?? "unknown"}`,
          });
        }
      } catch {
        // Continue to next farm on network error
      }
    }
  },
});
