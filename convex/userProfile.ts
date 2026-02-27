import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ── SA ID Luhn Validation ────────────────────────────────────────────────────

/**
 * Standard Luhn checksum for South African 13-digit ID numbers.
 * From rightmost digit, double every 2nd digit; subtract 9 if result > 9; sum must be divisible by 10.
 */
function luhnCheck(id: string): boolean {
  if (id.length !== 13 || !/^\d{13}$/.test(id)) return false;
  let sum = 0;
  for (let i = 0; i < 13; i++) {
    let d = parseInt(id[12 - i], 10); // iterate right-to-left
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

/**
 * Validate SA ID structure beyond checksum:
 * - YYMMDD birth date (positions 0-5)
 * - Gender digit (position 6): 0-4 female, 5-9 male
 * - Citizenship digit (position 10): 0 = SA citizen, 1 = permanent resident
 */
function validateSaIdStructure(id: string): { valid: boolean; reason?: string } {
  const month = parseInt(id.substring(2, 4), 10);
  const day   = parseInt(id.substring(4, 6), 10);
  if (month < 1 || month > 12) return { valid: false, reason: "Invalid birth month in SA ID" };
  if (day < 1   || day > 31)   return { valid: false, reason: "Invalid birth day in SA ID" };
  const citizenDigit = parseInt(id[10], 10);
  if (citizenDigit !== 0 && citizenDigit !== 1)
    return { valid: false, reason: "Invalid citizenship digit in SA ID" };
  return { valid: true };
}

// ── Mutations ────────────────────────────────────────────────────────────────

/**
 * First-login profile completion gate.
 * Enforces SA ID Luhn check, sets isProfileComplete = true.
 * Accepts role (manager | worker) for multi-tenancy.
 */
export const completeProfile = mutation({
  args: {
    fullName: v.string(),
    saId:     v.string(),
    phone:    v.string(),
    role:     v.union(v.literal("manager"), v.literal("worker")),
  },
  handler: async (ctx, { fullName, saId, phone, role }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Validate SA ID if 13 digits (passport numbers are allowed to skip Luhn)
    if (saId.length === 13) {
      if (!luhnCheck(saId)) throw new Error("Invalid SA ID — checksum failed");
      const structure = validateSaIdStructure(saId);
      if (!structure.valid) throw new Error(structure.reason ?? "Invalid SA ID structure");
    } else if (!/^[A-Z0-9]{6,20}$/i.test(saId)) {
      throw new Error("Invalid passport number format");
    }

    // Validate phone (basic E.164-ish check)
    if (!/^[+0-9\s\-()]{8,20}$/.test(phone)) throw new Error("Invalid phone number");
    if (fullName.trim().length < 2) throw new Error("Full name is required");

    const convexAuthId = identity.subject;

    const patch = {
      fullName:          fullName.trim(),
      saId,
      phone,
      role,
      isProfileComplete: true,
      isVetted:          false,
      isLookingForWork:  role === "worker",
      trustScore:        50,
    };

    // Check for existing profile
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_convex_auth_id", (q) => q.eq("convexAuthId", convexAuthId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }

    // Create new profile
    return await ctx.db.insert("userProfiles", {
      convexAuthId,
      email:        identity.email,
      provider:     (identity as any).provider ?? undefined,
      isAnonymized: false,
      isActive:     true,
      ...patch,
    });
  },
});

/**
 * POPIA soft-delete: wipes PII fields, keeps _id and work log references intact.
 * Only callable by the user themselves or a manager.
 */
export const anonymizeUser = mutation({
  args: { targetConvexAuthId: v.string() },
  handler: async (ctx, { targetConvexAuthId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Must be self OR manager
    const callerProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_convex_auth_id", (q) => q.eq("convexAuthId", identity.subject))
      .first();

    const isSelf    = identity.subject === targetConvexAuthId;
    const isManager = callerProfile?.role === "manager";

    if (!isSelf && !isManager) throw new Error("Not authorised to anonymize this user");

    const target = await ctx.db
      .query("userProfiles")
      .withIndex("by_convex_auth_id", (q) => q.eq("convexAuthId", targetConvexAuthId))
      .first();

    if (!target) throw new Error("User profile not found");
    if (target.isAnonymized) throw new Error("User is already anonymized");

    await ctx.db.patch(target._id, {
      fullName:     undefined,
      saId:         undefined,
      phone:        undefined,
      email:        undefined,
      isAnonymized: true,
      isActive:     false,
    });
  },
});

// ── Queries ──────────────────────────────────────────────────────────────────

/** Returns the caller's own profile. */
export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return ctx.db
      .query("userProfiles")
      .withIndex("by_convex_auth_id", (q) => q.eq("convexAuthId", identity.subject))
      .first();
  },
});
