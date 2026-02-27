import type { LayoutServerLoad } from "./$types";

/**
 * All redirect logic is handled by hooks.server.ts (5-step sovereign guard).
 * This layout load just exposes cookie values to pages for UI use.
 */
export const load: LayoutServerLoad = async ({ cookies }) => {
  return {
    token:   cookies.get("agrigate_token")   ?? null,
    farmId:  cookies.get("agrigate_farm_id") ?? null,
    tier:    cookies.get("agrigate_tier")    ?? "basic",
    isVetted: cookies.get("agrigate_vetted") === "1",
  };
};
