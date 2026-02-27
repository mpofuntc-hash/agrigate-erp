<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { convex, api } from "$lib/convex/client";
  import { onMount } from "svelte";

  let status = $state<"loading" | "error">("loading");
  let errorMsg = $state("");

  onMount(async () => {
    const code     = page.url.searchParams.get("code");
    const verifier = sessionStorage.getItem("convexAuthVerifier") ?? undefined;
    sessionStorage.removeItem("convexAuthVerifier");

    if (!code) {
      status   = "error";
      errorMsg = "No authorisation code received. Please try signing in again.";
      return;
    }

    try {
      // Exchange the OAuth code + PKCE verifier for session tokens
      const result = await convex.action(api.auth.signIn, {
        params:   { code },
        verifier,
      }) as { tokens?: { token: string; refreshToken: string } };

      if (!result.tokens?.token) {
        throw new Error("No token returned from server");
      }

      const { token, refreshToken } = result.tokens;

      // Store token for Convex client auth on future page loads
      localStorage.setItem("convexAuthToken",        token);
      localStorage.setItem("convexAuthRefreshToken", refreshToken);

      // Authenticate the Convex client for this session
      convex.setAuth(async () => token);

      // Set auth cookie so hooks.server.ts allows access to protected routes
      document.cookie = `agrigate_token=${token}; path=/; max-age=3600; SameSite=Lax`;

      // Check if profile is complete (redirect to complete-profile if not)
      const profile = await convex.query(api.userProfile.getMyProfile, {});
      if (!profile || !profile.isProfileComplete) {
        goto("/complete-profile");
      } else {
        // Set profile-complete cookie and go to dashboard
        document.cookie = "agrigate_profile_complete=1; path=/; max-age=31536000; SameSite=Lax";
        goto("/dashboard");
      }
    } catch (err: any) {
      status   = "error";
      errorMsg = err?.message ?? "Authentication failed. Please try again.";
    }
  });
</script>

<svelte:head><title>Signing in… — AgriGate</title></svelte:head>

<div class="page">
  {#if status === "loading"}
    <div class="card">
      <div class="spinner"></div>
      <p>Completing sign-in…</p>
    </div>
  {:else}
    <div class="card error">
      <p class="err-title">Sign-in failed</p>
      <p class="err-msg">{errorMsg}</p>
      <a href="/login" class="retry-btn">Try again</a>
    </div>
  {/if}
</div>

<style>
  .page {
    min-height: 100vh; display: flex;
    align-items: center; justify-content: center;
    background: linear-gradient(135deg, #f0fdf4, #f0f9ff);
    font-family: 'Inter', system-ui, sans-serif;
  }
  .card {
    background: #fff; border-radius: 14px;
    padding: 2.5rem 2rem; text-align: center;
    box-shadow: 0 8px 40px rgba(0,0,0,0.09);
    display: flex; flex-direction: column; align-items: center; gap: 1rem;
    color: #374151; font-size: 0.92rem;
  }
  .spinner {
    width: 36px; height: 36px;
    border: 3px solid #d1fae5;
    border-top-color: #065f46;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .card.error { border-top: 3px solid #ef4444; }
  .err-title  { font-size: 1rem; font-weight: 700; color: #111827; }
  .err-msg    { font-size: 0.85rem; color: #6b7280; max-width: 300px; line-height: 1.5; }
  .retry-btn  {
    padding: 0.6rem 1.5rem; background: #065f46; color: #fff;
    border-radius: 6px; font-weight: 600; font-size: 0.88rem; text-decoration: none;
  }
  .retry-btn:hover { background: #047857; }
</style>
