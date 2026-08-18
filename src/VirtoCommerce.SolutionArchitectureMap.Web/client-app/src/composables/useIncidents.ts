import { computed, reactive } from "vue";
import { getActiveIncidents, getBusinessMetrics } from "../api/client";
import { emptyMetrics, regionHealthFromIncidents, type ActiveIncident, type BusinessMetrics } from "../api/incidents";
import { useSolutionData } from "./useSolutionData";

// Reliability & incidents state, loaded from the backend IIncidentsProvider:
//   active  → GET /incidents/active   (there may be several)
//   metrics → GET /incidents/metrics
// (History is paged/filtered per-view — see the scene's own fetch.)
// Standalone dev / demo mode fall back to the bundled mocks. Loaded once, shared.
//
// Active incidents belong to the Extra Large reference scenario, so they are only
// surfaced for that customer — other demo presets (Small, Medium, Large) show
// "all clear". Region health (orange/red) and the toolbar badge follow suit.
const state = reactive<{ active: ActiveIncident[]; metrics: BusinessMetrics }>({
  active: [],
  metrics: structuredClone(emptyMetrics),
});
let loaded = false;

function ensureLoaded() {
  if (loaded) return;
  loaded = true;
  getActiveIncidents().then((r) => { state.active = r.items; }).catch(() => { /* all clear */ });
  getBusinessMetrics().then((m) => Object.assign(state.metrics, m)).catch(() => { /* keep empty */ });
}

export function useIncidents() {
  ensureLoaded();
  const sol = useSolutionData();
  const isExtraLarge = computed(() => sol.model.project.customer.title === "Extra Large");

  /** Active incidents, gated to the Extra Large reference scenario. */
  const activeIncidents = computed<ActiveIncident[]>(() => (isExtraLarge.value ? state.active : []));
  const hasActive = computed(() => activeIncidents.value.length > 0);
  const metrics = computed(() => state.metrics);
  /** regionId → derived health (degraded/down) from the active incidents. */
  const regionHealth = computed(() => regionHealthFromIncidents(activeIncidents.value));
  return { activeIncidents, hasActive, metrics, regionHealth };
}
