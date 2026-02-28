<script lang="ts">
  import ComingSoon from "$lib/components/ui/ComingSoon.svelte";
  const features = [
    "Facility capacity tracking",
    "Cold-chain monitoring",
    "Location mapping",  ];
</script>
<svelte:head><title>Warehouses — AgriGate</title></svelte:head>
<ComingSoon title="Warehouses" icon="🏚" description="Track storage facilities, capacity & cold-chain requirements." {features} />
