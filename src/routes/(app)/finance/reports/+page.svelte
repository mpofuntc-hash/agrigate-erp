<script lang="ts">
  import ComingSoon from "$lib/components/ui/ComingSoon.svelte";
  const features = [
    "Profit & Loss statement",
    "Balance sheet",
    "Cash flow report",  ];
</script>
<svelte:head><title>Financial Reports — AgriGate</title></svelte:head>
<ComingSoon title="Financial Reports" icon="📈" description="Generate P&L, balance sheets, cash flow & custom reports." {features} />
