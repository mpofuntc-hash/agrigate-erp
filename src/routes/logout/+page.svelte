<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  onMount(() => {
    const cookies = [
      "agrigate_token",
      "agrigate_profile_complete",
      "agrigate_farm_id",
      "agrigate_vetted",
      "agrigate_tier",
    ];
    for (const name of cookies) {
      document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
    }
    localStorage.removeItem("convexAuthToken");
    localStorage.removeItem("convexAuthRefreshToken");
    goto("/login");
  });
</script>

<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui;color:#6b7280;font-size:0.9rem;">
  Signing out…
</div>
