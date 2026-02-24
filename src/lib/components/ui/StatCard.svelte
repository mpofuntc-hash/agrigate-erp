<script lang="ts">
  let {
    label,
    value,
    unit = "",
    color = "#065f46",
  }: { label: string; value: string | number; unit?: string; color?: string } = $props();
</script>

<div class="stat-card" style="--accent: {color}">
  <p class="stat-label">{label}</p>
  <p class="stat-value">{value}<span class="stat-unit">{unit}</span></p>
</div>

<style>
  .stat-card {
    background: rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    border-top: 3px solid var(--accent);
    border-left: 1px solid rgba(255, 255, 255, 0.6);
    border-right: 1px solid rgba(255, 255, 255, 0.6);
    border-bottom: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 8px;
    padding: 1.25rem 1.5rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.11);
  }
  .stat-label {
    font-size: 0.62rem;
    font-weight: 700;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin: 0 0 0.5rem;
  }
  .stat-value {
    font-family: 'Roboto Slab', serif;
    font-size: 1.9rem;
    font-weight: 800;
    color: #064e3b;
    margin: 0;
    line-height: 1;
    letter-spacing: -0.02em;
  }
  .stat-unit {
    font-family: 'Inter', sans-serif;
    font-size: 0.95rem;
    font-weight: 400;
    color: #6b7280;
    margin-left: 0.2rem;
  }
</style>
