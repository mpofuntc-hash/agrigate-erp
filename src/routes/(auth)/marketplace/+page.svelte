<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount, onDestroy } from "svelte";
  import { convex, api } from "$lib/convex/client";

  type Farm = {
    _id: string;
    name: string;
    province?: string;
    cropTypes?: string[];
    isHiring: boolean;
  };

  type Profile = {
    role?: string;
    fullName?: string;
    trustScore?: number;
  };

  let role          = $state<"manager" | "worker" | null>(null);
  let hiringFarms   = $state<Farm[]>([]);
  let potentialHires = $state<Profile[]>([]);
  let loading       = $state(true);

  let inviteCode  = $state("");
  let codeError   = $state<string | null>(null);
  let codeLoading = $state(false);
  let applyingTo  = $state<string | null>(null);
  let applyError  = $state<string | null>(null);

  // Unsubscribe callbacks
  let unsubFarms:  (() => void) | null = null;
  let unsubHires:  (() => void) | null = null;
  let unsubProfile:(() => void) | null = null;

  onMount(() => {
    const token = localStorage.getItem("convexAuthToken");
    if (!token) { goto("/login"); return; }
    convex.setAuth(async () => token);

    // Subscribe to my profile to get role
    unsubProfile = convex.onUpdate(api.userProfile.getMyProfile, {}, (profile) => {
      role    = (profile?.role as any) ?? "worker";
      loading = false;

      if (role === "worker") {
        unsubFarms = convex.onUpdate(api.users.getMarketplace, {}, (farms) => {
          hiringFarms = (farms ?? []) as Farm[];
        });
      } else {
        unsubHires = convex.onUpdate(api.users.getPotentialHires, {}, (hires) => {
          potentialHires = (hires ?? []) as Profile[];
        });
      }
    });
  });

  onDestroy(() => {
    unsubFarms?.();
    unsubHires?.();
    unsubProfile?.();
  });

  async function handleCodeSubmit(e: Event) {
    e.preventDefault();
    codeError   = null;
    codeLoading = true;
    try {
      await convex.mutation(api.users.joinFarmByCode, {
        code: inviteCode.trim().toUpperCase(),
      });
      goto("/pending-approval");
    } catch (err: any) {
      codeError = err?.message ?? "Invalid invite code";
    } finally {
      codeLoading = false;
    }
  }

  async function handleApply(farmId: string) {
    applyError  = null;
    applyingTo  = farmId;
    try {
      await convex.mutation(api.users.applyToFarm, { farmId: farmId as any });
      goto("/pending-approval");
    } catch (err: any) {
      applyError = err?.message ?? "Could not submit application";
      applyingTo = null;
    }
  }
</script>

<svelte:head>
  <title>{role === "manager" ? "Worker Marketplace" : "Find a Farm"} — AgriGate</title>
</svelte:head>

