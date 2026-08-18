import { computed, reactive, readonly } from "vue";
import { getMetrics } from "../api/client";
import { mockMetrics } from "../api/mock";
import type { MetricKey, MetricsResult } from "../api/types";

export type TimeMode = "sim" | "live";

const state = reactive({
  mode: "live" as TimeMode, // "live" (default) = real UTC now, 1s clock · "sim" = animated 24h day
  minute: 600, // simulated minute-of-day 0..1439 (sim starts 10:00 like the prototype)
  playing: false,
  speed: 180, // simulated minutes per real second
  metric: "requests" as MetricKey,
  series: {} as Partial<Record<MetricKey, MetricsResult>>,
  usedFallback: false,
  liveSeconds: 0, // seconds component of the live clock (updated each live tick)
});

let rafId: number | null = null;
let lastTs: number | null = null;
let booted = false;
let liveTimer: ReturnType<typeof setInterval> | null = null;
let liveDay = ""; // UTC date the current series was fetched for (live mode re-fetches on day change)

function tick(ts: number) {
  if (lastTs == null) lastTs = ts;
  const dt = (ts - lastTs) / 1000;
  lastTs = ts;
  state.minute = (state.minute + state.speed * dt) % 1440;
  rafId = state.playing ? requestAnimationFrame(tick) : null;
}

/** Live tick (every 1s): clock = real UTC now; series re-fetched when the UTC day rolls over. */
function liveTick() {
  const now = new Date();
  state.minute = now.getUTCHours() * 60 + now.getUTCMinutes();
  state.liveSeconds = now.getUTCSeconds();
  const day = now.toISOString().slice(0, 10);
  if (liveDay && day !== liveDay) {
    liveDay = day;
    for (const key of Object.keys(state.series) as MetricKey[]) {
      delete state.series[key];
      delete inflight[key];
      void ensureSeries(key);
    }
  }
  liveDay = day;
}

/** Current display mode — consumed by useStatus to speed up polling in live mode. */
export function getTimeMode(): TimeMode {
  return state.mode;
}

const inflight: Partial<Record<MetricKey, Promise<void>>> = {};
async function ensureSeries(metric: MetricKey) {
  if (state.series[metric]) return;
  if (!inflight[metric]) {
    inflight[metric] = getMetrics(metric)
      .catch(() => {
        state.usedFallback = true;
        return mockMetrics(metric);
      })
      .then((r) => {
        state.series[metric] = r;
      });
  }
  return inflight[metric];
}

export function useTimeEngine() {
  // The world KPI row shows all four metrics at once, so every series must be loaded
  // (globalAt returns 0 for an unloaded metric). Preload all; each falls back independently.
  const ALL_METRICS: MetricKey[] = ["requests", "users", "orders", "instances"];
  for (const m of ALL_METRICS) void ensureSeries(m);

  function setPlaying(p: boolean) {
    state.playing = p;
    if (p && rafId == null) {
      lastTs = null;
      rafId = requestAnimationFrame(tick);
    }
    if (!p && rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }
  // Boot the default mode once (Live by default: real UTC clock, 1s tick).
  if (!booted) {
    booted = true;
    if (state.mode === "live") {
      liveTick();
      if (liveTimer == null) liveTimer = setInterval(liveTick, 1000);
    } else if (state.playing) {
      setPlaying(true);
    }
  }

  function setMetric(m: MetricKey) {
    state.metric = m;
    void ensureSeries(m);
  }
  function setSpeed(s: number) {
    state.speed = s;
  }
  function scrub(minute: number) {
    state.minute = minute;
    setPlaying(false);
  }

  /** Switch between the animated 24h simulation and real-time live display. */
  function setMode(mode: TimeMode) {
    if (state.mode === mode) return;
    state.mode = mode;
    if (mode === "live") {
      setPlaying(false); // stop the RAF sim
      liveTick(); // snap to now immediately…
      liveTimer = setInterval(liveTick, 1000); // …clock ticks every second (data polls every 5 s — useStatus)
    } else {
      if (liveTimer != null) {
        clearInterval(liveTimer);
        liveTimer = null;
      }
      state.minute = 600; // sim restarts at 10:00, playing (prototype behavior)
      setPlaying(true);
    }
  }

  /** Linear interpolation over the fetched 24h series at the simulated minute-of-day. */
  function valueAt(regionId: string, metric: MetricKey = state.metric, minute = state.minute): number {
    const s = state.series[metric]?.series.find((x) => x.regionId === regionId);
    if (!s || s.points.length < 2) return 0;
    const n = s.points.length; // covers 24h inclusive
    const pos = (minute / 1440) * (n - 1);
    const i = Math.min(Math.floor(pos), n - 2);
    const frac = pos - i;
    return s.points[i].value * (1 - frac) + s.points[i + 1].value * frac;
  }

  /** Sum across regions (KPIs). */
  function globalAt(metric: MetricKey = state.metric, minute = state.minute): number {
    const res = state.series[metric];
    if (!res) return 0;
    return res.series.reduce((sum, s) => sum + valueAt(s.regionId, metric, minute), 0);
  }

  /** Cumulative day total for the 'orders' KPI (integrates the rate series). */
  const ordersToday = computed(() => {
    let acc = 0;
    for (let m = 0; m <= state.minute; m += 5) acc += globalAt("orders", m) * 5;
    return acc;
  });

  const clock = computed(() => {
    const h = String(Math.floor(state.minute / 60)).padStart(2, "0");
    const m = String(Math.floor(state.minute % 60)).padStart(2, "0");
    if (state.mode === "live") {
      return `${h}:${m}:${String(state.liveSeconds).padStart(2, "0")}`;
    }
    return `${h}:${m}`;
  });

  return { time: readonly(state), clock, ordersToday, setPlaying, setMetric, setSpeed, setMode, scrub, valueAt, globalAt };
}
