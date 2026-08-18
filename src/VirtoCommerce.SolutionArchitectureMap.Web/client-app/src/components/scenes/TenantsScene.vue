<template>
  <section class="scene active" data-scene="tenants">
    <div class="scene-head">
      <div>
        <div class="eyebrow">Layer 2 · Tenancy &amp; compliance</div>
        <template v-if="china">
          <h2>Two isolated tenants, <span class="accent">bridged on purpose</span></h2>
          <p class="lead">China runs in its own Azure China (21Vianet) tenant for data residency. The global solution runs in commercial Azure. The Virto DB Syncer is the only controlled bridge between them.</p>
        </template>
        <template v-else-if="multi">
          <h2>{{ regions.length }} independent markets, <span class="accent">one shared codebase</span></h2>
          <p class="lead">Each market is a self-contained instance with its own database — grouped here by go-to-market region, not by data sharing. No cross-market bridges; every market scales on its own.</p>
        </template>
        <template v-else>
          <h2>One tenant, <span class="accent">one compliance domain</span></h2>
          <p class="lead">The solution runs in a single commercial Azure tenant — no cross-tenant bridges or data-residency splits.</p>
        </template>
      </div>
    </div>
    <div class="diagram">
      <!-- Independent multi-region topology (e.g. the Large preset): one card per regional group. -->
      <div v-if="multi" class="tenant-cols" style="grid-template-columns:repeat(auto-fit,minmax(190px,1fr))">
        <div v-for="t in tenants" :key="t.id" class="tenant-card global">
          <h3><span class="flag">🌐</span> {{ t.name }}</h3>
          <div class="meta">{{ t.description }}</div>
          <div class="tenant-grid">
            <button v-for="r in regionsOf(t.id)" :key="r.id" class="node tiny" @click="go('region', r.id)">
              <div class="node-top"><span class="status-dot healthy"></span><span class="node-label">{{ r.name }}</span></div>
              <div class="node-role">{{ dcName(r) }}</div>
            </button>
          </div>
        </div>
      </div>

      <!-- China-bridged reference topology. -->
      <div v-else class="tenant-cols" :style="china ? '' : 'grid-template-columns:1fr'">
        <div v-if="china" class="tenant-card china">
          <h3><span class="flag">🇨🇳</span> {{ china.name }} — {{ china.cloud }}</h3>
          <div class="meta">{{ china.description }}</div>
          <div class="tenant-grid">
            <div class="node tiny" data-node="afd" @click="showNode('afd')"><div class="node-top"><span class="status-dot" :class="stateOf('afd')"></span><span class="node-label">Front Door + WAF</span></div></div>
            <div class="node tiny virto" data-node="aks" @click="showNode('aks')"><div class="node-top"><span class="status-dot" :class="stateOf('aks')"></span><span class="node-label">AKS cluster</span></div></div>
            <div class="node tiny write" data-node="sqlcn" @click="showNode('sqlcn')"><div class="node-top"><span class="status-dot" :class="stateOf('sqlcn')"></span><span class="node-label">SQL Read/Write</span></div></div>
            <div class="node tiny" data-node="redis" @click="showNode('redis')"><div class="node-top"><span class="status-dot" :class="stateOf('redis')"></span><span class="node-label">Redis</span></div></div>
            <div class="node tiny" data-node="es" @click="showNode('es')"><div class="node-top"><span class="status-dot" :class="stateOf('es')"></span><span class="node-label">Elasticsearch</span></div></div>
            <div class="node tiny" data-node="keyvault" @click="showNode('keyvault')"><div class="node-top"><span class="status-dot" :class="stateOf('keyvault')"></span><span class="node-label">Key Vault</span></div></div>
          </div>
          <button class="drill-hint" @click="go('region', 'china')">Open China North 3 internals ›</button>
        </div>

        <div v-if="china" class="boundary">
          <div class="line"></div>
          <span class="blabel">Compliance boundary</span>
          <div class="syncer" data-node="syncer" @click="showNode('syncer')">
            <div class="ic">🔄</div>
            <b>Virto DB Syncer</b>
            <span>Bi-directional, controlled sync of selected databases between China and US datacenters.</span>
          </div>
        </div>

        <div class="tenant-card global">
          <h3><span class="flag">🌐</span> {{ mainTenant?.name }} — {{ mainTenant?.cloud }}</h3>
          <div class="meta">{{ mainTenant?.description }}</div>
          <div class="tenant-grid">
            <div class="node tiny write" data-node="sqlwrite" @click="showNode('sqlwrite')"><div class="node-top"><span class="status-dot" :class="stateOf('sqlwrite')"></span><span class="node-label">SQL Master Write</span></div><div class="node-role">{{ masterRegion.name }}</div></div>
            <div v-if="replicas.length" class="node tiny" data-node="sqlreplica" @click="showNode('sqlreplica')"><div class="node-top"><span class="status-dot" :class="stateOf('sqlreplica')"></span><span class="node-label">SQL Read Replicas</span></div><div class="node-role">{{ replicaLabel }}</div></div>
            <div class="node tiny" data-node="redisgeo" @click="showNode('redisgeo')"><div class="node-top"><span class="status-dot" :class="stateOf('redisgeo')"></span><span class="node-label">Redis{{ replicas.length ? " (geo)" : "" }}</span></div></div>
            <div class="node tiny" data-node="es" @click="showNode('es')"><div class="node-top"><span class="status-dot" :class="stateOf('es')"></span><span class="node-label">Elasticsearch</span></div></div>
            <div class="node tiny virto" data-node="hangfire" @click="showNode('hangfire')"><div class="node-top"><span class="status-dot" :class="stateOf('hangfire')"></span><span class="node-label">Hangfire jobs</span></div></div>
          </div>
          <button class="drill-hint" @click="go('region', masterRegion.id)">Open {{ masterRegion.name }}{{ replicas.length ? " (master)" : "" }} internals ›</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, watchEffect } from "vue";
