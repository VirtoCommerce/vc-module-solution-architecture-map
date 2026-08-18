import { computed, reactive, readonly, watch } from "vue";

export type SceneId = "world" | "tenants" | "region" | "platform" | "heatmap" | "incidents";
export interface SceneEntry {
  scene: SceneId;
  arg?: string;
}

const VALID: SceneId[] = ["world", "tenants", "region", "platform", "heatmap", "incidents"];

/** Build the initial nav path from the URL (?view=…&region=…) so links are shareable. */
function readInitialPath(): SceneEntry[] {
  if (typeof window === "undefined") return [{ scene: "world" }];
  const p = new URLSearchParams(window.location.search);
  const view = p.get("view") as SceneId | null;
  if (!view || !VALID.includes(view) || view === "world") return [{ scene: "world" }];
  if (view === "region") {
    const region = p.get("region") ?? undefined;
    return [{ scene: "world" }, { scene: "region", arg: region }];
  }
  // Top-level side views (tenancy/platform/customization/reliability) hang off Global.
  return [{ scene: "world" }, { scene: view }];
}

const state = reactive({ path: readInitialPath() as SceneEntry[] });

/** Reflect the current scene in the query string (preserving other params, e.g. ?demo=). */
function syncUrl() {
  if (typeof window === "undefined") return;
  const cur = state.path[state.path.length - 1];
  const p = new URLSearchParams(window.location.search);
  if (cur.scene === "world") {
    p.delete("view");
    p.delete("region");
  } else {
    p.set("view", cur.scene);
    if (cur.scene === "region" && cur.arg) p.set("region", cur.arg);
    else p.delete("region");
  }
  const qs = p.toString();
  window.history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : "") + window.location.hash);
}

if (typeof window !== "undefined") {
  watch(() => state.path.map((e) => e.scene + (e.arg ? ":" + e.arg : "")).join(">"), syncUrl, { immediate: true });
}

export function useSceneNav() {
  const current = computed(() => state.path[state.path.length - 1]);

  function go(scene: SceneId, arg?: string) {
    const c = state.path[state.path.length - 1];
    if (c.scene === scene && c.arg === arg) return; // no duplicate consecutive crumb
    state.path.push({ scene, arg });
  }
  /** Navigate to a top-level side view (Reliability, Customization…): exactly one crumb
      under Global, and idempotent — repeated clicks don't stack breadcrumbs. */
  function goView(scene: SceneId) {
    const c = state.path[state.path.length - 1];
    if (c.scene === scene && !c.arg) return;
    state.path = scene === "world" ? [{ scene: "world" }] : [{ scene: "world" }, { scene }];
  }
  function back() {
    if (state.path.length > 1) state.path.pop();
  }
  function jumpTo(index: number) {
    state.path = state.path.slice(0, index + 1);
  }
  function reset(scene: SceneId = "world") {
    state.path = [{ scene }];
  }

  return { nav: readonly(state), current, go, goView, back, jumpTo, reset };
}