<div class="page">
  <header class="header">
    <div class="header-inner">
      <div>
        <p class="header-eyebrow">AgriGate</p>
        <h1 class="header-title">
          {role === "manager" ? "Worker Marketplace" : "Find a Farm"}
        </h1>
      </div>
    </div>
  </header>

  <main class="main">
    {#if loading}
      <div class="loading">Loading…</div>

    {:else if role === "manager"}
      <!-- Manager: create farm CTA + potential hires -->
      <div class="cta-card">
        <h2>Create Your Farm</h2>
        <p>Set up your farm profile and get a shareable invite code for your workers.</p>
        <a href="/farm-setup" class="cta-btn">Create Farm →</a>
      </div>

      {#if potentialHires.length > 0}
        <section>
          <h2 class="section-title">Workers Looking for Work</h2>
          <div class="grid">
            {#each potentialHires as worker}
              <div class="farm-card">
                <p class="farm-name">{worker.fullName ?? "Anonymous"}</p>
                <p class="farm-meta">Trust score: {worker.trustScore ?? "—"}/100</p>
              </div>
            {/each}
          </div>
        </section>
      {/if}

    {:else}
      <!-- Worker: invite code + farm list -->
      <div class="code-card">
        <h2>Have an Invite Code?</h2>
        <p>Enter the 6-character code your manager shared with you.</p>
        <form onsubmit={handleCodeSubmit} class="code-form">
          <input
            type="text"
            bind:value={inviteCode}
            required
            maxlength="6"
            placeholder="ABC123"
            class="code-input"
          />
          <button type="submit" class="code-btn" disabled={codeLoading}>
            {codeLoading ? "…" : "Join"}
          </button>
        </form>
        {#if codeError}
          <p class="inline-error">{codeError}</p>
        {/if}
      </div>

      <section>
        <h2 class="section-title">Farms Currently Hiring</h2>
        {#if hiringFarms.length === 0}
          <div class="empty-state">
            <p>No farms are hiring right now.</p>
            <p class="empty-hint">Try entering an invite code above.</p>
          </div>
        {:else}
          <div class="grid">
            {#each hiringFarms as farm}
              <div class="farm-card">
                <p class="farm-name">{farm.name}</p>
                {#if farm.province}
                  <p class="farm-meta">{farm.province}</p>
                {/if}
                {#if farm.cropTypes?.length}
                  <div class="tags">
                    {#each farm.cropTypes as crop}
                      <span class="tag">{crop}</span>
                    {/each}
                  </div>
                {/if}
                {#if applyError && applyingTo === farm._id}
                  <p class="inline-error">{applyError}</p>
                {/if}
                <button
                  class="apply-btn"
                  onclick={() => handleApply(farm._id)}
                  disabled={applyingTo === farm._id}
                >
                  {applyingTo === farm._id ? "Applying…" : "Apply"}
                </button>
              </div>
            {/each}
          </div>
        {/if}
      </section>
    {/if}
  </main>
</div>

<style>
  .page { min-height: 100vh; background: #f5f5f0; }

  .header {
    background: #fff;
    border-bottom: 1px solid #e5e7eb;
    padding: 1rem 1.5rem;
  }
  .header-inner { max-width: 900px; margin: 0 auto; }
  .header-eyebrow { font-size: 0.6rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.16em; }
  .header-title { font-size: 1.25rem; font-weight: 800; color: #064e3b; margin-top: 0.1rem; }

  .main { max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem; display: flex; flex-direction: column; gap: 2rem; }

  .loading { color: #9ca3af; font-size: 0.9rem; text-align: center; padding: 3rem 0; }

  .cta-card {
    background: #065f46; color: #fff; border-radius: 14px; padding: 1.75rem;
  }
  .cta-card h2 { font-size: 1.1rem; font-weight: 800; margin-bottom: 0.4rem; }
  .cta-card p  { font-size: 0.82rem; color: #a7f3d0; margin-bottom: 1rem; }
  .cta-btn {
    display: inline-block;
    background: #fff; color: #065f46; font-weight: 700; font-size: 0.85rem;
    border-radius: 8px; padding: 0.6rem 1.25rem; text-decoration: none;
    transition: background 0.1s;
  }
  .cta-btn:hover { background: #ecfdf5; }

  .section-title { font-size: 0.95rem; font-weight: 700; color: #111827; margin-bottom: 1rem; }

  .grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }

  .farm-card {
    background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.25rem;
    display: flex; flex-direction: column; gap: 0.4rem;
  }
  .farm-name { font-weight: 700; color: #111827; font-size: 0.92rem; }
  .farm-meta { font-size: 0.75rem; color: #9ca3af; }

  .tags { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.25rem; }
  .tag  { background: #f0fdf4; color: #065f46; font-size: 0.7rem; border-radius: 99px; padding: 0.2rem 0.6rem; }

  .apply-btn {
    margin-top: 0.5rem; padding: 0.5rem; width: 100%;
    background: #111827; color: #fff; border: none; border-radius: 7px;
    font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: background 0.12s;
  }
  .apply-btn:hover:not(:disabled) { background: #1f2937; }
  .apply-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .code-card {
    background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 1.5rem;
  }
  .code-card h2 { font-size: 1rem; font-weight: 800; color: #111827; margin-bottom: 0.3rem; }
  .code-card p  { font-size: 0.8rem; color: #6b7280; margin-bottom: 0.9rem; }

  .code-form { display: flex; gap: 0.5rem; }
  .code-input {
    flex: 1; padding: 0.6rem 0.9rem;
    border: 1.5px solid #d1d5db; border-radius: 7px;
    font-size: 1rem; font-family: monospace; text-transform: uppercase; letter-spacing: 0.2em;
    color: #111827;
  }
  .code-input:focus { outline: none; border-color: #065f46; box-shadow: 0 0 0 3px rgba(6,95,70,0.12); }
  .code-btn {
    padding: 0.6rem 1.25rem;
    background: #065f46; color: #fff; border: none; border-radius: 7px;
    font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: background 0.12s;
  }
  .code-btn:hover:not(:disabled) { background: #047857; }
  .code-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .inline-error { font-size: 0.75rem; color: #dc2626; margin-top: 0.4rem; }

  .empty-state {
    background: #fff; border: 1px solid #e5e7eb; border-radius: 12px;
    padding: 2.5rem; text-align: center; color: #6b7280; font-size: 0.85rem;
  }
  .empty-hint { font-size: 0.75rem; color: #9ca3af; margin-top: 0.3rem; }
</style>
