<template>
  <!-- Virto Commerce official logo (mark keeps brand colors; wordmark = currentColor) -->
  <svg width="0" height="0" style="position:absolute" aria-hidden="true">
    <symbol id="vc-logo" viewBox="0 0 146 40">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M18.6459 0.185272C18.2527 0.185272 17.8961 0.41563 17.7344 0.77398L9.63681 18.7197C9.33817 19.3816 9.82222 20.131 10.5483 20.131H17.8062C17.9242 20.131 18.0312 20.0619 18.0797 19.9544L26.3632 1.59656C26.6618 0.934723 26.1778 0.185272 25.4517 0.185272H18.6459Z" fill="#D8CECE" />
      <path fill-rule="evenodd" clip-rule="evenodd" d="M1.54831 0.185272C0.822215 0.185272 0.33817 0.934724 0.636808 1.59656L8.73436 19.5423C8.89606 19.9007 9.25272 20.131 9.64586 20.131H17.5355C17.7533 20.131 17.8985 19.9062 17.809 19.7076L9.26564 0.77398C9.10394 0.41563 8.74728 0.185272 8.35414 0.185272H1.54831ZM40 24.1202C40 24.9137 39.6839 25.6747 39.1213 26.2358C38.5587 26.7968 37.7957 27.1121 37 27.1121C36.2043 27.1121 35.4413 26.7968 34.8787 26.2358C34.3161 25.6747 34 24.9137 34 24.1202C34 23.3267 34.3161 22.5657 34.8787 22.0046C35.4413 21.4435 36.2043 21.1283 37 21.1283C37.7957 21.1283 38.5587 21.4435 39.1213 22.0046C39.6839 22.5657 40 23.3267 40 24.1202Z" fill="#EC3A35" />
      <path fill-rule="evenodd" clip-rule="evenodd" d="M30.4927 26.7848C30.3157 26.393 29.9401 26.1148 29.5101 26.1148H22.1502C21.5426 26.1148 21.0733 26.6537 21.2007 27.2478C22.6943 34.2106 28.6979 39.5221 35.9998 39.9695C36.551 40.0032 37 39.5523 37 39V31.9935C37 31.4412 36.5498 31.0009 36.0029 30.9241C33.5413 30.5787 31.4813 28.9731 30.4927 26.7848ZM29.5088 22.1256C29.9395 22.1256 30.3154 21.8467 30.4918 21.4538C31.4801 19.2523 33.5406 17.6371 36.0029 17.2897C36.5498 17.2126 37 16.7722 37 16.22V9.16359C37 8.6113 36.551 8.16035 35.9998 8.19432C28.6955 8.64434 22.6904 13.9889 21.1993 20.9932C21.0728 21.5872 21.542 22.1256 22.1493 22.1256H29.5088Z" fill="#FF9A3B" />
      <path fill-rule="evenodd" clip-rule="evenodd" d="M82.0725 11.3807C82.0725 14.721 84.471 17.1115 87.5181 17.1115C90.5502 17.1115 92.9487 14.721 92.9487 11.3807C92.9487 8.04044 90.5502 5.64999 87.5181 5.64999C84.471 5.64999 82.0725 8.04044 82.0725 11.3807ZM87.5181 15.2276C85.542 15.2276 84.0335 13.7079 84.0335 11.3807C84.0335 9.05362 85.542 7.53386 87.5181 7.53386C89.4792 7.53386 90.9877 9.05362 90.9877 11.3807C90.9877 13.7079 89.4792 15.2276 87.5181 15.2276ZM53.4741 34.3115C50.3666 34.3115 48.0284 31.9369 48.0284 28.5966C48.0284 25.2404 50.4269 22.85 53.4892 22.85C55.4351 22.85 57.2151 23.8315 58.1956 25.6204L56.5514 26.6494C55.9178 25.3987 54.7865 24.7339 53.4892 24.7339C51.513 24.7339 50.0046 26.2536 50.0046 28.5807C50.0046 30.9079 51.513 32.4276 53.4892 32.4276C54.8166 32.4276 55.9631 31.7152 56.5665 30.5121L58.2107 31.5253C57.2453 33.2825 55.4954 34.3115 53.4741 34.3115ZM59.4158 28.5807C59.4158 31.921 61.8143 34.3115 64.8614 34.3115C67.8935 34.3115 70.2919 31.921 70.2919 28.5807C70.2919 25.2404 67.8935 22.85 64.8614 22.85C61.8143 22.85 59.4158 25.2404 59.4158 28.5807ZM64.8614 32.4276C62.8853 32.4276 61.3768 30.9079 61.3768 28.5807C61.3768 26.2536 62.8853 24.7339 64.8614 24.7339C66.8224 24.7339 68.3309 26.2536 68.3309 28.5807C68.3309 30.9079 66.8224 32.4276 64.8614 32.4276ZM126.055 34.3115C122.948 34.3115 120.609 31.9369 120.609 28.5966C120.609 25.2404 123.008 22.85 126.07 22.85C128.016 22.85 129.796 23.8315 130.777 25.6204L129.132 26.6494C128.499 25.3987 127.368 24.7339 126.07 24.7339C124.094 24.7339 122.586 26.2536 122.586 28.5807C122.586 30.9079 124.094 32.4276 126.07 32.4276C127.398 32.4276 128.544 31.7152 129.148 30.5121L130.792 31.5253C129.826 33.2825 128.076 34.3115 126.055 34.3115ZM132.541 34.1215V23.0399H139.947V24.8921H134.441V27.4567H139.238V29.2931H134.441V32.2693H139.947V34.1215H132.541ZM110.93 23.0399V34.1215H112.831V30.0213H114.309L117.19 34.1215H119.498L116.451 29.8947C118.065 29.5147 119.03 28.2957 119.03 26.5385C119.03 24.3855 117.597 23.0399 115.319 23.0399H110.93ZM115.138 28.1691H112.831V24.908H115.138C116.451 24.908 117.069 25.4779 117.069 26.5385C117.069 27.5834 116.451 28.1691 115.138 28.1691ZM101.369 34.1215V23.0399H108.776V24.8921H103.27V27.4567H108.067V29.2931H103.27V32.2693H108.776V34.1215H101.369ZM86.8147 23.0399V34.1215H88.6852V26.2377L92.0642 33.8049H93.5878L96.9517 26.2694V34.1215H98.8373V23.0399H96.4841L92.8336 31.2403L89.1679 23.0399H86.8147ZM72.2601 34.1215V23.0399H74.6134L78.279 31.2403L81.9295 23.0399H84.2828V34.1215H82.3972V26.2694L79.0332 33.8049H77.5097L74.1307 26.2377V34.1215H72.2601ZM76.1616 16.9215V7.70797H72.8127V5.83994H81.4262V7.70797H78.0774V16.9215H76.1616ZM63.554 5.83994V16.9215H65.4546V12.8213H66.933L69.8142 16.9215H72.1222L69.075 12.6947C70.6891 12.3147 71.6545 11.0958 71.6545 9.33854C71.6545 7.18555 70.2215 5.83994 67.9436 5.83994H63.554ZM67.7626 10.9691H65.4546V7.70797H67.7626C69.075 7.70797 69.6935 8.27788 69.6935 9.33854C69.6935 10.3834 69.075 10.9691 67.7626 10.9691ZM59.1198 16.9215V5.83994H61.0204V16.9215H59.1198ZM47.5005 5.83994L51.5131 16.9215H53.6702L57.6828 5.83994H55.6614L52.5841 14.5469L49.5219 5.83994H47.5005Z" fill="currentColor" />
    </symbol>
  </svg>

  <!-- ================= TOP BAR ================= -->
    <header class="topbar">
      <div class="brand">
        <div class="tl-mark" role="button" tabindex="0" title="Back to overview"
          style="cursor:pointer" @click="goView('world')" @keydown.enter.space.prevent="goView('world')">
          <img v-if="project.customer.logoUrl" class="tl-logo-img" :src="project.customer.logoUrl" :alt="project.customer.title" />
          <span v-else class="tl-logo plain">{{ project.customer.title }}</span>
        </div>
      </div>
      <div class="title-block">
        <h1>Interactive Solution Map</h1>
        <span class="sub">{{ subtitle }}</span>
      </div>
      <div class="powered">
        <span class="lbl">Powered by</span>
        <svg class="vc-logo" role="img" aria-label="Virto Commerce"><use href="#vc-logo" /></svg>
        <div class="health" id="health" title="Overall service health (demo data)">
          <span class="pulse" id="healthPulse" :style="{ background: pulseColor }"></span><span id="healthText">{{ healthText }}</span>
        </div>
      </div>
    </header>

    <!-- ================= BREADCRUMB ================= -->
    <nav class="breadcrumb">
      <div id="crumbs" style="display:flex;align-items:center;gap:2px">
        <template v-for="c in crumbs" :key="c.index">
          <span v-if="c.index > 0" class="crumb-arrow">›</span>
          <button class="crumb" :class="{ current: c.last }" @click="onCrumb(c)">{{ c.label }}</button>
        </template>
      </div>
      <div class="bc-spacer"></div>
      <span v-if="status.stale" class="demo" title="Status polling is failing; showing last-known states">⚠ status stale</span>
      <button class="view-btn" id="reliabilityBtn" title="Reliability & incidents"
        :style="hasIncident ? { borderColor: 'var(--warn)', color: 'var(--text)' } : {}" @click="goView('incidents')">
        <span :style="{ width: '7px', height: '7px', borderRadius: '50%', display: 'inline-block', marginRight: '7px', verticalAlign: 'middle', background: hasIncident ? 'var(--warn)' : 'var(--ok)' }"></span>{{ incidentLabel }}
      </button>
    </nav>

    <!-- ================= STAGE ================= -->
    <main class="stage" id="stage" :class="{ 'stage-full': current.scene === 'incidents' }">
      <WorldScene v-if="current.scene === 'world'" />
      <TenantsScene v-else-if="current.scene === 'tenants'" />
      <RegionScene v-else-if="current.scene === 'region'" :key="current.arg" :region-id="current.arg ?? 'eastus2'" />
      <PlatformScene v-else-if="current.scene === 'platform'" />
      <HeatmapScene v-else-if="current.scene === 'heatmap'" />
      <IncidentsScene v-else-if="current.scene === 'incidents'" />
    </main>

    <InfoPanel v-if="current.scene !== 'incidents'" />

    <!-- ================= BOTTOM LEGEND (scene-aware: only relevant groups) ================= -->
    <div class="legend">
      <div v-if="legend.status" class="grp"><span class="ttl">Status</span>
        <span class="s-it"><span class="status-dot healthy"></span>Healthy</span>
        <span class="s-it"><span class="status-dot degraded"></span>Degraded</span>
        <span class="s-it"><span class="status-dot down"></span>Down</span>
      </div>
      <div v-if="legend.tier" class="grp"><span class="ttl">Tier</span>
        <span class="s-it"><span class="dotc" style="background:var(--tier-write)"></span>Write / master</span>
        <span class="s-it"><span class="dotc" style="background:var(--vc-blue)"></span>Virto runtime</span>
        <span class="s-it"><span class="dotc" style="background:var(--vc-cyan)"></span>OOB module</span>
        <span class="s-it"><span class="dotc" style="background:var(--vc-orange)"></span>Custom / partner</span>
      </div>
      <div v-if="legend.hosting" class="grp"><span class="ttl">Hosting</span>
        <span class="s-it"><span style="color:var(--vc-cyan);font-size:12px">◇</span>Virto Cloud datacenter</span>
        <span class="s-it"><span style="color:var(--vc-cyan);font-size:12px">◈</span>Current hosting</span>
      </div>
      <div v-if="legend.heat" class="grp"><span class="ttl">Customization</span>
        <span class="s-it"><span class="dotc" style="background:#2B7FFF"></span>Standard</span>
        <span class="s-it"><span class="dotc" style="background:#38BDF8"></span>Configured</span>
        <span class="s-it"><span class="dotc" style="background:#F59E0B"></span>Extended</span>
        <span class="s-it"><span class="dotc" style="background:#FF6A3D"></span>Custom</span>
      </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import WorldScene from "./scenes/WorldScene.vue";
