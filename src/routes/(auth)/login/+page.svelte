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

<!-- Subtle orchard corner photo -->
<div class="corner-photo" aria-hidden="true"></div>

<div class="page">
  <div class="card">

    <div class="brand">
      <p class="brand-sup">ZZ2 Farm Operations</p>
      <h1 class="brand-name">AgriGate ERP</h1>
      <p class="brand-sub">Authorised access only</p>
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

    <p class="footer-note">v1.0.4-PRO · AgriGate ERP Platform</p>
  </div>
</div>

<style>
  :global(*), :global(*::before), :global(*::after) { box-sizing: border-box; margin: 0; padding: 0; }
  :global(body) {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    background: #1a1f1c;
  }

  /* Subtle orchard corner photo */
  .corner-photo {
    position: fixed; bottom: 0; right: 0;
    width: 55vw; height: 65vh;
    background-image: url('/waqar-mujahid-NU_s4KI_zME-unsplash.jpg');
    background-size: cover; background-position: center;
    opacity: 0.10; pointer-events: none; z-index: 0;
    mask-image: linear-gradient(to top left, rgba(0,0,0,0.8) 0%, transparent 60%);
    -webkit-mask-image: linear-gradient(to top left, rgba(0,0,0,0.8) 0%, transparent 60%);
  }

  /* Page */
  .page {
    position: relative; z-index: 1;
    min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    padding: 1.5rem;
  }

  /* Card */
  .card {
    width: 100%; max-width: 380px;
    background: #1e2421;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 6px;
    padding: 2.5rem 2rem;
    box-shadow: 0 8px 40px rgba(0,0,0,0.5);
  }

  /* Branding */
  .brand { margin-bottom: 2rem; }
  .brand-sup  { font-size: 0.58rem; font-weight: 700; color: #5c9470; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 0.35rem; }
  .brand-name { font-size: 1.6rem; font-weight: 800; color: #dce8dd; letter-spacing: -0.02em; }
  .brand-sub  { font-size: 0.72rem; color: #445447; margin-top: 0.25rem; }

  /* Form */
  form { display: flex; flex-direction: column; gap: 1rem; }
  label {
    display: flex; flex-direction: column; gap: 0.35rem;
    font-size: 0.62rem; font-weight: 700;
    color: #445447; text-transform: uppercase; letter-spacing: 0.1em;
  }
  input {
    padding: 0.6rem 0.85rem;
    background: #1a1f1c; border: 1px solid rgba(255,255,255,0.1);
    border-radius: 3px;
    color: #dce8dd; font-family: 'Inter', sans-serif; font-size: 0.88rem;
    transition: border-color 0.12s;
  }
  input::placeholder { color: #2d3d30; }
  input:focus {
    outline: none; border-color: #4a7c59;
    box-shadow: 0 0 0 2px rgba(74,124,89,0.15);
  }

  /* Submit button — Muted Olive, 2px border */
  button[type="submit"] {
    margin-top: 0.4rem; padding: 0.65rem;
    background: #2a3d30; color: #bfd4bf;
    border: 2px solid #4a7c59; border-radius: 3px;
    font-family: 'Inter', sans-serif; font-size: 0.82rem; font-weight: 600;
    cursor: pointer; letter-spacing: 0.04em;
    transition: background 0.12s, border-color 0.12s;
  }
  button[type="submit"]:hover:not(:disabled) {
    background: #334a38; border-color: #5c9470; color: #d5e8d5;
  }
  button[type="submit"]:disabled { opacity: 0.38; cursor: not-allowed; }

  .footer-note { margin-top: 1.75rem; text-align: center; font-size: 0.62rem; color: #2d3d30; }
</style>
