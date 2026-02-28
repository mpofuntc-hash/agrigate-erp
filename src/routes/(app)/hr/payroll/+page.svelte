<script lang="ts">
  import ComingSoon from "$lib/components/ui/ComingSoon.svelte";
  const features = [
    "Monthly payroll processing",
    "Earnings per worker",
    "WhatsApp pay slip delivery",  ];
</script>
<svelte:head><title>Payroll — AgriGate</title></svelte:head>
<ComingSoon title="Payroll" icon="💳" description="Process monthly payroll, view earnings & send WhatsApp pay slips." {features} />
