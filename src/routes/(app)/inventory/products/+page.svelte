<script lang="ts">
  import ComingSoon from "$lib/components/ui/ComingSoon.svelte";
  const features = [
    "Product catalogue",
    "Stock level alerts",
    "Price tier management",  ];
</script>
<svelte:head><title>Products — AgriGate</title></svelte:head>
<ComingSoon title="Products" icon="📦" description="Catalogue products, manage stock levels & set pricing tiers." {features} />
