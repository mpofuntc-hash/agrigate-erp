<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { convex, api } from "$lib/convex/client";

  const PROVINCES = [
    "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal",
    "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape",
  ];

  const CROP_OPTIONS = [
    "Citrus", "Stone Fruit", "Apples & Pears", "Grapes",
    "Vegetables", "Grain & Maize", "Livestock", "Dairy",
  ];

  onMount(() => {
    const token = localStorage.getItem("convexAuthToken");
    if (token) convex.setAuth(async () => token);
    else goto("/login");
  });

  let farmName   = $state("");
  let province   = $state("");
  let cropTypes  = $state<string[]>([]);
  let inviteCode = $state("");
  let error      = $state<string | null>(null);
  let loading    = $state(false);
  let done       = $state(false);

  function toggleCrop(crop: string) {
    cropTypes = cropTypes.includes(crop)
      ? cropTypes.filter((c) => c !== crop)
      : [...cropTypes, crop];
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    error   = null;
    loading = true;
    try {
      const result = await convex.mutation(api.farms.createFarm, {
        name:      farmName.trim(),
        province:  province || undefined,
        cropTypes: cropTypes.length ? cropTypes : undefined,
      });
      inviteCode = result.inviteCode;
      const maxAge = "max-age=31536000";
      document.cookie = `agrigate_farm_id=${result.farmId}; path=/; ${maxAge}; SameSite=Lax`;
      document.cookie = `agrigate_vetted=1; path=/; ${maxAge}; SameSite=Lax`;
      document.cookie = `agrigate_tier=basic; path=/; ${maxAge}; SameSite=Lax`;
      done = true;
    } catch (err: any) {
      error = err?.message ?? "Something went wrong. Please try again.";
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head><title>Create Your Farm — AgriGate</title></svelte:head>

<div class="page">
  <div class="card">
    {#if done}
      <div class="success">
        <div class="success-icon">🎉</div>
        <h1>Farm Created!</h1>
        <p>Share this invite code with your workers:</p>
        <div class="invite-code">{inviteCode}</div>
        <p class="invite-hint">Workers enter this code in the marketplace to apply to your farm.</p>
        <button onclick={() => goto("/dashboard")}>Go to Dashboard</button>
      </div>
    {:else}
      <div class="brand">
        <p class="brand-sup">AgriGate</p>
        <h1 class="brand-title">Create Your Farm</h1>
        <p class="brand-sub">Set up your farm profile and get a shareable invite code for your workers.</p>
      </div>

      <form onsubmit={handleSubmit}>
        <label>
          Farm Name
          <input
            type="text"
            bind:value={farmName}
            required
            minlength="2"
            placeholder="e.g. Nkosi Citrus Farm"
          />
        </label>

        <label>
          Province
          <select bind:value={province}>
            <option value="">Select province (optional)</option>
            {#each PROVINCES as p}
              <option value={p}>{p}</option>
            {/each}
          </select>
        </label>

        <div class="crop-group">
          <span class="crop-label">What do you farm? <span class="optional">(optional)</span></span>
          <div class="crop-tags">
            {#each CROP_OPTIONS as crop}
              <button
                type="button"
                onclick={() => toggleCrop(crop)}
                class="crop-tag {cropTypes.includes(crop) ? 'active' : ''}"
              >
                {crop}
              </button>
            {/each}
          </div>
        </div>

        {#if error}
          <p class="error-msg">{error}</p>
        {/if}

        <button type="submit" disabled={loading}>
          {loading ? "Creating…" : "Create Farm"}
        </button>
      </form>
    {/if}
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
    width: 100%; max-width: 500px;
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.8);
    border-radius: 16px; padding: 2.5rem 2.25rem;
    box-shadow: 0 8px 48px rgba(0,0,0,0.1);
  }

  .brand { margin-bottom: 2rem; }
  .brand-sup   { font-size: 0.6rem; font-weight: 700; color: #6b7280; letter-spacing: 0.16em; text-transform: uppercase; }
  .brand-title { font-size: 1.5rem; font-weight: 800; color: #064e3b; letter-spacing: -0.02em; margin-bottom: 0.5rem; }
  .brand-sub   { font-size: 0.78rem; color: #6b7280; line-height: 1.5; }

  form { display: flex; flex-direction: column; gap: 1rem; }

  label {
    display: flex; flex-direction: column; gap: 0.38rem;
    font-size: 0.62rem; font-weight: 700; color: #6b7280;
    text-transform: uppercase; letter-spacing: 0.1em;
  }

  input, select {
    padding: 0.65rem 0.9rem;
    background: rgba(255,255,255,0.95);
    border: 1.5px solid rgba(0,0,0,0.12);
    border-radius: 7px; color: #111827; font-size: 0.9rem;
    transition: border-color 0.12s, box-shadow 0.12s;
  }
  input::placeholder { color: #d1d5db; }
  input:focus, select:focus { outline: none; border-color: #065f46; box-shadow: 0 0 0 3px rgba(6,95,70,0.12); }

  .crop-group { display: flex; flex-direction: column; gap: 0.5rem; }
  .crop-label { font-size: 0.62rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em; }
  .optional   { font-weight: 400; text-transform: none; color: #9ca3af; }
  .crop-tags  { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .crop-tag {
    padding: 0.35rem 0.75rem; border-radius: 99px;
    border: 1.5px solid #d1d5db; background: #fff;
    font-size: 0.78rem; color: #374151; cursor: pointer;
    transition: all 0.12s;
  }
  .crop-tag.active { background: #065f46; border-color: #065f46; color: #fff; }
  .crop-tag:hover:not(.active) { border-color: #065f46; color: #065f46; }

  .error-msg {
    padding: 0.6rem 0.9rem; background: #fef2f2; color: #991b1b;
    border: 1px solid #fecaca; border-radius: 6px; font-size: 0.82rem;
  }

  button[type="submit"] {
    margin-top: 0.5rem; padding: 0.78rem; width: 100%;
    background: #065f46; color: #fff; border: none; border-radius: 7px;
    font-size: 0.88rem; font-weight: 700; cursor: pointer;
    transition: background 0.12s, transform 0.12s;
    box-shadow: 0 2px 12px rgba(6,95,70,0.3);
  }
  button[type="submit"]:hover:not(:disabled) { background: #047857; transform: translateY(-1px); }
  button[type="submit"]:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Success state */
  .success { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.75rem; }
  .success-icon { font-size: 3rem; }
  .success h1   { font-size: 1.5rem; font-weight: 800; color: #064e3b; }
  .success p    { font-size: 0.85rem; color: #6b7280; }

  .invite-code {
    font-size: 2rem; font-family: monospace; font-weight: 700; letter-spacing: 0.25em;
    color: #065f46; background: #f0fdf4; border: 2px solid #065f46;
    border-radius: 12px; padding: 0.75rem 1.5rem;
  }
  .invite-hint { font-size: 0.72rem; color: #9ca3af; }

  .success button {
    margin-top: 0.5rem; padding: 0.78rem 2rem;
    background: #065f46; color: #fff; border: none; border-radius: 7px;
    font-size: 0.88rem; font-weight: 700; cursor: pointer;
    transition: background 0.12s;
  }
  .success button:hover { background: #047857; }
</style>
