<script lang="ts">
  import ComingSoon from "$lib/components/ui/ComingSoon.svelte";
  const features = [
    "Supplier directory",
    "Rating & performance scores",
    "Contract expiry alerts",  ];
</script>
<svelte:head><title>Suppliers — AgriGate</title></svelte:head>
<ComingSoon title="Suppliers" icon="🤝" description="Manage supplier profiles, ratings & contract terms." {features} />
