<template>
  <!-- viewBox sized to include West US (x≈160) and Australia East incl. its labels (y≈373) -->
  <svg class="worldmap" viewBox="140 0 800 385" preserveAspectRatio="xMidYMid meet" id="worldSvg"
    :data-focus="focusFlow || undefined" :style="flowStyle">
    <defs>
      <radialGradient id="oceanGrad" cx="60%" cy="0%" r="120%">
        <stop offset="0%" stop-color="#0F1A2E" /><stop offset="100%" stop-color="#0A1120" />
      </radialGradient>
    </defs>
    <rect x="4" y="4" width="992" height="424" rx="16" fill="url(#oceanGrad)" stroke="var(--line-soft)" stroke-width="1" />

    <g class="grat" id="grat">
      <line v-for="(l, i) in gratLon" :key="'lon' + i" :x1="l.x" y1="6" :x2="l.x" y2="426" />
      <line v-for="(l, i) in gratLat" :key="'lat' + i" x1="6" :y1="l.y" x2="994" :y2="l.y" />
    </g>

    <path class="land" :d="LAND_PATH" />

    <DaylightBand :minute="minute" />

    <rect class="tenant-zone china" x="794" y="125" width="60" height="30" rx="8" />
    <text class="zone-label" x="824" y="62" text-anchor="middle" fill="rgba(245,165,36,.92)">Azure China · 21Vianet</text>

    <!-- Virto Cloud datacenter catalog (hosting options) -->
    <g id="datacenters">
      <template v-for="dc in dcMarkers" :key="dc.id">
        <g class="dc-node" :class="{ current: dc.current }" :transform="`translate(${dc.x},${dc.y})`">
          <circle v-if="dc.current" class="dc-current-ring" r="12" />
          <rect class="dc-marker" x="-5" y="-5" width="10" height="10" transform="rotate(45)" />
        </g>
        <text class="dc-label" :x="dc.x" :y="dc.y + 18" text-anchor="middle">{{ dc.name }}</text>
        <text class="dc-sub muted" :x="dc.x" :y="dc.y + 29" text-anchor="middle">Virto Cloud DC</text>
      </template>
    </g>

    <g id="flows">
      <template v-for="(f, i) in flows" :key="'f' + i">
        <path class="flow-base" :d="f.d" />
        <path class="flow" :class="f.type" :d="f.d" />
      </template>
    </g>

    <g id="regionNodes">
      <template v-for="r in regionNodes" :key="r.id">
        <g class="region-node" :class="[{ master: r.master }, r.health]" :data-goregion="r.id"
          :transform="`translate(${r.x},${r.y})`" style="cursor:pointer" @click="emit('drill', r.id)">
          <title>{{ r.healthTip }}</title>
          <circle class="region-bubble r" :r="r.rad" :fill="r.col" />
          <circle class="pulse-ring" />
          <circle class="ring" r="13" />
          <circle class="core" r="6" />
        </g>
        <text class="region-label" :x="r.x" :y="r.nameY" text-anchor="middle">{{ r.name }}</text>
        <text class="region-val" :x="r.x" :y="r.valY" text-anchor="middle" :fill="r.col">{{ r.valText }}</text>
        <g :transform="`translate(${r.x},${r.barY})`">
          <rect v-for="(s, i) in r.segments" :key="i" class="pseg" :x="s.x" y="0" width="3" height="5" rx="1" :fill="s.fill" />
        </g>
      </template>
    </g>
  </svg>
</template>

<script setup lang="ts">
import { computed } from "vue";
import DaylightBand from "./DaylightBand.vue";
import { useTimeEngine } from "../../composables/useTimeEngine";
import { useSolutionData } from "../../composables/useSolutionData";
import { useIncidents } from "../../composables/useIncidents";
import { projX, projY } from "../../data/projection";
import { fmt, statusColor } from "../../data/format";
import { LAND_PATH } from "../../data/landPath";
import type { ConnectionDto, DatacenterDto, MetricKey, RegionDto } from "../../api/types";

const props = defineProps<{
  regions: readonly RegionDto[];
  connections: readonly ConnectionDto[];
  datacenters: readonly DatacenterDto[];
  metric: MetricKey;
  minute: number;
  focusFlow: string | null;
}>();
const emit = defineEmits<{ drill: [regionId: string] }>();

const { valueAt, globalAt } = useTimeEngine();
const data = useSolutionData();
const { regionHealth, activeIncidents } = useIncidents();

const SEG_OFF = "rgba(255,255,255,.15)";
const SEG_N = 12;
const FLOW_TYPE: Record<ConnectionDto["type"], string> = { replication: "rep", mutation: "mut", syncer: "sync" };
const clamp = (v: number) => Math.max(0, Math.min(1, v));