import TenantsScene from "./scenes/TenantsScene.vue";
import RegionScene from "./scenes/RegionScene.vue";
import PlatformScene from "./scenes/PlatformScene.vue";
import HeatmapScene from "./scenes/HeatmapScene.vue";
import IncidentsScene from "./scenes/IncidentsScene.vue";
import InfoPanel from "./shared/InfoPanel.vue";
import { useSceneNav, type SceneId } from "../composables/useSceneNav";
import { useSolutionData } from "../composables/useSolutionData";
import { useTimeEngine } from "../composables/useTimeEngine";
import { useStatus } from "../composables/useStatus";
import { useIncidents } from "../composables/useIncidents";

const { nav, current, go, goView, jumpTo } = useSceneNav();
const data = useSolutionData();
const project = computed(() => data.model.project);
const { hasActive: hasIncident, activeIncidents } = useIncidents();
const incidentLabel = computed(() =>
  hasIncident.value ? `${activeIncidents.value.length} active incident${activeIncidents.value.length > 1 ? "s" : ""}` : "Reliability");

// Topbar subtitle adapts to the topology (region count, China tenant presence).
const subtitle = computed(() => {
  const n = data.model.regions.length;
  const hasChina = data.model.tenants.some((t) => t.id === "china");
  if (hasChina) return "Multi-region commerce on Microsoft Azure + Azure China (21Vianet)";
  return n > 1 ? "Multi-region commerce on Microsoft Azure" : `Commerce on Microsoft Azure · ${data.model.regions[0]?.name ?? ""}`;
});
const { time } = useTimeEngine();
const { status, overall } = useStatus();

