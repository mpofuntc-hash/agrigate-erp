<script lang="ts">
  let email    = $state("");
  let password = $state("");
  let loading  = $state(false);

  async function handleLogin(e: Event) {
    e.preventDefault();
    loading = true;
    // TODO: implement Convex auth
    loading = false;
  }
</script>

<svelte:head><title>Sign In — AgriGate ERP</title></svelte:head>

<div class="page">
  <!-- Cinematic farm video — desktop only -->
  <video class="vid-bg" autoplay muted loop playsinline>
    <source src="/Despo.mp4" type="video/mp4" />
  </video>
  <!-- Light frosted overlay keeps text perfectly readable -->
  <div class="vid-overlay"></div>

  <div class="card">
    <div class="brand">
      <p class="brand-sup">ZZ2 Farm Operations</p>
      <h1 class="brand-name">AgriGate ERP</h1>
      <p class="brand-sub">Authorised personnel only</p>
    </div>

    <form onsubmit={handleLogin}>
      <label>
        Email address
        <input type="email" bind:value={email} required autocomplete="email"
               placeholder="user@zz2.co.za" />
      </label>
      <label>
        Password
        <input type="password" bind:value={password} required
               autocomplete="current-password" placeholder="••••••••" />
      </label>
      <button type="submit" disabled={loading}>
        {loading ? "Authenticating…" : "Sign In"}
      </button>
    </form>

    <p class="footer">v1.0.4-PRO · AgriGate ERP Platform</p>
  </div>
</div>

<style>
  .page {
    min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    padding: 1.5rem;
    position: relative; overflow: hidden;
  }

  /* ── Video background (desktop only) ── */
  .vid-bg {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    object-fit: cover; z-index: 0;
    pointer-events: none;
  }

  /* Light frosted overlay — keeps contrast high */
  .vid-overlay {
    position: absolute; inset: 0; z-index: 1;
    background: rgba(227, 243, 253, 0.68);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
  }

  /* ── Frosted glass login card ── */
  .card {
    position: relative; z-index: 2;
    width: 100%; max-width: 390px;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.7);
    border-radius: 14px;
    padding: 2.75rem 2.25rem;
    box-shadow: 0 8px 48px rgba(0, 0, 0, 0.12), 0 2px 12px rgba(0, 0, 0, 0.06);
  }

  /* ── Branding ── */
  .brand { margin-bottom: 2rem; }
  .brand-sup  { font-size: 0.6rem; font-weight: 700; color: #6b7280; letter-spacing: 0.16em; text-transform: uppercase; margin-bottom: 0.3rem; }
  .brand-name { font-size: 1.75rem; font-weight: 800; color: #064e3b; letter-spacing: -0.02em; }
  .brand-sub  { font-size: 0.75rem; color: #9ca3af; margin-top: 0.25rem; }

  /* ── Form ── */
  form { display: flex; flex-direction: column; gap: 1.1rem; }
  label {
    display: flex; flex-direction: column; gap: 0.38rem;
    font-size: 0.62rem; font-weight: 700;
    color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em;
  }
  input {
    padding: 0.62rem 0.9rem;
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 6px;
    color: #111827; font-family: 'Inter', sans-serif; font-size: 0.9rem;
    transition: border-color 0.12s, box-shadow 0.12s;
  }
  input::placeholder { color: #d1d5db; }
  input:focus {
    outline: none; border-color: #065f46;
    box-shadow: 0 0 0 3px rgba(6, 95, 70, 0.12);
  }

  /* ── Dark emerald CTA button ── */
  button[type="submit"] {
    margin-top: 0.5rem; padding: 0.72rem; width: 100%;
    background: #065f46; color: #fff; border: none;
    border-radius: 6px;
    font-family: 'Inter', sans-serif; font-size: 0.88rem; font-weight: 700;
    cursor: pointer; letter-spacing: 0.02em;
    transition: background 0.12s, transform 0.12s, box-shadow 0.12s;
    box-shadow: 0 2px 12px rgba(6, 95, 70, 0.3);
  }
  button[type="submit"]:hover:not(:disabled) {
    background: #047857; transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(6, 95, 70, 0.35);
  }
  button[type="submit"]:disabled { opacity: 0.5; cursor: not-allowed; }

  .footer { margin-top: 1.75rem; text-align: center; font-size: 0.65rem; color: #d1d5db; }

  /* ── Mobile: hide video, use gradient ── */
  @media (max-width: 768px) {
    .vid-bg { display: none; }
    .vid-overlay {
      background: linear-gradient(to bottom, #E3F3FD, #F5F5DC);
      backdrop-filter: none; -webkit-backdrop-filter: none;
    }
  }
</style>