// graticule (ported from buildWorld): lon -150..150 step 30, lat -60..60 step 30
const gratLon = Array.from({ length: 11 }, (_, i) => ({ x: projX(-150 + i * 30) }));
const gratLat = Array.from({ length: 5 }, (_, i) => ({ y: projY(-60 + i * 30) }));

function geo(id: string): RegionDto { return props.regions.find((r) => r.id === id)!; }

// Virto Cloud DC markers. A DC co-located with a solution region (e.g. West Europe DC
// under the West Europe region) is MERGED into the region marker: no separate pin —
// the region gets the "current hosting" sublabel instead (see regionNodes.hosted).
const COLOCATED_PX = 30;
function colocatedRegion(dc: { lon: number; lat: number }): RegionDto | undefined {
  const x = projX(dc.lon), y = projY(dc.lat);
  return props.regions.find((r) => Math.hypot(projX(r.lon) - x, projY(r.lat) - y) < COLOCATED_PX);
}
const dcMarkers = computed(() =>
  props.datacenters
    .filter((dc) => !colocatedRegion(dc))
    .map((dc) => ({ id: dc.id, name: dc.name, current: dc.current, x: projX(dc.lon), y: projY(dc.lat) })),
);
/** Region ids hosted in a current Virto Cloud DC (drives the region's hosting sublabel). */
const hostedRegionIds = computed(() => {
  const ids = new Set<string>();
  for (const dc of props.datacenters) {
    if (!dc.current) continue;
    const region = colocatedRegion(dc);
    if (region) ids.add(region.id);
  }
  return ids;
});

const flows = computed(() =>
  props.connections.map((c) => {
    const A = geo(c.from), B = geo(c.to);
    const x1 = projX(A.lon), y1 = projY(A.lat), x2 = projX(B.lon), y2 = projY(B.lat);
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - Math.abs(x2 - x1) * 0.18 - 20; // arc upward
    return { d: `M${x1},${y1} Q${mx},${my} ${x2},${y2}`, type: FLOW_TYPE[c.type] };
  }),
);

const regionNodes = computed(() => {
  const max = data.model.metricMax;
  const m = props.metric;
  const min = props.minute;
  return props.regions.map((r) => {
    const x = projX(r.lon), y = projY(r.lat);
    const up = r.id === "china"; // china sits just above east asia
    const value = valueAt(r.id, m, min);
    const norm = m === "instances" ? value / max.instances : value / max[m];
    const rad = 7 + 26 * clamp(norm);
    // Health is driven by the active incident (region turns orange/red automatically);
    // r.health is an optional manual override from the topology. Green when neither.
    const incidentHealth = regionHealth.value[r.id];
    const health = incidentHealth ?? r.health ?? "healthy";
    const col = statusColor(health); // green healthy · orange degraded · red down
    const incident = activeIncidents.value.find((i) => i.regionIds.includes(r.id));
    const healthTip = incidentHealth
      ? `${r.name}: ${incidentHealth === "down" ? "Major outage" : "Degraded"} — active incident${incident ? ` · ${incident.title}` : ""}`
      : `${r.name}: Operational`;
    const cap = m === "instances" ? 3 + (max.instances - 3) * r.weight : max[m] * r.weight;
    const lit = Math.round(clamp(value / cap) * SEG_N);
    const segments = Array.from({ length: SEG_N }, (_, i) => ({
      x: (-24.6 + i * 4.2).toFixed(1),
      fill: i < lit ? col : SEG_OFF,
    }));
    return {
      id: r.id, name: r.name, master: !!r.master, health, healthTip, x, y, col,
      nameY: up ? y - 42 : y - 20,
      valY: up ? y - 30 : y + 23,
      barY: up ? y - 24 : y + 29,
      hosted: hostedRegionIds.value.has(r.id),
      // "up" regions (china) stack labels above the node — hosting sublabel goes on top
      // of that stack; below-node placement would collide with the East Asia label.
      hostY: up ? y - 58 : y + 44,
      rad: Number(rad.toFixed(1)),
      valText: m === "instances" ? String(Math.round(value)) : fmt(value),
      segments,
    };
  });
});

const flowStyle = computed(() => {
  const gr = globalAt("requests", props.minute);
  const sumW = props.regions.reduce((s, r) => s + r.weight, 0);
  const load = gr / (data.model.metricMax.requests * sumW);
  return {
    "--fdr": (3.6 - 1.3 * load).toFixed(2) + "s",
    "--fdm": (3.2 - 1.2 * load).toFixed(2) + "s",
    "--fds": (4.0 - 1.4 * load).toFixed(2) + "s",
  } as Record<string, string>;
});
</script>
