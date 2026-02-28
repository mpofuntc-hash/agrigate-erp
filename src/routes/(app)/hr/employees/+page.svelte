<script lang="ts">
  import ComingSoon from "$lib/components/ui/ComingSoon.svelte";
  const features = [
    "Worker profiles & vetting status",
    "Employment history",
    "Skills & certifications",  ];
</script>
<svelte:head><title>Employees — AgriGate</title></svelte:head>
<ComingSoon title="Employees" icon="👷" description="Vetted worker profiles, employment records & skills tracking." {features} />
