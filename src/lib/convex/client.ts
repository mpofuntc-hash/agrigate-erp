import { ConvexClient } from "convex/browser";
import { PUBLIC_CONVEX_URL } from "$env/static/public";

export const convex = new ConvexClient(PUBLIC_CONVEX_URL);

// Re-export generated API for use in Svelte components
export { api } from "../../../convex/_generated/api";
