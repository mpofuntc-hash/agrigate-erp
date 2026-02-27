import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

// Register all @convex-dev/auth HTTP routes:
// GET  /api/auth/signin/{provider}   — initiates OAuth redirect
// GET  /api/auth/callback/{provider} — handles provider callback
// POST /api/auth/signout             — clears session
auth.addHttpRoutes(http);

// ── CCTV Camera Alert Webhook (Titan tier only) ───────────────────────────────
http.route({
  path:   "/api/camera-alert",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const secret = req.headers.get("x-camera-secret");
    if (secret !== process.env.CAMERA_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }

    let body: { farmCode?: string; type?: string; notes?: string };
    try {
      body = await req.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    if (!body.farmCode) {
      return new Response("Missing farmCode", { status: 400 });
    }

    const farm = await ctx.runQuery(api.farms.getFarmByCode, {
      code: body.farmCode,
    });
    if (!farm) return new Response("Farm not found", { status: 404 });
    if (farm.tier !== "titan")
      return new Response("Tier restriction — Titan required", { status: 403 });

    await ctx.runMutation(internal.activities.logWeatherAlert, {
      farmId: farm._id,
      type:   body.type ?? "camera_alert",
      notes:  body.notes ?? "CCTV motion detected",
    });

    return new Response("OK", { status: 200 });
  }),
});

export default http;
