<svelte:head><title>Settings — AgriGate</title></svelte:head>

<div class="page-heading-row">
  <h2 class="page-heading">Settings</h2>
  <span class="page-badge">v2.0 MVP</span>
</div>

<div class="settings-list">
  {#each sections as section}
    <div class="settings-item">
      <span class="s-icon">{section.icon}</span>
      <div class="s-body">
        <strong>{section.label}</strong>
        <p>{section.description}</p>
      </div>
      <span class="cs-tag">Soon</span>
    </div>
  {/each}
</div>

<script lang="ts">
  const sections = [
    { icon: "🏡", label: "Farm Profile",       description: "Farm name, location, province & crop types" },
    { icon: "👥", label: "Users & Roles",       description: "Manage team members and access permissions" },
    { icon: "🏷️", label: "Departments",         description: "Organisational departments & cost centres" },
    { icon: "📦", label: "Product Categories",  description: "Inventory & product classification rules" },
    { icon: "🔗", label: "Integrations",        description: "WhatsApp payroll, CCTV webhooks & weather API" },
  ];
</script>

<style>
  .page-heading-row {
    display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem;
  }
  .page-heading { margin: 0; color: #064e3b; font-size: 1.25rem; font-weight: 800; }
  .page-badge {
    font-size: 0.62rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.1em; color: #9ca3af;
    background: #f3f4f6; border-radius: 999px; padding: 0.2rem 0.6rem;
  }

  .settings-list { display: flex; flex-direction: column; gap: 0.6rem; max-width: 560px; }

  .settings-item {
    background: rgba(255,255,255,0.8);
    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.6);
    border-radius: 10px; padding: 1rem 1.25rem;
    display: flex; align-items: center; gap: 1rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }

  .s-icon { font-size: 1.4rem; flex-shrink: 0; width: 2rem; text-align: center; }

  .s-body { flex: 1; }
  .s-body strong { color: #111827; font-size: 0.88rem; display: block; }
  .s-body p      { margin: 0.15rem 0 0; color: #6b7280; font-size: 0.76rem; line-height: 1.4; }

  .cs-tag {
    flex-shrink: 0; font-size: 0.6rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.08em;
    background: #f0fdf4; border: 1px solid #bbf7d0;
    color: #065f46; border-radius: 999px; padding: 0.2rem 0.55rem;
  }
</style>
