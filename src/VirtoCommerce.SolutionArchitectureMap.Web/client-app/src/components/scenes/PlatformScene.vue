<template>
  <section class="scene active" data-scene="platform">
    <div class="scene-head">
      <div>
        <div class="eyebrow">Layer 4 · The submerged depth — inside Virto Commerce</div>
        <h2>The <span class="accent">composable commerce engine</span> behind the box</h2>
        <p class="lead">A storefront-less Vue 3 frontend talks GraphQL to the Experience API (XAPI). 80+ packaged modules form the hardened base; custom modules are built by your implementation partner.</p>
      </div>
      <div class="ptoggle">
        <button :class="{ on: view === 'arch' }" data-pview="arch" @click="setView('arch')">Architecture</button>
        <button :class="{ on: view === 'xapi' }" data-pview="xapi" @click="setView('xapi')">XAPI Request Flow</button>
      </div>
    </div>

    <!-- Architecture view -->
    <div class="pview diagram" :class="{ on: view === 'arch' }" data-pview="arch">
      <div class="tier-flow">
        <div class="tier">
          <span class="tier-label">Presentation</span>
          <div class="node virto" data-node="vue" tabindex="0" @click="showNode('vue')"><div class="node-top"><span class="status-dot" :class="stateOf('vue')"></span><span class="node-label">Vue 3 Frontend</span></div><div class="node-azure">Vite · storefront-less SPA</div><div class="node-role">Served via Front Door / Blob CDN</div></div>
        </div>
        <div class="tier-arrow">→</div>
        <div class="tier">
          <span class="tier-label">API Gateway</span>
          <div class="node virto" data-node="xapi" tabindex="0" @click="showNode('xapi')"><div class="node-top"><span class="status-dot" :class="stateOf('xapi')"></span><span class="node-label">GraphQL XAPI</span></div><div class="node-azure">xCatalog · xCart · xOrder · xCMS</div><div class="node-role">Experience API · GEO WCP routing</div></div>
        </div>
        <div class="tier-arrow">→</div>
        <div class="tier">
          <span class="tier-label">Modules · Atomic architecture</span>
          <div class="cluster" style="max-width:372px">
            <div class="cluster-title">Out-of-the-box modules <span class="chip">≈80% standard base</span></div>
            <div class="modules-grid" id="oobModules">
              <div v-for="m in oob" :key="m.id" class="node oob tiny" :data-mod="m.name"><div class="node-top"><span class="status-dot healthy"></span><span class="node-label">{{ m.name }}</span></div></div>
            </div>
            <div class="cluster-title" style="margin-top:6px">Custom modules <span class="chip" style="color:var(--vc-orange);border-color:rgba(255,154,59,.4)">≈20% tailored</span></div>
            <div class="modules-grid" id="customModules">
              <div v-for="m in custom" :key="m.id" class="node custom tiny" :data-mod="m.name"><div class="node-top"><span class="status-dot healthy"></span><span class="node-label">{{ m.name }}</span></div></div>
            </div>
            <a class="partner" :href="partner.website" target="_blank" rel="noopener" data-node="luminos">
              <span class="lum">
                <img v-if="partner.logoUrl" class="tl-logo-img" :src="partner.logoUrl" :alt="partner.name" />
                <template v-else><span class="spark">✦</span>{{ partner.name }}</template>
              </span>
              <div class="tx"><b>Implementation Partner</b><span>Builds &amp; maintains your custom modules</span></div>
              <span class="go">{{ partnerHost }} ↗</span>
            </a>
          </div>
        </div>
        <div class="tier-arrow">→</div>
        <div class="tier">
          <span class="tier-label">Data &amp; jobs</span>
          <div class="node write" data-node="efcore" tabindex="0" @click="showNode('efcore')"><div class="node-top"><span class="status-dot" :class="stateOf('efcore')"></span><span class="node-label">EF Core → Azure SQL</span></div><div class="node-azure">.NET 10 backend</div></div>
          <div class="node virto" data-node="hangfire" tabindex="0" @click="showNode('hangfire')"><div class="node-top"><span class="status-dot" :class="stateOf('hangfire')"></span><span class="node-label">Hangfire</span></div><div class="node-role">Async write tasks</div></div>
          <div class="node" data-node="redis" tabindex="0" @click="showNode('redis')"><div class="node-top"><span class="status-dot" :class="stateOf('redis')"></span><span class="node-label">Redis cache</span></div></div>
          <div class="node" data-node="es" tabindex="0" @click="showNode('es')"><div class="node-top"><span class="status-dot" :class="stateOf('es')"></span><span class="node-label">Elasticsearch</span></div></div>
        </div>
      </div>
    </div>

    <!-- XAPI flow view -->
    <div class="pview diagram" :class="{ on: view === 'xapi' }" data-pview="xapi">
      <div class="tier-flow">
        <div class="tier">
          <span class="tier-label">Regional edge (EU · JP · CN)</span>
          <div class="node virto" data-node="vue" tabindex="0" @click="showNode('vue')"><div class="node-top"><span class="status-dot" :class="stateOf('vue')"></span><span class="node-label">Frontend + GEO WCP</span></div><div class="node-role">Routes by operation type</div></div>
        </div>
        <div class="tier-arrow">⇄</div>
        <div class="tier">
          <span class="tier-label">Reads — local &amp; fast</span>
          <div class="node oob" data-node="xapi" tabindex="0" @click="showNode('xapi')"><div class="node-top"><span class="status-dot" :class="stateOf('xapi')"></span><span class="node-label">Query → XAPI.EU/JP/CN</span></div><div class="node-role">Served from regional read replica</div></div>
          <div class="node" data-node="sqlreplica" tabindex="0" @click="showNode('sqlreplica')"><div class="node-top"><span class="status-dot" :class="stateOf('sqlreplica')"></span><span class="node-label">Region Read Replica</span></div></div>
        </div>
        <div class="tier-arrow">→</div>
        <div class="tier">
          <span class="tier-label">Writes — routed to master</span>
          <div class="node write" data-node="xapius" tabindex="0" @click="showNode('xapius')"><div class="node-top"><span class="status-dot" :class="stateOf('xapius')"></span><span class="node-label">Mutation → XAPI.US</span></div><div class="node-role">All writes funnel to US</div></div>
          <div class="node virto" data-node="hangfire" tabindex="0" @click="showNode('hangfire')"><div class="node-top"><span class="status-dot" :class="stateOf('hangfire')"></span><span class="node-label">Hangfire async task</span></div><div class="node-role">Any write from code → queued</div></div>
          <div class="node write" data-node="sqlwrite" tabindex="0" @click="showNode('sqlwrite')"><div class="node-top"><span class="status-dot" :class="stateOf('sqlwrite')"></span><span class="node-label">Main Region Write</span></div><div class="node-role">East US 2 · Azure SQL</div></div>
        </div>
        <div class="tier-arrow">↩</div>
        <div class="tier">
          <span class="tier-label">Propagation</span>
          <div class="node" data-node="sqlreplica" tabindex="0" @click="showNode('sqlreplica')"><div class="node-top"><span class="status-dot" :class="stateOf('sqlreplica')"></span><span class="node-label">Replica ← Master</span></div><div class="node-role">Geo-replication back to regions</div></div>
          <div class="node" data-node="syncer" tabindex="0" @click="showNode('syncer')"><div class="node-top"><span class="status-dot" :class="stateOf('syncer')"></span><span class="node-label">DB Syncer → China</span></div><div class="node-role">Selected DBs to CN hybrid</div></div>
        </div>
      </div>
      <div class="xapi-legend">
        <span class="it"><span class="dotc" style="background:var(--vc-cyan)"></span>Query path — read from nearest replica (low latency)</span>
        <span class="it"><span class="dotc" style="background:var(--tl-red)"></span>Mutation path — always to the US master write region</span>
        <span class="it"><span class="dotc" style="background:var(--vc-orange)"></span>Async — code-side writes go through Hangfire</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, watchEffect } from "vue";
