<template><span class="status-dot" :class="state" /></template>

<script setup lang="ts">
defineProps<{ state: "healthy" | "degraded" | "down" }>();
</script>