import { useSolutionData } from "../../composables/useSolutionData";
import { useSceneNav } from "../../composables/useSceneNav";
import { useInfoPanel } from "../../composables/useInfoPanel";
import { useNodeInfo } from "../../composables/useNodeInfo";
import { useStatus } from "../../composables/useStatus";
import type { RegionDto } from "../../api/types";

const data = useSolutionData();
const { go } = useSceneNav();
const { setInfo } = useInfoPanel();
const { showNode } = useNodeInfo();
const { stateOf } = useStatus();

const tenants = computed(() => data.model.tenants);
const regions = computed(() => data.model.regions);
const china = computed(() => tenants.value.find((t) => t.id === "china"));
// Independent multi-region topology: >1 tenant and no China compliance split.
const multi = computed(() => !china.value && tenants.value.length > 1);
// The non-China tenant that owns the master card in the reference/single topology.
const mainTenant = computed(() => tenants.value.find((t) => t.id !== "china") ?? tenants.value[0]);
const masterRegion = computed(() => regions.value.find((r) => r.master) ?? regions.value[0]);
const replicas = computed(() => regions.value.filter((r) => r.id !== masterRegion.value?.id && r.tenantId !== "china"));
const replicaLabel = computed(() => replicas.value.map((r) => r.name).join(" · "));

function regionsOf(tenantId: string): RegionDto[] {
  return regions.value.filter((r) => r.tenantId === tenantId);
}
/** The Azure DC segment of a region's city label ("West Europe · local R/W · 2020" → "West Europe"). */
function dcName(r: RegionDto): string {
  return (r.city ?? "").split(" · ")[0];
}

watchEffect(() => {
  // Overview adapts to the topology: bridged / independent-multi / single tenant.
  const body = china.value
    ? `<p>Two separate Azure tenants keep China data resident in-country while the rest of the world runs on commercial Azure.</p>
      <p>The <strong>Virto DB Syncer</strong> is the single controlled bridge across the compliance boundary — it synchronizes only selected databases, bi-directionally.</p>
      <div class="tags"><span class="tag hot">Data residency</span><span class="tag">RBAC least-privilege</span><span class="tag">VNet + NSG</span><span class="tag">Tenant isolation</span></div>`
    : multi.value
      ? `<p>Every market is an <strong>independent instance</strong> with its own database — grouped here by go-to-market region, not for data sharing. One shared codebase deploys to all ${regions.value.length} markets.</p>
      <div class="tags"><span class="tag">One codebase</span><span class="tag">Per-market database</span><span class="tag">No shared state</span><span class="tag">Independent scaling</span></div>`
      : `<p>The whole solution runs inside one commercial Azure tenant — a single compliance domain with no cross-tenant data bridges.</p>
      <div class="tags"><span class="tag">RBAC least-privilege</span><span class="tag">VNet + NSG</span><span class="tag">Tenant isolation</span></div>`;
  setInfo({
    kic: "● Layer overview",
    title: "Tenancy & compliance",
    subtitle: china.value
      ? "Azure China (21Vianet) ⇄ commercial Azure"
      : multi.value
        ? `Commercial Azure · ${regions.value.length} independent markets`
        : "Commercial Azure · single tenant",
    bodyHtml: body,
  });
});
</script>
