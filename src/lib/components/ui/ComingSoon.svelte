<script lang="ts">
  let {
    title,
    icon       = "🚧",
    description,
    features   = [],
  }: {
    title: string;
    icon?: string;
    description: string;
    features?: string[];
  } = $props();
</script>

<div class="cs-wrap">
  <div class="cs-card">
    <span class="cs-icon">{icon}</span>
    <span class="cs-badge">Coming Soon</span>
    <h2 class="cs-title">{title}</h2>
    <p class="cs-desc">{description}</p>
    {#if features.length}
      <ul class="cs-list">
        {#each features as f}
          <li>{f}</li>
        {/each}
      </ul>
    {/if}
  </div>
</div>

<style>
  .cs-wrap {
    display: flex; align-items: center; justify-content: center;
    min-height: 60vh; padding: 2rem;
  }
  .cs-card {
    max-width: 420px; width: 100%; text-align: center;
    background: rgba(255,255,255,0.8);
    backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(255,255,255,0.6);
    border-radius: 16px; padding: 2.5rem 2rem;
    box-shadow: 0 8px 32px rgba(0,0,0,0.07);
    display: flex; flex-direction: column; align-items: center; gap: 0.6rem;
  }
  .cs-icon { font-size: 2.5rem; line-height: 1; margin-bottom: 0.25rem; }
  .cs-badge {
    display: inline-block; padding: 0.25rem 0.75rem;
    background: #f0fdf4; border: 1px solid #bbf7d0;
    color: #065f46; font-size: 0.65rem; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase; border-radius: 999px;
  }
  .cs-title {
    font-size: 1.25rem; font-weight: 800; color: #064e3b;
    margin: 0.25rem 0 0; letter-spacing: -0.01em;
  }
  .cs-desc {
    font-size: 0.82rem; color: #6b7280; line-height: 1.6;
    margin: 0; max-width: 340px;
  }
  .cs-list {
    list-style: none; margin: 0.5rem 0 0; padding: 0;
    display: flex; flex-direction: column; gap: 0.35rem; text-align: left; width: 100%;
  }
  .cs-list li {
    font-size: 0.78rem; color: #374151;
    padding: 0.3rem 0.5rem 0.3rem 1.4rem; position: relative;
    background: #f9fafb; border-radius: 6px;
  }
  .cs-list li::before {
    content: "✦"; position: absolute; left: 0.5rem;
    color: #a7f3d0; font-size: 0.6rem; top: 50%; transform: translateY(-50%);
  }
</style>
