<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount, onDestroy } from "svelte";
  import { convex, api } from "$lib/convex/client";

  type Application = {
    status: "pending" | "accepted" | "rejected";
    farmId: string;
  };

  type Farm = {
    _id: string;
    name: string;
    tier?: string;
  };

  let application = $state<Application | null>(null);
  let farmName    = $state<string | null>(null);

  let unsubApp:  (() => void) | null = null;
  let unsubFarm: (() => void) | null = null;

  onMount(() => {
    const token = localStorage.getItem("convexAuthToken");
    if (!token) { goto("/login"); return; }
    convex.setAuth(async () => token);

    unsubApp = convex.onUpdate(api.users.getMyApplication, {}, (app) => {
      application = app as Application | null;

      if (app?.status === "accepted") {
        const maxAge = "max-age=31536000";
        document.cookie = `agrigate_vetted=1; path=/; ${maxAge}; SameSite=Lax`;
        document.cookie = `agrigate_farm_id=${app.farmId}; path=/; ${maxAge}; SameSite=Lax`;
        document.cookie = `agrigate_tier=basic; path=/; ${maxAge}; SameSite=Lax`;
        goto("/dashboard");
        return;
      }

      // Subscribe to the farm they applied to
      if (app?.farmId && !farmName) {
        unsubFarm?.();
        unsubFarm = convex.onUpdate(
          api.farms.getFarm,
          { farmId: app.farmId as any },
          (farm: Farm | null) => {
            farmName = farm?.name ?? null;
          }
        );
      }
    });
  });

  onDestroy(() => {
    unsubApp?.();
    unsubFarm?.();
  });
</script>

<svelte:head><title>Application Under Review — AgriGate</title></svelte:head>

<div class="page">
  <div class="card">
    <div class="icon">⏳</div>

    <h1>Application Under Review</h1>

    {#if farmName}
      <p class="msg">Your application to <strong>{farmName}</strong> is being reviewed by the farm manager.</p>
    {:else}
      <p class="msg">Your application is pending review by the farm manager.</p>
    {/if}

    <p class="hint">This page will automatically update when you're approved.</p>

    <div class="steps">
      <div class="step done">
        <span class="step-icon">✓</span>
        <span>Profile completed</span>
      </div>
      <div class="step done">
        <span class="step-icon">✓</span>
        <span>Application submitted</span>
      </div>
      <div class="step pending">
        <span class="step-icon">⏳</span>
        <span>Awaiting manager approval</span>
      </div>
    </div>

    <div class="footer">
      <p>Want to apply to a different farm?</p>
      <a href="/marketplace">Browse other farms →</a>
    </div>
  </div>
</div>

<style>
  .page {
    min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    padding: 1.5rem;
    background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0f9ff 100%);
  }

  .card {
    width: 100%; max-width: 420px;
    background: rgba(255,255,255,0.95);
    border-radius: 16px; padding: 2.5rem;
    box-shadow: 0 8px 48px rgba(0,0,0,0.1);
    text-align: center;
    display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
  }

  .icon { font-size: 3rem; animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }

  h1 { font-size: 1.4rem; font-weight: 800; color: #064e3b; margin: 0; }

  .msg  { font-size: 0.85rem; color: #374151; line-height: 1.5; }
  .hint { font-size: 0.72rem; color: #9ca3af; }

  .steps {
    width: 100%; background: #f9fafb; border-radius: 10px;
    padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: 0.6rem;
    margin-top: 0.5rem; text-align: left;
  }
  .step { display: flex; align-items: center; gap: 0.6rem; font-size: 0.82rem; color: #374151; }
  .step-icon { width: 1.25rem; text-align: center; font-size: 0.85rem; }
  .step.done .step-icon  { color: #16a34a; }
  .step.pending .step-icon { color: #d97706; }

  .footer {
    width: 100%; border-top: 1px solid #f3f4f6;
    padding-top: 1rem; margin-top: 0.5rem;
  }
  .footer p { font-size: 0.75rem; color: #9ca3af; margin-bottom: 0.3rem; }
  .footer a { font-size: 0.82rem; color: #065f46; font-weight: 700; text-decoration: none; }
  .footer a:hover { text-decoration: underline; }
</style>
