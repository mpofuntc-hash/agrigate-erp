import { query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";

// ── RBAC Helper ───────────────────────────────────────────────────────────────

/**
 * Verifies the caller is an authenticated employer.
 * Returns the profile on success, null on failure (caller should return null — not throw).
 */
async function requireEmployer(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_convex_auth_id", (q) => q.eq("convexAuthId", identity.subject))
    .first();

  if (!profile || profile.role !== "manager") return null;
  return profile;
}

// ── Employer-Only Queries ─────────────────────────────────────────────────────

/**
 * Aggregated tonnage data per worker and crop type.
 * Employer-only — returns null for workers/foremen.
 */
export const getTonnageData = query({
  args: {},
  handler: async (ctx) => {
    if (!(await requireEmployer(ctx))) return null;

    const logs = await ctx.db.query("yieldLogs").order("desc").collect();

    // Aggregate by cropType
    const byType: Record<string, { totalKg: number; binCount: number }> = {};
    for (const log of logs) {
      if (!byType[log.cropType]) byType[log.cropType] = { totalKg: 0, binCount: 0 };
      byType[log.cropType].totalKg += log.binWeight;
      byType[log.cropType].binCount += 1;
    }

    // Aggregate by worker
    const byWorker: Record<string, { totalKg: number; binCount: number }> = {};
    for (const log of logs) {
      const key = log.workerId;
      if (!byWorker[key]) byWorker[key] = { totalKg: 0, binCount: 0 };
      byWorker[key].totalKg += log.binWeight;
      byWorker[key].binCount += 1;
    }

    return {
      totalKg: logs.reduce((s, l) => s + l.binWeight, 0),
      totalBins: logs.length,
      byCropType: byType,
      byWorker,
    };
  },
});

/**
 * Financial analytics overview.
 * Employer-only — returns null for workers/foremen.
 */
export const getFinancialAnalytics = query({
  args: {},
  handler: async (ctx) => {
    if (!(await requireEmployer(ctx))) return null;

    const transactions = await ctx.db.query("transactions").collect();

    let totalDebits = 0;
    let totalCredits = 0;

    // Simple income/expense split by source type
    const bySource: Record<string, number> = {};
    for (const tx of transactions) {
      totalDebits += tx.amount;
      totalCredits += tx.amount;
      const src = tx.sourceType ?? "manual";
      bySource[src] = (bySource[src] ?? 0) + tx.amount;
    }

    return {
      transactionCount: transactions.length,
      bySourceType: bySource,
      recentTransactions: transactions.slice(-10).reverse(),
    };
  },
});

/**
 * Suspicious clock events for employer review.
 * Returns all records where isSuspicious = true, ordered newest first.
 */
export const getSuspiciousClockEvents = query({
  args: {},
  handler: async (ctx) => {
    if (!(await requireEmployer(ctx))) return null;

    return ctx.db
      .query("clockEvents")
      .withIndex("by_suspicious", (q) => q.eq("isSuspicious", true))
      .order("desc")
      .collect();
  },
});
