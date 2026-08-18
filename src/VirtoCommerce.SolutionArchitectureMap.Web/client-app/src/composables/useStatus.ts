import { computed, reactive, readonly } from "vue";
import { getStatus } from "../api/client";
import { getTimeMode } from "./useTimeEngine";
import type { ServiceStatusDto } from "../api/types";

const POLL_MS_SIM = 15_000;
const POLL_MS_LIVE = 5_000; // live mode reloads data every 5 s

const state = reactive({
  byComponent: {} as Record<string, ServiceStatusDto>,
  stale: false, // last poll failed → showing last-known (spec §10)
  started: false,
});

let lastPollAt = 0;

async function poll() {
  lastPollAt = Date.now();
  try {
    const res = await getStatus();
    for (const s of res.statuses) state.byComponent[s.componentId] = s;
    state.stale = false;
  } catch {
    state.stale = true; // keep last-known values
  }
}

/** Scheduler tick: poll cadence follows the display mode (5 s live · 15 s sim). */
function maybePoll() {
  const interval = getTimeMode() === "live" ? POLL_MS_LIVE : POLL_MS_SIM;
  if (Date.now() - lastPollAt >= interval) void poll();
}

export function useStatus() {
  if (!state.started) {
    state.started = true;
    void poll();
    setInterval(maybePoll, 1_000);
  }

  const overall = computed<"healthy" | "degraded" | "down">(() => {
    const states = Object.values(state.byComponent).map((s) => s.state);
    if (states.includes("down")) return "down";
    if (states.includes("degraded")) return "degraded";
    return "healthy";
  });

  const stateOf = (componentId: string) => state.byComponent[componentId]?.state ?? "healthy";
  const latencyOf = (componentId: string) => state.byComponent[componentId]?.latencyMs ?? null;

  return { status: readonly(state), overall, stateOf, latencyOf };
}
