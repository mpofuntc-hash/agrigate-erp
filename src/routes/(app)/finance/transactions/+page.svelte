<script lang="ts">
  import ComingSoon from "$lib/components/ui/ComingSoon.svelte";
  const features = [
    "Journal entries",
    "Bank reconciliation",
    "Transaction search",  ];
</script>
<svelte:head><title>Transactions — AgriGate</title></svelte:head>
<ComingSoon title="Transactions" icon="💰" description="Record & review all financial transactions & journal entries." {features} />
