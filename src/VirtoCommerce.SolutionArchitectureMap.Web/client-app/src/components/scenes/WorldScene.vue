<template>
  <section class="scene active" data-scene="world">
    <div class="scene-head">
      <div>
        <div class="eyebrow">Layer 1 · Live global footprint — a day in the life</div>
        <h2>One platform, <span class="accent">{{ regionPhrase }}</span>{{ regions.length > 1 ? ", following the sun" : "" }}</h2>
        <p class="lead">{{ leadText }} Click a region to dive in.</p>
      </div>
      <div style="display:flex;flex-direction:column;gap:9px;align-items:flex-end">
        <div class="metric-toggle" id="metricToggle">
          <button v-for="mt in metrics" :key="mt.k" :data-metric="mt.k"
            :class="{ on: time.metric === mt.k }" @click="setMetric(mt.k)">{{ mt.label }}</button>
        </div>
      </div>
    </div>

    <div class="world-wrap">
      <WorldMap :minute="time.minute" :metric="time.metric" :focus-flow="focusFlow"
        :regions="regions" :connections="connections" :datacenters="datacenters" @drill="onDrill" />
      <ConnectionsCard v-model:focus-flow="focusFlow" />
    </div>

    <MetricDashboard />
  </section>
</template>

<script setup lang="ts">
import { watchEffect, ref, computed } from "vue";
import WorldMap from "../world/WorldMap.vue";
import ConnectionsCard from "../world/ConnectionsCard.vue";
import MetricDashboard from "../world/MetricDashboard.vue";
import { useSolutionData } from "../../composables/useSolutionData";
import { useTimeEngine } from "../../composables/useTimeEngine";
import { useSceneNav } from "../../composables/useSceneNav";
import { useInfoPanel } from "../../composables/useInfoPanel";
import type { ConnectionDto, DatacenterDto, MetricKey, RegionDto } from "../../api/types";
import { escapeHtml } from "../../data/escapeHtml";
import { beautifyCount } from "../../data/format";

const data = useSolutionData();
const { time, setMetric } = useTimeEngine();
const { go } = useSceneNav();
const { setInfo } = useInfoPanel();

const focusFlow = ref<string | null>(null);

const metrics: { k: MetricKey; label: string }[] = [
  { k: "requests", label: "Requests" },
  { k: "users", label: "Active users" },
  { k: "orders", label: "New orders" },
  { k: "instances", label: "Instances" },
];

// Readonly composable state → DTO types at the component boundary.
const regions = computed(() => data.model.regions as unknown as RegionDto[]);
const connections = computed(() => data.model.connections as unknown as ConnectionDto[]);
const datacenters = computed(() => data.model.datacenters as unknown as DatacenterDto[]);

// Headline adapts to the topology (demo presets range from 1 to 5 regions).
const NUM_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
// Independent-instance topology (e.g. the Large preset): every region is a standalone market
// with no master and no cross-region links. Changes the noun from "region" to "market".
const independent = computed(() =>
  regions.value.length > 1 && !regions.value.some((r) => r.master) && connections.value.length === 0);
const unit = computed(() => (independent.value ? "market" : "Azure region"));
const regionPhrase = computed(() => {
  const n = regions.value.length;
  if (n === 1) return `one Azure region — ${regions.value[0].name}`;
  return independent.value ? `${NUM_WORDS[n] ?? n} independent markets` : `${NUM_WORDS[n] ?? n} Azure regions`;
});
const leadText = computed(() =>
  independent.value
    ? "Press play to watch a day of traffic across every market: each instance autoscales and peaks in its own local business hours — no shared state between them."
    : regions.value.length > 1
      ? "Press play to watch traffic move across the globe over 24h: instances autoscale, requests and active users peak in each region's business hours."
      : "Press play to watch a day of traffic: instances autoscale, requests and active users peak in local business hours.");

function onDrill(id: string) { go("region", id); }

watchEffect(() => {
  // Port of setInfoOverview('world'), data-driven: customer, counts, and topology
  // sentences derive from the model (demo presets range from 1 to 5 regions).
  const model = data.model;
  const isIndependent = independent.value;
  const master = model.regions.find((r) => r.master) ?? model.regions[0];
  const replicas = model.regions.filter((r) => r.id !== master?.id);
  const hasChina = model.tenants.some((t) => t.id === "china");
  const customer = escapeHtml(model.project.customer.title);
  const topologySentence = isIndependent
    ? `Every market runs as an <strong>independent instance</strong> on its nearest Azure region — one shared codebase deployed per market, with no cross-market replication or shared data. Hosted across <strong>${model.datacenters.length} Azure regions</strong>.`
    : replicas.length > 0
      ? `<strong>${escapeHtml(master?.name ?? "")}</strong> is the master write region; every other region serves reads from a local geo-replica.`
      : `The solution runs in a single region — <strong>${escapeHtml(master?.name ?? "")}</strong> — with no cross-region replication.`;
  const hint = isIndependent
    ? `Click a <strong>market pin</strong> to open its internals, or open <strong>Tenancy &amp; compliance</strong> for the per-region grouping.`
    : hasChina
      ? `Click a <strong>region pin</strong> to open its internals, or open <strong>Tenancy &amp; compliance</strong> to see how China is isolated.`
      : `Click a <strong>region pin</strong> to open its internals, or open <strong>Tenancy &amp; compliance</strong> for the tenant layout.`;
  // Catalog size: real product count from the search index when the API provides it;
  // otherwise the fleet-wide marketing stat.
  const skuTile = model.catalogSize != null
    ? `<div class="s"><div class="v">${beautifyCount(model.catalogSize)}</div><div class="l">SKUs in catalog</div></div>`
    : `<div class="s"><div class="v">800M<span class="u">+</span></div><div class="l">SKUs managed (fleet)</div></div>`;
  setInfo({
    kic: "● Layer overview",
    title: "Global footprint",
    subtitle: isIndependent
      ? `${model.regions.length} markets · ${model.tenants.length} regions · ${model.datacenters.length} Azure DCs`
      : `${model.regions.length} Azure region${model.regions.length === 1 ? "" : "s"} · ${model.tenants.length} tenant${model.tenants.length === 1 ? "" : "s"}`,
    bodyHtml: `
      <div class="stat-mini">
        <div class="s"><div class="v">99.99<span class="u">%</span></div><div class="l">Achieved uptime</div></div>
        <div class="s"><div class="v">60<span class="u">+</span></div><div class="l">Countries powered</div></div>
        ${skuTile}
        <div class="s"><div class="v">SOC 2</div><div class="l">Type 2 · annual</div></div>
      </div>
      <p>${customer} runs on <strong>Virto Cloud</strong> — a fully-managed, Kubernetes-native PaaS on Microsoft Azure, built to CNCF and Well-Architected practices. ${topologySentence}</p>
      <p>${hint}</p>
      <button class="drill-hint" data-goscene="tenants">Open Tenancy &amp; Compliance ›</button>
      <button class="drill-hint" data-goscene="heatmap">Open Customization map ›</button>`,
  });
});
</script>
