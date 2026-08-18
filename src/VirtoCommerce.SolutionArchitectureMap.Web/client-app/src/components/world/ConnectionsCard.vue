<template>
  <div v-if="rows.length" class="conn-card" id="connCard">
    <div class="conn-title">Connections
      <span class="conn-hint" id="connHint">{{ focusFlow ? "click again to reset" : "click to focus" }}</span>
    </div>
    <button v-for="row in rows" :key="row.flow" class="conn-row"
      :class="{ active: focusFlow === row.flow, dimmed: !!focusFlow && focusFlow !== row.flow }"
      :data-flow="row.flow" @click="toggle(row.flow)">
      <span class="conn-line" :class="row.flow"></span>
      <span class="conn-tx"><b>{{ row.title }}</b><span>{{ row.sub }}</span></span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useSolutionData } from "../../composables/useSolutionData";

const props = defineProps<{ focusFlow: string | null }>();
const emit = defineEmits<{ "update:focusFlow": [value: string | null] }>();

const data = useSolutionData();

// Rows derive from the actual topology: one row per connection type present.
// Solutions without connections (single region) render no card at all.
const rows = computed(() => {
  const model = data.model;
  const regionName = (id: string) => model.regions.find((r) => r.id === id)?.name ?? id;
  const master = model.regions.find((r) => r.master) ?? model.regions[0];
  const result: { flow: string; title: string; sub: string }[] = [];

  const reps = model.connections.filter((c) => c.type === "replication");
  if (reps.length) {
    const targets = [...new Set(reps.map((c) => regionName(c.to)))].join(" · ");
    result.push({ flow: "rep", title: "SQL geo-replication", sub: `${master?.name ?? "master"} → ${targets}` });
  }

  const muts = model.connections.filter((c) => c.type === "mutation");
  if (muts.length) {
    const target = regionName(muts[0].to);
    result.push({ flow: "mut", title: `Writes → ${target}`, sub: `all mutations → ${target}` });
  }

  const syncs = model.connections.filter((c) => c.type === "syncer");
  if (syncs.length) {
    const pairs = syncs.map((c) => `${regionName(c.from)} ⇄ ${regionName(c.to)}`).join(" · ");
    result.push({ flow: "sync", title: "DB Syncer", sub: `${pairs} · selective · bi-directional` });
  }

  return result;
});

// Port of setActiveFlow: click a row to focus, click again to clear.
function toggle(flow: string) {
  emit("update:focusFlow", props.focusFlow === flow ? null : flow);
}
</script>
