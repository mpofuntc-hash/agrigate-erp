<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { convex, api } from "$lib/convex/client";

  // Re-initialise Convex auth from localStorage (handles page refreshes)
  onMount(() => {
    const token = localStorage.getItem("convexAuthToken");
    if (token) convex.setAuth(async () => token);
    else goto("/login");
  });

  // ── State ───────────────────────────────────────────────────────────────────
  let fullName = $state("");
  let saId     = $state("");
  let phone    = $state("");
  let loading  = $state(false);
  let error    = $state<string | null>(null);

  // ── SA ID Luhn Validation (client-side mirror of server logic) ───────────────
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

  // ── SA ID derived info (birth date + gender) ─────────────────────────────────
  let saIdInfo = $derived.by(() => {
    if (saId.length !== 13 || !/^\d{13}$/.test(saId)) return null;
    const yy  = saId.substring(0, 2);
    const mm  = saId.substring(2, 4);
    const dd  = saId.substring(4, 6);
    const genderDigit = parseInt(saId[6], 10);
    const year = parseInt(yy, 10) > 25 ? `19${yy}` : `20${yy}`;
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const monthIdx = parseInt(mm, 10) - 1;
    const monthName = monthIdx >= 0 && monthIdx < 12 ? monthNames[monthIdx] : null;
    const gender = genderDigit >= 5 ? "Male" : "Female";
    const valid = luhnCheck(saId);
    return { year, month: monthName, day: dd, gender, valid };
  });

  let saIdStatus = $derived.by((): "idle" | "valid" | "invalid" | "passport" | "typing" => {
    if (!saId) return "idle";
    if (saId.length === 13) return saIdInfo?.valid ? "valid" : "invalid";
    if (/^[A-Z0-9]{6,20}$/i.test(saId)) return "passport";
    return "typing";
  });

  // ── Submit ───────────────────────────────────────────────────────────────────
  async function handleSubmit(e: Event) {
    e.preventDefault();
    error = null;

    if (!fullName.trim()) { error = "Full name is required."; return; }
    if (!saId.trim())     { error = "SA ID or passport number is required."; return; }
    if (saId.length === 13 && !luhnCheck(saId)) { error = "SA ID checksum is invalid. Please re-check the number."; return; }
    if (!phone.trim())    { error = "Phone number is required."; return; }

    loading = true;
    try {
      await convex.mutation(api.userProfile.completeProfile, {
        fullName: fullName.trim(),
        saId:     saId.trim(),
        phone:    phone.trim(),
      });

      // Set profile-complete cookie (1 year) so layout.server.ts allows app access
      document.cookie = "agrigate_profile_complete=1; path=/; max-age=31536000; SameSite=Lax";

      goto("/dashboard");
    } catch (err: any) {
      error = err?.message ?? "Something went wrong. Please try again.";
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head><title>Complete Your Profile — AgriGate</title></svelte:head>

<div class="page">
  <div class="card">
    <div class="brand">
      <p class="brand-sup">AgriGate ERP</p>
      <h1 class="brand-title">Complete Your Profile</h1>
      <p class="brand-sub">Required for employment verification and POPIA compliance. Your information is encrypted and never shared without consent.</p>
    </div>

    <form onsubmit={handleSubmit}>
      <!-- Full Name -->
      <label>
        Full Name
        <input
          type="text"
          bind:value={fullName}
          required
          placeholder="e.g. Sipho Ndlovu"
          autocomplete="name"
        />
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
          inputmode="text"
          class:input-valid={saIdStatus === "valid" || saIdStatus === "passport"}
          class:input-invalid={saIdStatus === "invalid"}
        />
      </label>

      {#if saIdStatus === "valid" && saIdInfo}
        <div class="id-info valid">
          <span class="id-badge">✓ Valid SA ID</span>
          <span>Born: {saIdInfo.day} {saIdInfo.month} {saIdInfo.year}</span>
          <span>Gender: {saIdInfo.gender}</span>
        </div>
      {:else if saIdStatus === "invalid"}
        <div class="id-info invalid">
          <span>✗ Invalid SA ID — checksum failed. Please re-check the number.</span>
        </div>
      {:else if saIdStatus === "passport"}
        <div class="id-info passport">
          <span>Passport number accepted</span>
        </div>
      {/if}

      <!-- Phone -->
      <label>
        Mobile Phone Number
        <input
          type="tel"
          bind:value={phone}
          required
          placeholder="+27 82 123 4567"
          autocomplete="tel"
        />
      </label>

      {#if error}
        <p class="error-msg">{error}</p>
      {/if}

      <button type="submit" disabled={loading || saIdStatus === "invalid"}>
        {loading ? "Saving…" : "Complete Profile & Continue"}
      </button>
    </form>

    <p class="popia-note">
      Your data is processed under <strong>POPIA</strong>. You may request anonymisation at any time via the <a href="/about#right-to-erasure">About page</a>.
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
    width: 100%; max-width: 460px;
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.8);
    border-radius: 16px;
    padding: 2.5rem 2.25rem;
    box-shadow: 0 8px 48px rgba(0, 0, 0, 0.1);
  }

  .brand { margin-bottom: 2rem; }
  .brand-sup   { font-size: 0.6rem; font-weight: 700; color: #6b7280; letter-spacing: 0.16em; text-transform: uppercase; margin-bottom: 0.3rem; }
  .brand-title { font-size: 1.5rem; font-weight: 800; color: #064e3b; letter-spacing: -0.02em; margin-bottom: 0.5rem; }
  .brand-sub   { font-size: 0.78rem; color: #6b7280; line-height: 1.5; }

  form { display: flex; flex-direction: column; gap: 1rem; }

  label {
    display: flex; flex-direction: column; gap: 0.38rem;
    font-size: 0.62rem; font-weight: 700;
    color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em;
  }

  input {
    padding: 0.65rem 0.9rem;
    background: rgba(255, 255, 255, 0.95);
    border: 1.5px solid rgba(0, 0, 0, 0.12);
    border-radius: 7px;
    color: #111827; font-family: 'Inter', sans-serif; font-size: 0.9rem;
    transition: border-color 0.12s, box-shadow 0.12s;
  }
  input::placeholder { color: #d1d5db; }
  input:focus { outline: none; border-color: #065f46; box-shadow: 0 0 0 3px rgba(6, 95, 70, 0.12); }
  input.input-valid   { border-color: #16a34a; }
  input.input-invalid { border-color: #dc2626; }

  .id-info {
    display: flex; flex-wrap: wrap; gap: 0.5rem;
    font-size: 0.75rem; padding: 0.5rem 0.75rem;
    border-radius: 6px; margin-top: -0.5rem;
  }
  .id-info.valid   { background: #f0fdf4; color: #166534; }
  .id-info.invalid { background: #fef2f2; color: #991b1b; }
  .id-info.passport { background: #eff6ff; color: #1e40af; }
  .id-badge { font-weight: 700; }

  .error-msg {
    padding: 0.6rem 0.9rem;
    background: #fef2f2; color: #991b1b;
    border: 1px solid #fecaca; border-radius: 6px;
    font-size: 0.82rem;
  }

  button[type="submit"] {
    margin-top: 0.5rem; padding: 0.78rem; width: 100%;
    background: #065f46; color: #fff; border: none;
    border-radius: 7px;
    font-family: 'Inter', sans-serif; font-size: 0.88rem; font-weight: 700;
    cursor: pointer; letter-spacing: 0.02em;
    transition: background 0.12s, transform 0.12s;
    box-shadow: 0 2px 12px rgba(6, 95, 70, 0.3);
  }
  button[type="submit"]:hover:not(:disabled) { background: #047857; transform: translateY(-1px); }
  button[type="submit"]:disabled { opacity: 0.5; cursor: not-allowed; }

  .popia-note {
    margin-top: 1.25rem; text-align: center;
    font-size: 0.72rem; color: #9ca3af; line-height: 1.5;
  }
  .popia-note a { color: #065f46; }
</style>
