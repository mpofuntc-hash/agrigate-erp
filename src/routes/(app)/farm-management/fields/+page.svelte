<script lang="ts">
  import ComingSoon from "$lib/components/ui/ComingSoon.svelte";
  const features = [
    "GPS-mapped field boundaries",
    "Soil type & pH records",
    "Irrigation zone management",  ];
</script>
<svelte:head><title>Fields — AgriGate</title></svelte:head>
<ComingSoon title="Fields" icon="🌱" description="Manage field plots, boundaries, soil health & irrigation zones." {features} />
