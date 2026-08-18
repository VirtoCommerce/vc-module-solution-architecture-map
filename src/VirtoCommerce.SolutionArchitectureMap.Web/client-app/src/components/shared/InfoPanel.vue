<template>
  <aside class="info" id="info">
    <div class="info-head">
      <span class="kic" id="infoKic">{{ info.kic }}</span>
      <h3 id="infoTitle">{{ info.title }}</h3>
      <div class="azure" id="infoAzure">{{ info.subtitle }}</div>
    </div>
    <!-- body is app-authored HTML only (never user/remote content) -->
    <div class="info-body" id="infoBody" @click="onBodyClick" v-html="info.bodyHtml"></div>
  </aside>
</template>

<script setup lang="ts">
import { useInfoPanel } from "../../composables/useInfoPanel";
import { useSceneNav, type SceneId } from "../../composables/useSceneNav";
import { usePlatformView, type PlatformView } from "../../composables/usePlatformView";

const { info } = useInfoPanel();
const { current, go } = useSceneNav();
const { setView } = usePlatformView();

// Event delegation for info-panel CTAs authored as [data-goscene] buttons.
// An optional [data-goview] drives PlatformScene's sub-view (e.g. the XAPI flow CTA).
function onBodyClick(e: MouseEvent) {
  const el = (e.target as HTMLElement).closest("[data-goscene]");
  if (!el) return;
  const scene = el.getAttribute("data-goscene") as SceneId;
  const gv = el.getAttribute("data-goview");
  if (gv === "arch" || gv === "xapi") setView(gv as PlatformView);
  if (current.value.scene !== scene) go(scene);
}
</script>
