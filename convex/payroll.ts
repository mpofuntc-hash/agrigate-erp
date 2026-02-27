import { v, ConvexError } from "convex/values";
import { query, action } from "./_generated/server";
import { api } from "./_generated/api";

const DEFAULT_RATES: Record<string, number> = {
  crop:      0.85, // R per kg
  livestock: 12,   // R per head
};

export const getMonthlyPayroll = query({
  args: { month: v.string() }, // e.g. "2026-02"
  handler: async (ctx, { month }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const farm = await ctx.db
      .query("farms")
      .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
      .first();
    if (!farm) return null;

    const startDate = new Date(`${month}-01`);
    const start = startDate.getTime();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    const end = endDate.getTime();

    const logs = await ctx.db
      .query("activities")
      .withIndex("by_farm", (q) => q.eq("farmId", farm._id))
      .filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), start),
          q.lt(q.field("timestamp"),  end),
          q.or(
            q.eq(q.field("category"), "crop"),
            q.eq(q.field("category"), "livestock")
          )
        )
      )
      .collect();

    // Aggregate by workerId
    const totals: Record<
      string,
      { value: number; earnings: number; category: string }
    > = {};

    for (const log of logs) {
      if (!log.workerId || !log.value) continue;
      const rate = DEFAULT_RATES[log.category] ?? 0;
      if (!totals[log.workerId]) {
        totals[log.workerId] = { value: 0, earnings: 0, category: log.category };
      }
      totals[log.workerId].value    += log.value;
      totals[log.workerId].earnings += log.value * rate;
    }

    return totals;
  },
});

export const sendPayrollWhatsApp = action({
  args: { month: v.string() },
  handler: async (ctx, { month }) => {
    const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL;
    if (!webhookUrl) throw new ConvexError("WHATSAPP_WEBHOOK_URL not configured");

    const payroll = await ctx.runQuery(api.payroll.getMonthlyPayroll, { month });
    if (!payroll) throw new ConvexError("No payroll data");

    const res = await fetch(webhookUrl, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ month, payroll }),
    });

    if (!res.ok) {
      throw new ConvexError(`WhatsApp webhook returned ${res.status}`);
    }
  },
});
