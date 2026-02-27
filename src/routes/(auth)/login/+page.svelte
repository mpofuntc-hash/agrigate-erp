<script lang="ts">
  import { convex, api } from "$lib/convex/client";

  let loading = $state<string | null>(null); // holds provider name while loading
  let error   = $state<string | null>(null);

  async function signInWith(provider: string) {
    error   = null;
    loading = provider;
    try {
      // Generate a random PKCE-style verifier and store it for the callback
      const verifier = Array.from(crypto.getRandomValues(new Uint8Array(48)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      sessionStorage.setItem("convexAuthVerifier", verifier);

      // Ask Convex Auth to initiate the OAuth flow — returns a redirect URL
      const result = await convex.action(api.auth.signIn, {
        provider,
        params: { redirectTo: window.location.origin + "/auth/callback" },
        verifier,
      }) as any;

      if (result?.redirect) {
        window.location.href = result.redirect;
      } else {
        throw new Error("No redirect URL returned by auth provider");
      }
    } catch (err: any) {
      error   = err?.message ?? "Sign-in failed — please try again";
      loading = null;
    }
  }
</script>

<svelte:head><title>Sign In — AgriGate</title></svelte:head>

<div class="page">
  <div class="vid-overlay"></div>

  <div class="card">
    <div class="brand">
      <p class="brand-sup">AgriGate Platform</p>
      <h1 class="brand-name">AgriGate</h1>
      <p class="brand-sub">Multi-tenant farm management</p>
    </div>

    <div class="providers">
      <button
        class="provider-btn"
        onclick={() => signInWith("google")}
        disabled={!!loading}
      >
        {#if loading === "google"}
          <span class="spinner"></span> Connecting…
        {:else}
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        {/if}
      </button>

      <button
        class="provider-btn"
        onclick={() => signInWith("microsoft-entra-id")}
        disabled={!!loading}
      >
        {#if loading === "microsoft-entra-id"}
          <span class="spinner"></span> Connecting…
        {:else}
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#F25022" d="M1 1h10v10H1z"/>
            <path fill="#7FBA00" d="M13 1h10v10H13z"/>
            <path fill="#00A4EF" d="M1 13h10v10H1z"/>
            <path fill="#FFB900" d="M13 13h10v10H13z"/>
          </svg>
          Continue with Microsoft
        {/if}
      </button>

      <button
        class="provider-btn"
        onclick={() => signInWith("apple")}
        disabled={!!loading}
      >
        {#if loading === "apple"}
          <span class="spinner"></span> Connecting…
        {:else}
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          Continue with Apple
        {/if}
      </button>
    </div>

    {#if error}
      <p class="error">{error}</p>
    {/if}

    <p class="footer">
      By signing in you agree to POPIA-compliant data processing.<br/>
      AgriGate · v2.0 MVP
    </p>
  </div>
</div>

<style>
  .page {
    min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    padding: 1.5rem; position: relative; overflow: hidden;
    background: linear-gradient(135deg, #064e3b 0%, #065f46 40%, #047857 100%);
  }

  .vid-overlay {
    position: absolute; inset: 0; z-index: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  }

  .card {
    position: relative; z-index: 1;
    width: 100%; max-width: 380px;
    background: rgba(255, 255, 255, 0.97);
    border-radius: 16px; padding: 2.75rem 2.25rem;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.3);
  }

  .brand { margin-bottom: 2rem; }
  .brand-sup  { font-size: 0.6rem; font-weight: 700; color: #9ca3af; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 0.4rem; }
  .brand-name { font-size: 1.75rem; font-weight: 800; color: #064e3b; letter-spacing: -0.02em; }
  .brand-sub  { font-size: 0.78rem; color: #9ca3af; margin-top: 0.2rem; }

  .providers { display: flex; flex-direction: column; gap: 0.75rem; }

  .provider-btn {
    display: flex; align-items: center; justify-content: center; gap: 0.6rem;
    width: 100%; padding: 0.72rem 1rem;
    background: #fff; color: #111827; font-weight: 600; font-size: 0.88rem;
    border: 1.5px solid #e5e7eb; border-radius: 8px; cursor: pointer;
    transition: border-color 0.12s, box-shadow 0.12s, background 0.12s;
    font-family: inherit;
  }
  .provider-btn:hover:not(:disabled) {
    border-color: #065f46; box-shadow: 0 0 0 3px rgba(6, 95, 70, 0.1);
  }
  .provider-btn:disabled { opacity: 0.55; cursor: not-allowed; }

  .icon { width: 18px; height: 18px; flex-shrink: 0; }

  .spinner {
    width: 16px; height: 16px; flex-shrink: 0;
    border: 2px solid #d1d5db; border-top-color: #065f46;
    border-radius: 50%; animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .error {
    margin-top: 1rem; padding: 0.6rem 0.9rem;
    background: #fef2f2; color: #991b1b;
    border: 1px solid #fecaca; border-radius: 6px;
    font-size: 0.8rem; text-align: center;
  }

  .footer {
    margin-top: 1.75rem; text-align: center;
    font-size: 0.65rem; color: #9ca3af; line-height: 1.6;
  }
</style>
