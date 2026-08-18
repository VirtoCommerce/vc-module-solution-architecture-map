<template>
  <div class="node" :class="node.cls" :data-node="node.key" tabindex="0"
    @click="$emit('select', node.key)"
    @keydown.enter.prevent="$emit('select', node.key)"
    @keydown.space.prevent="$emit('select', node.key)">
    <div class="node-top"><StatusDot :state="state" /><span class="node-label">{{ node.label }}</span></div>
    <div v-if="node.azure" class="node-azure">{{ node.azure }}</div>
    <div v-if="node.ver" class="node-ver">v{{ node.ver }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import StatusDot from "../shared/StatusDot.vue";
import { useStatus } from "../../composables/useStatus";
import type { RegionNode } from "../../data/regionInternals";

const props = defineProps<{ node: RegionNode }>();
defineEmits<{ select: [key: string] }>();

const { stateOf } = useStatus();
const state = computed(() => stateOf(props.node.key));
</script>
