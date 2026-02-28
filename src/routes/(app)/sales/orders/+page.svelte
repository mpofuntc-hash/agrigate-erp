<script lang="ts">
  import ComingSoon from "$lib/components/ui/ComingSoon.svelte";
  const features = [
    "Order management",
    "Delivery scheduling",
    "Invoice generation",  ];
</script>
<svelte:head><title>Sales Orders — AgriGate</title></svelte:head>
<ComingSoon title="Sales Orders" icon="💼" description="Track customer orders, delivery status & invoicing." {features} />
