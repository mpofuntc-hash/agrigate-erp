<script lang="ts">
  import ComingSoon from "$lib/components/ui/ComingSoon.svelte";
  const features = [
    "Customer CRM",
    "Purchase history",
    "Credit limit tracking",  ];
</script>
<svelte:head><title>Customers — AgriGate</title></svelte:head>
<ComingSoon title="Customers" icon="👥" description="Manage customer profiles, preferences & purchase history." {features} />
