<script lang="ts">
  import ComingSoon from "$lib/components/ui/ComingSoon.svelte";
  const features = [
    "Account hierarchy",
    "Budget allocation",
    "Cost centre mapping",  ];
</script>
<svelte:head><title>Chart of Accounts — AgriGate</title></svelte:head>
<ComingSoon title="Chart of Accounts" icon="📊" description="Configure your financial account structure & categories." {features} />
