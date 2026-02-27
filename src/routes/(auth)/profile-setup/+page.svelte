<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { convex, api } from "$lib/convex/client";

  onMount(() => {
    const token = localStorage.getItem("convexAuthToken");
    if (token) convex.setAuth(async () => token);
    else goto("/login");
  });

  let fullName = $state("");
  let saId     = $state("");
  let phone    = $state("");
  let role     = $state<"manager" | "worker">("worker");
  let error    = $state<string | null>(null);
  let loading  = $state(false);

  // Client-side SA ID Luhn check (mirrors server validation)
  function luhnCheck(id: string): boolean {
    if (id.length !== 13 || !/^\d{13}$/.test(id)) return false;
    let sum = 0;
    for (let i = 0; i < 13; i++) {
      let d = parseInt(id[12 - i], 10);
      if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
      sum += d;
    }
    return sum % 10 === 0;
  }

  let saIdStatus = $derived.by((): "idle" | "valid" | "invalid" | "passport" | "typing" => {
    if (!saId) return "idle";
    if (saId.length === 13) return luhnCheck(saId) ? "valid" : "invalid";
    if (/^[A-Z0-9]{6,20}$/i.test(saId)) return "passport";
    return "typing";
  });

  async function handleSubmit(e: Event) {
    e.preventDefault();
    error = null;
    if (!fullName.trim()) { error = "Full name is required."; return; }
    if (!saId.trim())     { error = "SA ID or passport number is required."; return; }
    if (saId.length === 13 && !luhnCheck(saId)) { error = "SA ID checksum is invalid."; return; }
    if (!phone.trim())    { error = "Phone number is required."; return; }

    loading = true;
    try {
      await convex.mutation(api.userProfile.completeProfile, {
        fullName: fullName.trim(),
        saId:     saId.trim(),
        phone:    phone.trim(),
        role,
      });
      document.cookie = "agrigate_profile_complete=1; path=/; max-age=31536000; SameSite=Lax";
      goto("/marketplace");
    } catch (err: any) {
      error = err?.message ?? "Something went wrong. Please try again.";
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head><title>Profile Setup — AgriGate</title></svelte:head>

<div class="page">
  <div class="card">
    <div class="brand">
      <p class="brand-sup">AgriGate</p>
      <h1 class="brand-title">Complete Your Profile</h1>
      <p class="brand-sub">Required for employment verification and POPIA compliance.</p>
    </div>

    <form onsubmit={handleSubmit}>
      <!-- Role selector -->
      <div class="role-group">
        <span class="role-label">I am a…</span>
        <div class="role-options">
          <label class="role-card {role === 'worker' ? 'active' : ''}">
            <input type="radio" bind:group={role} value="worker" />
            <span class="role-icon">🌾</span>
            <span class="role-name">Farm Worker</span>
            <span class="role-desc">I harvest and work the land</span>
          </label>
          <label class="role-card {role === 'manager' ? 'active' : ''}">
            <input type="radio" bind:group={role} value="manager" />
            <span class="role-icon">🏡</span>
            <span class="role-name">Farm Manager</span>
            <span class="role-desc">I own or manage a farm</span>
          </label>
        </div>
      </div>

      <!-- Full Name -->
      <label>
        Full Name
        <input type="text" bind:value={fullName} required placeholder="e.g. Sipho Ndlovu" autocomplete="name" />
      </label>

      <!-- SA ID / Passport -->
      <label>
        SA ID Number or Passport
        <input
          type="text"
          bind:value={saId}
          required
          placeholder="13-digit SA ID or passport number"
          maxlength="20"
          class:input-valid={saIdStatus === "valid" || saIdStatus === "passport"}
          class:input-invalid={saIdStatus === "invalid"}
        />
      </label>
      {#if saIdStatus === "invalid"}
        <p class="field-hint error">✗ Invalid SA ID — checksum failed. Please re-check.</p>
      {:else if saIdStatus === "passport"}
        <p class="field-hint ok">Passport number accepted</p>
      {:else if saIdStatus === "valid"}
        <p class="field-hint ok">✓ Valid SA ID</p>
      {/if}

      <!-- Phone -->
      <label>
        Mobile Phone Number
        <input type="tel" bind:value={phone} required placeholder="+27 82 123 4567" autocomplete="tel" />
      </label>

      {#if error}
        <p class="error-msg">{error}</p>
      {/if}

      <button type="submit" disabled={loading || saIdStatus === "invalid"}>
        {loading ? "Saving…" : "Continue"}
      </button>
    </form>

    <p class="popia-note">
      Your data is processed under <strong>POPIA</strong>. You may request anonymisation at any time.
    </p>
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
    width: 100%; max-width: 480px;
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.8);
    border-radius: 16px;
    padding: 2.5rem 2.25rem;
    box-shadow: 0 8px 48px rgba(0,0,0,0.1);
  }

  .brand { margin-bottom: 2rem; }
  .brand-sup   { font-size: 0.6rem; font-weight: 700; color: #6b7280; letter-spacing: 0.16em; text-transform: uppercase; margin-bottom: 0.3rem; }
  .brand-title { font-size: 1.5rem; font-weight: 800; color: #064e3b; letter-spacing: -0.02em; margin-bottom: 0.5rem; }
  .brand-sub   { font-size: 0.78rem; color: #6b7280; line-height: 1.5; }

  form { display: flex; flex-direction: column; gap: 1rem; }

  label {
    display: flex; flex-direction: column; gap: 0.38rem;
    font-size: 0.62rem; font-weight: 700; color: #6b7280;
    text-transform: uppercase; letter-spacing: 0.1em;
  }

  input {
    padding: 0.65rem 0.9rem;
    background: rgba(255,255,255,0.95);
    border: 1.5px solid rgba(0,0,0,0.12);
    border-radius: 7px; color: #111827; font-size: 0.9rem;
    transition: border-color 0.12s, box-shadow 0.12s;
  }
  input::placeholder { color: #d1d5db; }
  input:focus { outline: none; border-color: #065f46; box-shadow: 0 0 0 3px rgba(6,95,70,0.12); }
  input.input-valid   { border-color: #16a34a; }
  input.input-invalid { border-color: #dc2626; }

  .role-group { display: flex; flex-direction: column; gap: 0.5rem; }
  .role-label { font-size: 0.62rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em; }
  .role-options { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
  .role-card {
    display: flex; flex-direction: column; align-items: center;
    border: 2px solid #e5e7eb; border-radius: 10px; padding: 1rem 0.75rem;
    cursor: pointer; transition: border-color 0.12s, background 0.12s; text-align: center;
  }
  .role-card input[type="radio"] { display: none; }
  .role-card.active { border-color: #065f46; background: #f0fdf4; }
  .role-icon { font-size: 1.5rem; margin-bottom: 0.3rem; }
  .role-name { font-size: 0.8rem; font-weight: 700; color: #111827; }
  .role-desc { font-size: 0.68rem; color: #6b7280; margin-top: 0.15rem; }

  .field-hint { font-size: 0.75rem; margin-top: -0.5rem; padding: 0.4rem 0.6rem; border-radius: 5px; }
  .field-hint.ok    { background: #f0fdf4; color: #166534; }
  .field-hint.error { background: #fef2f2; color: #991b1b; }

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

  .popia-note { margin-top: 1.25rem; text-align: center; font-size: 0.72rem; color: #9ca3af; line-height: 1.5; }
</style>