import { useSolutionData } from "../../composables/useSolutionData";
import { useInfoPanel } from "../../composables/useInfoPanel";
import { useNodeInfo } from "../../composables/useNodeInfo";
import { useStatus } from "../../composables/useStatus";
import { usePlatformView } from "../../composables/usePlatformView";
import { escapeHtml } from "../../data/escapeHtml";

const data = useSolutionData();
const { setInfo } = useInfoPanel();
const { showNode } = useNodeInfo();
const { stateOf } = useStatus();
const { view, setView } = usePlatformView();

// OOB module tiles = commerce items on the standard base (level<=1); custom = tailored (level>=2).
const commerce = computed(() => data.customization.items.filter((i) => i.group === "commerce"));
const oob = computed(() => commerce.value.filter((i) => i.level <= 1));
const custom = computed(() => commerce.value.filter((i) => i.level >= 2));

// Implementation partner branding from the ProjectInfo setting.
const partner = computed(() => data.model.project.partner);
const partnerHost = computed(() => {
  try { return new URL(partner.value.website).host; } catch { return partner.value.website; }
});

watchEffect(() => {
  // Port of setInfoOverview('platform'); heat-map CTA via [data-goscene] delegation.
  // Partner name comes from settings (live data) → escapeHtml before the v-html sink.
  setInfo({
    kic: "● Layer overview",
    title: "Virto Commerce platform",
    subtitle: "Composable · API-first · .NET 10",
    bodyHtml: `<p>The engine inside the box: an <strong>80+ module</strong> composable commerce platform. Clients build on a hardened standard base and extend only where their business is unique — the <strong>80 / 20 model</strong>.</p>
      <div class="stat-mini">
        <div class="s"><div class="v">≈80<span class="u">%</span></div><div class="l">Standard base (OOB)</div></div>
        <div class="s"><div class="v">≈20<span class="u">%</span></div><div class="l">Tailored / custom</div></div>
      </div>
      <p>Toggle <strong>XAPI Request Flow</strong> above to see how reads stay local and writes route to the US master region.</p>
      <p style="color:var(--muted)">Custom modules are delivered by implementation partner <strong style="color:var(--vc-orange)">${escapeHtml(partner.value.name)}</strong>.</p>
      <button class="drill-hint" data-goscene="heatmap">Open the customization heat map ›</button>`,
  });
});
</script>
