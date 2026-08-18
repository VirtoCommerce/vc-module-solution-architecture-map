<template>
  <g>
    <defs>
      <!-- one repeating band: period = full map width (360°). Sliding gradientTransform
           moves the lit hemisphere and wraps seamlessly across the dateline. -->
      <linearGradient id="dayBand" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1000" y2="0"
        spreadMethod="repeat" :gradientTransform="gradientTransform">
        <stop offset="0" stop-color="#FF9A3B" stop-opacity="0" />
        <stop offset="0.26" stop-color="#FF9A3B" stop-opacity="0.10" />
        <stop offset="0.5" stop-color="#FFD27A" stop-opacity="0.42" />
        <stop offset="0.74" stop-color="#FF9A3B" stop-opacity="0.10" />
        <stop offset="1" stop-color="#FF9A3B" stop-opacity="0" />
      </linearGradient>
      <clipPath id="mapClip"><rect x="4" y="4" width="992" height="424" rx="16" /></clipPath>
    </defs>
    <g clip-path="url(#mapClip)">
      <rect class="daylight" id="daylight" x="4" y="4" width="992" height="424" fill="url(#dayBand)" />
    </g>
  </g>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { projX } from "../../data/projection";

const props = defineProps<{ minute: number }>();

// Slide the repeating gradient so the lit hemisphere centers on the subsolar longitude.
const gradientTransform = computed(
  () => `translate(${(projX(180 - (props.minute / 1440) * 360) - 500).toFixed(1)},0)`,
);
</script>
