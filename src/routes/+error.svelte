<script lang="ts">
  import { page } from "$app/state";
</script>

<svelte:head><title>Error — AgriGate</title></svelte:head>

<div class="error-page">
  <div class="error-card">
    <div class="error-code">{page.status}</div>
    <h1 class="error-title">
      {#if page.status === 404}
        Page not found
      {:else if page.status === 403}
        Access denied
      {:else if page.status === 500}
        Something went wrong
      {:else}
        Unexpected error
      {/if}
    </h1>
    <p class="error-msg">
      {page.error?.message ?? "An unexpected error occurred. Please try again."}
    </p>
    <div class="error-actions">
      <a href="/dashboard" class="btn-primary">Go to Dashboard</a>
      <a href="/login"     class="btn-ghost">Sign in again</a>
    </div>
    <p class="error-brand">AgriGate · Farm Operations Platform</p>
  </div>
</div>

<style>
  .error-page {
    min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    padding: 1.5rem;
    background: linear-gradient(135deg, #022c22 0%, #064e3b 50%, #065f46 100%);
    font-family: 'Inter', system-ui, sans-serif;
  }

  .error-card {
    width: 100%; max-width: 420px;
    background: rgba(255,255,255,0.97);
    border-radius: 16px; padding: 2.75rem 2.25rem;
    text-align: center;
    box-shadow: 0 24px 80px rgba(0,0,0,0.3);
    display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
  }

  .error-code {
    font-size: 4rem; font-weight: 900; color: #d1fae5;
    line-height: 1; letter-spacing: -0.04em;
    background: #064e3b; border-radius: 12px;
    padding: 0.5rem 1.25rem; margin-bottom: 0.25rem;
  }

  .error-title {
    font-size: 1.3rem; font-weight: 800; color: #064e3b;
    margin: 0; letter-spacing: -0.02em;
  }

  .error-msg {
    font-size: 0.82rem; color: #6b7280;
    line-height: 1.6; max-width: 320px; margin: 0;
  }

  .error-actions {
    display: flex; flex-direction: column; gap: 0.6rem;
    width: 100%; margin-top: 0.5rem;
  }

  .btn-primary {
    display: block; width: 100%; padding: 0.72rem;
    background: #065f46; color: #fff;
    border-radius: 8px; font-weight: 700; font-size: 0.88rem;
    text-decoration: none; text-align: center;
    transition: background 0.12s;
  }
  .btn-primary:hover { background: #047857; }

  .btn-ghost {
    display: block; width: 100%; padding: 0.72rem;
    background: transparent; color: #6b7280;
    border: 1.5px solid #e5e7eb; border-radius: 8px;
    font-weight: 600; font-size: 0.88rem;
    text-decoration: none; text-align: center;
    transition: border-color 0.12s, color 0.12s;
  }
  .btn-ghost:hover { border-color: #065f46; color: #065f46; }

  .error-brand {
    font-size: 0.62rem; color: #d1d5db;
    margin: 0.5rem 0 0; letter-spacing: 0.05em;
  }
</style>
