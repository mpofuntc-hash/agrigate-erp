<script lang="ts">
  let {
    title    = "AgriGate ERP",
    tier     = "basic",
    userName = null,
    userRole = null,
  }: {
    title?:    string;
    tier?:     string;
    userName?: string | null;
    userRole?: string | null;
  } = $props();

  const tierLabel: Record<string, string> = {
    standard: "Standard",
    titan:    "Titan",
  };

  const tierColor: Record<string, string> = {
    standard: "#2563eb",
    titan:    "#7c3aed",
  };

  // Show first name, or fall back to role label
  const displayName = $derived(
    userName
      ? userName.split(" ")[0]
      : userRole === "manager" ? "Manager" : userRole === "worker" ? "Worker" : "…"
  );
</script>

<header class="topbar">
  <h1 class="page-title">{title}</h1>
  <div class="topbar-right">
    <div class="status-pill">
      <span class="glow-dot"></span>
      Live
    </div>
    {#if tier && tier !== "basic"}
      <span class="tier-chip" style="background:{tierColor[tier] ?? '#6b7280'}">
        {tierLabel[tier] ?? tier}
      </span>
    {/if}
    <span class="user-chip">{displayName}</span>
  </div>
</header>

<style>
  .topbar {
    height: 52px;
    background: rgba(255, 255, 255, 0.82);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(0, 0, 0, 0.07);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 1.5rem;
    position: sticky; top: 0; z-index: 10;
    box-shadow: 0 1px 8px rgba(0, 0, 0, 0.04);
  }
  .page-title {
    font-size: 0.95rem; font-weight: 700; color: #064e3b; margin: 0;
  }
  .topbar-right { display: flex; align-items: center; gap: 0.6rem; }

  .status-pill {
    display: flex; align-items: center; gap: 0.38rem;
    font-size: 0.68rem; font-weight: 600; color: #065f46;
    background: rgba(6, 95, 70, 0.08);
    border: 1px solid rgba(6, 95, 70, 0.2);
    padding: 0.2rem 0.65rem; border-radius: 999px;
  }
  .glow-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #16a34a;
    box-shadow: 0 0 8px #16a34a, 0 0 16px rgba(22, 163, 74, 0.4);
    animation: pulse 2s infinite;
  }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }

  .tier-chip {
    color: #fff; font-size: 0.62rem; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase;
    padding: 0.2rem 0.6rem; border-radius: 999px;
  }

  .user-chip {
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(0, 0, 0, 0.1);
    color: #374151; padding: 0.22rem 0.7rem;
    border-radius: 999px; font-size: 0.72rem; font-weight: 600;
  }
</style>
