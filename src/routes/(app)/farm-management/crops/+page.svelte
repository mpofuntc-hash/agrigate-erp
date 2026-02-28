<script lang="ts">
  import ComingSoon from "$lib/components/ui/ComingSoon.svelte";
  const features = [
    "Crop variety library",
    "Planting & harvest dates",
    "Spray & fertiliser programs",  ];
</script>
<svelte:head><title>Crops — AgriGate</title></svelte:head>
<ComingSoon title="Crops" icon="🌾" description="Track varieties, planting schedules, spray programs & growth stages." {features} />
