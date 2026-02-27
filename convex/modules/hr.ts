import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const listEmployees = query({
  args: {},
  handler: async (ctx) => ctx.db.query("employees").collect(),
});

export const listPayrollRuns = query({
  args: {},
  handler: async (ctx) => ctx.db.query("payrollRuns").collect(),
});

export const createEmployee = mutation({
  args: {
    employeeNumber: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    idNumber: v.optional(v.string()),
    department: v.string(),
    jobTitle: v.string(),
    startDate: v.string(),
    salaryType: v.union(v.literal("monthly"), v.literal("daily"), v.literal("piecework")),
    salaryAmount: v.number(),
    bankAccount: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("employees", { ...args, isActive: true });
  },
});

export const createPayrollRun = mutation({
  args: {
    period: v.string(),
    totalGross: v.number(),
    totalDeductions: v.number(),
    totalNet: v.number(),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("payrollRuns", { ...args, status: "draft" });
  },
});
