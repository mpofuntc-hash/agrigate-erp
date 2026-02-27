import { redirect, type Handle } from "@sveltejs/kit";

const PUBLIC_PATHS   = ["/login", "/about", "/api", "/auth/callback"];
const AUTH_PATHS     = ["/profile-setup", "/farm-setup", "/marketplace", "/pending-approval"];
const TITAN_PATHS    = ["/dashboard/cctv", "/dashboard/weather"];
const STANDARD_PATHS = ["/dashboard/fuel"];

export const handle: Handle = async ({ event, resolve }) => {
  const token           = event.cookies.get("agrigate_token")            ?? null;
  const profileComplete = event.cookies.get("agrigate_profile_complete");
  const farmId          = event.cookies.get("agrigate_farm_id");
  const isVetted        = event.cookies.get("agrigate_vetted");
  const tier            = event.cookies.get("agrigate_tier")             ?? "basic";

  event.locals.token = token;
  const { pathname } = event.url;

  // 1. Public paths — always allow
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return resolve(event);

  // 2. No auth → /login
  if (!token) throw redirect(303, `/login?redirectTo=${encodeURIComponent(pathname)}`);

  // 3. Auth flow paths (profile-setup, marketplace, etc.) — allow through if authed
  if (AUTH_PATHS.some((p) => pathname.startsWith(p))) return resolve(event);

  // 4. No profile → /profile-setup
  if (!profileComplete) throw redirect(303, "/profile-setup");

  // 5. No farm → /marketplace
  if (!farmId) throw redirect(303, "/marketplace");

  // 6. Not vetted (worker awaiting approval) → /pending-approval
  if (isVetted !== "1") throw redirect(303, "/pending-approval");

  // 7. Tier gates
  if (TITAN_PATHS.some((p) => pathname.startsWith(p)) && tier !== "titan")
    throw redirect(303, "/dashboard?upgrade=titan");
  if (STANDARD_PATHS.some((p) => pathname.startsWith(p)) && tier === "basic")
    throw redirect(303, "/dashboard?upgrade=standard");

  return resolve(event);
};
