<template>
  <section class="scene active" data-scene="region">
    <div class="scene-head">
      <div>
        <div class="eyebrow" id="regionEyebrow">Layer 3 · {{ tenantLabel }}</div>
        <h2 id="regionTitle">{{ geo?.name }} <span v-if="geo?.master" class="accent">· Master Write</span></h2>
        <p class="lead" id="regionLead">{{ region.lead }}</p>
      </div>
      <div class="flow-legend" id="regionTabs">
        <button v-for="r in regions" :key="r.id" class="crumb"
          :style="tabStyle(r.id === regionId)" @click="switchRegion(r.id)">{{ r.name }}</button>
      </div>
    </div>

    <div class="diagram">
      <div class="tier-flow" id="regionFlow">
        <!-- Edge & Security -->
        <template v-if="region.edge.length">
          <div class="tier">
            <span class="tier-label">Edge &amp; Security</span>
            <RegionNodeCard v-for="nd in region.edge" :key="nd.key" :node="nd" @select="showNode" />
          </div>
          <div class="tier-arrow">→</div>
        </template>

        <!-- Compute · AKS -->
        <div class="tier">
          <span class="tier-label">Compute · AKS</span>
          <div class="cluster">
            <div class="cluster-title">Azure Kubernetes Service <span class="chip">AKS v{{ VER.aks }}</span></div>
            <div style="display:flex;gap:12px;align-items:center">
              <RegionNodeCard v-if="nginx" :node="nginx" @select="showNode" />
              <div v-if="nginx && backends.length" class="tier-arrow" style="font-size:17px;padding:0">→</div>
              <div style="display:flex;flex-direction:column;gap:8px">
                <div v-for="nd in backends" :key="nd.key" class="node virto drill" :data-node="nd.key"
                  tabindex="0" title="Open the Virto Commerce platform"
                  @click="go('platform')" @keydown.enter.prevent="go('platform')" @keydown.space.prevent="go('platform')">
                  <div class="node-top"><StatusDot :state="stateOf(nd.key)" /><span class="node-label">{{ nd.label }}</span></div>
                  <div v-if="nd.azure" class="node-azure">{{ nd.azure }}</div>
                  <div class="drill-tag">Virto Commerce instance ↗</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="tier-arrow">→</div>

        <!-- Data & Search -->
        <div v-if="region.data.length" class="tier">
          <span class="tier-label">Data &amp; Search</span>
          <RegionNodeCard v-for="nd in region.data" :key="nd.key" :node="nd" @select="showNode" />
        </div>

        <!-- Platform Services -->
        <template v-if="region.ops.length">
          <div class="tier-arrow">→</div>
          <div class="tier">
            <span class="tier-label">Platform Services</span>
            <RegionNodeCard v-for="nd in region.ops" :key="nd.key" :node="nd" @select="showNode" />
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, watchEffect } from "vue";
import RegionNodeCard from "./RegionNodeCard.vue";
import StatusDot from "../shared/StatusDot.vue";
import { useSolutionData } from "../../composables/useSolutionData";
import { useSceneNav } from "../../composables/useSceneNav";
import { useStatus } from "../../composables/useStatus";
import { useInfoPanel } from "../../composables/useInfoPanel";
import { useNodeInfo } from "../../composables/useNodeInfo";
import { REGION_INTERNALS, VER } from "../../data/regionInternals";
import { escapeHtml } from "../../data/escapeHtml";

const props = defineProps<{ regionId: string }>();

const data = useSolutionData();
const { nav, go, jumpTo } = useSceneNav();
const { stateOf } = useStatus();
const { setInfo } = useInfoPanel();
const { showNode } = useNodeInfo();

const regions = computed(() => data.model.regions);
const geo = computed(() => data.model.regions.find((r) => r.id === props.regionId));
// Regions outside the built-in catalog (demo presets) fall back to a generic
// layout by role: master, independent single-region (local R/W, no replication),
// or read replica.
const region = computed(() => {
  if (REGION_INTERNALS[props.regionId]) return REGION_INTERNALS[props.regionId];
  if (geo.value?.master) return REGION_INTERNALS.eastus2;
  const independent = geo.value?.role === "local-rw" && data.model.connections.length === 0;
  return independent ? REGION_INTERNALS.standalone : REGION_INTERNALS.germany;
});
const tenant = computed(() => data.model.tenants.find((t) => t.id === geo.value?.tenantId));
const tenantLabel = computed(() => (geo.value?.tenantId === "china" ? "Isolated tenant (21Vianet)" : "Virto tenant (Azure)"));

const nginx = computed(() => region.value.aks.find((nd) => nd.key === "nginx"));
const backends = computed(() => region.value.aks.filter((nd) => nd.key !== "nginx"));

function tabStyle(isCurrent: boolean) {
  return `font-size:11px;padding:5px 9px;border:1px solid ${isCurrent ? "var(--gold)" : "var(--line)"};border-radius:7px;color:${isCurrent ? "#fff" : "var(--muted)"}`;
}

// Switch region "in place": drop the current region entry, then push the new one,
// keeping the breadcrumb parent chain intact.
function switchRegion(id: string) {
  if (id === props.regionId) return;
  jumpTo(nav.path.length - 2);
  go("region", id);
}

// Port of setInfoOverview('region'). lead/VER come from static app data; escaped for consistency.
function setOverview() {
  const g = geo.value;
  const verRows = [
    ["AKS", VER.aks], ["Azure SQL", VER.sql], ["Elasticsearch", VER.es],
    ["Redis", VER.redis], ["Nginx", VER.nginx], ["OS", VER.os],
  ].map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`).join("");
  setInfo({
    kic: "● Layer overview",
    title: g?.name ?? props.regionId,
    subtitle: g?.tenantId === "china" ? "Isolated tenant · 21Vianet"
      : g?.tenantId === "global" ? "Virto tenant · Azure"
      : `${tenant.value?.name ?? "Azure"} · ${g?.city ?? ""}`,
    bodyHtml: `<p>${escapeHtml(region.value.lead)}</p>
      <p style="color:var(--muted)">Click any component for live status, the Azure service behind it, and its version. The <strong>Backend for Frontend</strong> runs the Virto Commerce platform — drill in below.</p>
      <button class="drill-hint" data-goscene="platform">Open the Virto Commerce platform ›</button>
      <table class="ver-table" style="margin-top:14px">${verRows}</table>`,
  });
}

watchEffect(setOverview);
</script>
