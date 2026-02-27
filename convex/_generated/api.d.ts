/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as clockEvents from "../clockEvents.js";
import type * as http from "../http.js";
import type * as modules_fields from "../modules/fields.js";
import type * as modules_finance from "../modules/finance.js";
import type * as modules_hr from "../modules/hr.js";
import type * as modules_inventory from "../modules/inventory.js";
import type * as modules_procurement from "../modules/procurement.js";
import type * as modules_sales from "../modules/sales.js";
import type * as protectedAnalytics from "../protectedAnalytics.js";
import type * as roster from "../roster.js";
import type * as userProfile from "../userProfile.js";
import type * as workers from "../workers.js";
import type * as yieldLogs from "../yieldLogs.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  clockEvents: typeof clockEvents;
  http: typeof http;
  "modules/fields": typeof modules_fields;
  "modules/finance": typeof modules_finance;
  "modules/hr": typeof modules_hr;
  "modules/inventory": typeof modules_inventory;
  "modules/procurement": typeof modules_procurement;
  "modules/sales": typeof modules_sales;
  protectedAnalytics: typeof protectedAnalytics;
  roster: typeof roster;
  userProfile: typeof userProfile;
  workers: typeof workers;
  yieldLogs: typeof yieldLogs;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
