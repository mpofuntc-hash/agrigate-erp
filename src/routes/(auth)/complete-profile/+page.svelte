<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  // This route is superseded by /profile-setup — redirect immediately.
  onMount(() => goto("/profile-setup", { replaceState: true }));
</script>
