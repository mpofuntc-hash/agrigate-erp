<script lang="ts">
  import ComingSoon from "$lib/components/ui/ComingSoon.svelte";
  const features = [
    "PO creation & approval workflow",
    "Supplier order history",
    "Delivery tracking",  ];
</script>
<svelte:head><title>Purchase Orders — AgriGate</title></svelte:head>
<ComingSoon title="Purchase Orders" icon="🛒" description="Create, approve & track supplier purchase orders." {features} />
