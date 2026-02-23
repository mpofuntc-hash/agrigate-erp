// Re-export generated Convex types after running `npx convex dev`
// import type { Doc, Id } from "../../convex/_generated/dataModel";

export type UserRole = "admin" | "manager" | "staff";

export type SalaryType = "monthly" | "daily" | "piecework";

export type AccountType = "asset" | "liability" | "equity" | "income" | "expense";

export type StockMovementType = "in" | "out" | "adjustment";

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  children?: NavItem[];
}
