<script lang="ts">
  let email = $state("");
  let password = $state("");
  let loading = $state(false);

  async function handleLogin(e: Event) {
    e.preventDefault();
    loading = true;
    // TODO: implement Convex auth
    loading = false;
  }
</script>

<svelte:head><title>Login – ZZ2 ERP</title></svelte:head>

<div class="login-wrap">
  <div class="login-card">
    <div class="logo-area">
      <h1>ZZ2 ERP</h1>
      <p>AgriGate Platform</p>
    </div>
    <form onsubmit={handleLogin}>
      <label>
        Email
        <input type="email" bind:value={email} required autocomplete="email" />
      </label>
      <label>
        Password
        <input type="password" bind:value={password} required autocomplete="current-password" />
      </label>
      <button type="submit" disabled={loading}>
        {loading ? "Signing in…" : "Sign In"}
      </button>
    </form>
  </div>
</div>

<style>
  .login-wrap {
    min-height: 100vh; display: flex; align-items: center;
    justify-content: center; background: #f1f8e9;
  }
  .login-card {
    background: #fff; border-radius: 12px; padding: 2.5rem 2rem;
    width: 100%; max-width: 380px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.1);
  }
  .logo-area { text-align: center; margin-bottom: 1.75rem; }
  .logo-area h1 { margin: 0; font-size: 2rem; color: #1b5e20; }
  .logo-area p { margin: 0.25rem 0 0; color: #555; font-size: 0.9rem; }
  form { display: flex; flex-direction: column; gap: 1rem; }
  label { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.85rem; color: #444; font-weight: 600; }
  input {
    padding: 0.55rem 0.75rem; border: 1px solid #ccc;
    border-radius: 6px; font-size: 0.95rem;
    transition: border-color 0.15s;
  }
  input:focus { outline: none; border-color: #2e7d32; }
  button[type="submit"] {
    margin-top: 0.5rem; padding: 0.7rem;
    background: #2e7d32; color: #fff; border: none;
    border-radius: 8px; font-size: 1rem; font-weight: 600;
    cursor: pointer; transition: background 0.15s;
  }
  button[type="submit"]:hover:not(:disabled) { background: #1b5e20; }
  button[type="submit"]:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
