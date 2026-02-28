<script lang="ts">
  import ComingSoon from "$lib/components/ui/ComingSoon.svelte";
  const features = [
    "Season templates",
    "Rotation planning",
    "Yield forecasting",  ];
</script>
<svelte:head><title>Seasons — AgriGate</title></svelte:head>
<ComingSoon title="Seasons" icon="📅" description="Plan crop rotations, growing seasons & harvest windows." {features} />
