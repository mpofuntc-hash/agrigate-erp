<script lang="ts">
  let {
    label,
    value,
    unit = "",
    color = "#2e7d32",
  }: { label: string; value: string | number; unit?: string; color?: string } = $props();
</script>

<div class="stat-card" style="--accent: {color}">
  <p class="stat-label">{label}</p>
  <p class="stat-value">{value}<span class="stat-unit">{unit}</span></p>
</div>

<style>
  .stat-card {
    background: #fff;
    border-left: 4px solid var(--accent);
    border-radius: 8px;
    padding: 1.25rem 1.5rem;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  }
  .stat-label {
    font-size: 0.8rem;
    color: #666;
    margin: 0 0 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .stat-value {
    font-size: 1.8rem;
    font-weight: 700;
    color: #1a1a1a;
    margin: 0;
  }
  .stat-unit {
    font-size: 1rem;
    font-weight: 400;
    color: #666;
    margin-left: 0.25rem;
  }
</style>