const SCENE_LABEL: Record<SceneId, string> = {
  world: "Global", tenants: "Tenancy", region: "Region", platform: "Virto Commerce", heatmap: "Customization", incidents: "Reliability",
};

const crumbs = computed(() =>
  nav.path.map((p, i) => {
    let label = SCENE_LABEL[p.scene];
    if (p.scene === "region" && p.arg) {
      const r = data.model.regions.find((x) => x.id === p.arg);
      if (r) label = r.name;
    }
    return { label, last: i === nav.path.length - 1, index: i };
  }),
);
function onCrumb(c: { last: boolean; index: number }) { if (!c.last) jumpTo(c.index); }

// Bottom legend shows only groups relevant to the active scene.
const legend = computed(() => ({
  status: current.value.scene !== "heatmap" && current.value.scene !== "incidents",
  tier: ["region", "platform", "tenants"].includes(current.value.scene),
  hosting: current.value.scene === "world",
  heat: current.value.scene === "heatmap",
}));

// Port of applyStatus health pill.
const healthText = computed(() => {
  const states = Object.values(status.byComponent).map((s) => s.state);
  const down = states.filter((s) => s === "down").length;
  const deg = states.filter((s) => s === "degraded").length;
  if (down) return `${down} service${down > 1 ? "s" : ""} down`;
  if (deg) return `${deg} service${deg > 1 ? "s" : ""} degraded`;
  return "All systems operational";
});
const pulseColor = computed(() =>
  overall.value === "down" ? "var(--down)" : overall.value === "degraded" ? "var(--warn)" : "var(--ok)",
);
</script>
