<script lang="ts">
  import ComingSoon from "$lib/components/ui/ComingSoon.svelte";
  const features = [
    "Inbound receipts",
    "Outbound deliveries",
    "Full audit trail",  ];
</script>
<svelte:head><title>Stock Movements — AgriGate</title></svelte:head>
<ComingSoon title="Stock Movements" icon="↔️" description="Record and audit all inbound & outbound stock transactions." {features} />
