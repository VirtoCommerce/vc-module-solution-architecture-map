import { ref } from "vue";

export type PlatformView = "arch" | "xapi";

// Module-level singleton so the "See the XAPI request flow" CTA (raised from a node
// info panel on any scene) can drive PlatformScene's active sub-view.
const view = ref<PlatformView>("arch");

export function usePlatformView() {
  function setView(v: PlatformView) {
    view.value = v;
  }
  return { view, setView };
}
