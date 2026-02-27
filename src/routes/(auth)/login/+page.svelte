<script lang="ts">
  import { convex, api } from "$lib/convex/client";

  let loading = $state<string | null>(null);
  let error   = $state<string | null>(null);

  async function signInWith(provider: string) {
    error   = null;
    loading = provider;
    try {
      const verifier = Array.from(crypto.getRandomValues(new Uint8Array(48)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      sessionStorage.setItem("convexAuthVerifier", verifier);

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
  <!-- Animated background layers -->
  <div class="bg-layer bg-grad"></div>
  <div class="bg-layer bg-grain"></div>
  <div class="bg-layer bg-glow"></div>

  <!-- LEFT: Feature preview panel (hidden on mobile) -->
  <div class="preview-panel" aria-hidden="true">
    <div class="preview-inner">
      <div class="preview-badge">Live Platform Preview</div>
      <h2 class="preview-title">Your complete<br/>farm command centre</h2>
      <p class="preview-sub">Everything your operation needs — workers, harvests, fuel, payroll — in one place.</p>

      <!-- Mock stat cards -->
      <div class="mock-stats">
        <div class="mstat">
          <span class="mstat-val">24</span>
          <span class="mstat-lbl">Vetted Workers</span>
        </div>
        <div class="mstat">
          <span class="mstat-val">R 42 580</span>
          <span class="mstat-lbl">Month Earnings</span>
        </div>
        <div class="mstat">
          <span class="mstat-val">1 240 kg</span>
          <span class="mstat-lbl">Harvested</span>
        </div>
        <div class="mstat">
          <span class="mstat-val">87 L</span>
          <span class="mstat-lbl">Fuel Balance</span>
        </div>
      </div>

      <!-- Feature list -->
      <ul class="feature-list">
        <li>
          <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#4ade80" stroke-width="1.5"/><path d="M5 8l2 2 4-4" stroke="#4ade80" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          GPS-verified activity logging (offline-first)
        </li>
        <li>
          <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#4ade80" stroke-width="1.5"/><path d="M5 8l2 2 4-4" stroke="#4ade80" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Worker vetting, applications & payroll
        </li>
        <li>
          <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#4ade80" stroke-width="1.5"/><path d="M5 8l2 2 4-4" stroke="#4ade80" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Crop & livestock harvest tracking
        </li>
        <li>
          <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#4ade80" stroke-width="1.5"/><path d="M5 8l2 2 4-4" stroke="#4ade80" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Weather alerts & CCTV monitoring (Titan)
        </li>
      </ul>

      <!-- Mock activity feed -->
      <div class="mock-feed">
        <p class="mock-feed-title">Recent Activity</p>
        <div class="feed-item"><span class="feed-dot dot-green"></span><span class="feed-text">Harvest logged · 48 kg citrus · 14:32</span></div>
        <div class="feed-item"><span class="feed-dot dot-blue"></span><span class="feed-text">Worker clocked in · Gate 3 · 06:01</span></div>
        <div class="feed-item"><span class="feed-dot dot-amber"></span><span class="feed-text">Fuel fill · 60 L · 05:48</span></div>
      </div>
    </div>
  </div>

  <!-- RIGHT: Login card -->
  <div class="card">
    <div class="brand">
      <p class="brand-sup">AgriGate Platform</p>
      <h1 class="brand-name">AgriGate</h1>
      <p class="brand-sub">Multi-tenant farm management</p>
    </div>

    <p class="signin-label">Sign in to continue</p>

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
  /* ── Page shell ── */
  .page {
    min-height: 100vh;
    display: flex; align-items: stretch;
    position: relative; overflow: hidden;
    font-family: 'Inter', system-ui, sans-serif;
  }

  /* ── Animated background ── */
  .bg-layer { position: absolute; inset: 0; }

  .bg-grad {
    background: linear-gradient(
      140deg,
      #022c22 0%,
      #064e3b 30%,
      #065f46 55%,
      #047857 75%,
      #0d9488 100%
    );
    animation: gradShift 18s ease-in-out infinite alternate;
  }
  @keyframes gradShift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  /* Film-grain texture overlay */
  .bg-grain {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    opacity: 0.35;
    mix-blend-mode: overlay;
  }

  /* Soft radial glow in bottom-right */
  .bg-glow {
    background: radial-gradient(ellipse 70% 60% at 80% 90%, rgba(52, 211, 153, 0.18) 0%, transparent 70%);
    animation: glowPulse 6s ease-in-out infinite alternate;
  }
  @keyframes glowPulse {
    from { opacity: 0.6; }
    to   { opacity: 1; }
  }

  /* ── Preview panel (left) ── */
  .preview-panel {
    flex: 1;
    display: flex; align-items: center; justify-content: flex-end;
    padding: 3rem 3.5rem 3rem 3rem;
    position: relative; z-index: 1;
  }

  .preview-inner {
    max-width: 420px;
    color: #fff;
  }

  .preview-badge {
    display: inline-block;
    padding: 0.3rem 0.8rem;
    background: rgba(52, 211, 153, 0.18);
    border: 1px solid rgba(52, 211, 153, 0.35);
    border-radius: 100px;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #6ee7b7;
    margin-bottom: 1.25rem;
  }

  .preview-title {
    font-size: 2rem;
    font-weight: 800;
    line-height: 1.18;
    letter-spacing: -0.03em;
    margin: 0 0 0.75rem;
    color: #fff;
  }

  .preview-sub {
    font-size: 0.85rem;
    color: rgba(255,255,255,0.65);
    line-height: 1.6;
    margin: 0 0 2rem;
  }

  /* Mock stat cards */
  .mock-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    margin-bottom: 1.75rem;
  }

  .mstat {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    backdrop-filter: blur(12px);
    border-radius: 10px;
    padding: 0.9rem 1rem;
  }

  .mstat-val {
    display: block;
    font-size: 1.35rem;
    font-weight: 800;
    color: #fff;
    letter-spacing: -0.02em;
    line-height: 1;
    margin-bottom: 0.3rem;
  }

  .mstat-lbl {
    font-size: 0.62rem;
    font-weight: 600;
    color: rgba(255,255,255,0.5);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  /* Feature checklist */
  .feature-list {
    list-style: none; margin: 0 0 1.75rem; padding: 0;
    display: flex; flex-direction: column; gap: 0.55rem;
  }

  .feature-list li {
    display: flex; align-items: center; gap: 0.6rem;
    font-size: 0.82rem;
    color: rgba(255,255,255,0.8);
  }

  .feature-list svg {
    width: 16px; height: 16px; flex-shrink: 0;
  }

  /* Mock activity feed */
  .mock-feed {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 0.9rem 1rem;
  }

  .mock-feed-title {
    font-size: 0.6rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: rgba(255,255,255,0.4);
    margin: 0 0 0.6rem;
  }

  .feed-item {
    display: flex; align-items: center; gap: 0.55rem;
    padding: 0.3rem 0;
  }

  .feed-dot {
    width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
  }
  .dot-green { background: #4ade80; }
  .dot-blue  { background: #60a5fa; }
  .dot-amber { background: #fbbf24; }

  .feed-text {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.65);
  }

  /* ── Login card (right) ── */
  .card {
    position: relative; z-index: 1;
    width: 420px; flex-shrink: 0;
    display: flex; flex-direction: column; justify-content: center;
    background: rgba(255, 255, 255, 0.97);
    padding: 3rem 2.5rem;
    box-shadow: -24px 0 80px rgba(0,0,0,0.25);
  }

  .brand { margin-bottom: 1.75rem; }
  .brand-sup  { font-size: 0.58rem; font-weight: 700; color: #9ca3af; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 0.4rem; }
  .brand-name { font-size: 2rem; font-weight: 800; color: #064e3b; letter-spacing: -0.03em; }
  .brand-sub  { font-size: 0.78rem; color: #9ca3af; margin-top: 0.25rem; }

  .signin-label {
    font-size: 0.78rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 1rem;
  }

  .providers { display: flex; flex-direction: column; gap: 0.75rem; }

  .provider-btn {
    display: flex; align-items: center; justify-content: center; gap: 0.6rem;
    width: 100%; padding: 0.78rem 1rem;
    background: #fff; color: #111827; font-weight: 600; font-size: 0.88rem;
    border: 1.5px solid #e5e7eb; border-radius: 8px; cursor: pointer;
    transition: border-color 0.12s, box-shadow 0.12s;
    font-family: inherit;
  }
  .provider-btn:hover:not(:disabled) {
    border-color: #065f46;
    box-shadow: 0 0 0 3px rgba(6, 95, 70, 0.1);
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
    margin-top: 1rem; padding: 0.65rem 0.9rem;
    background: #fef2f2; color: #991b1b;
    border: 1px solid #fecaca; border-radius: 6px;
    font-size: 0.8rem; text-align: center;
  }

  .footer {
    margin-top: 1.75rem; text-align: center;
    font-size: 0.62rem; color: #9ca3af; line-height: 1.6;
  }

  /* ── Mobile: stack everything, hide preview ── */
  @media (max-width: 860px) {
    .page { align-items: center; justify-content: center; padding: 1.5rem; }
    .preview-panel { display: none; }
    .card {
      width: 100%; max-width: 400px;
      border-radius: 16px;
      box-shadow: 0 24px 80px rgba(0,0,0,0.3);
      padding: 2.5rem 2rem;
    }
  }
</style>
