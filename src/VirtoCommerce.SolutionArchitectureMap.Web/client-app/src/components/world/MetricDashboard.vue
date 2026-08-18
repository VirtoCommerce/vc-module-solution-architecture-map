<template>
  <div class="world-dash">
    <div class="time-ctrl">
      <div class="spd" id="modeToggle">
        <button :class="{ on: time.mode === 'live' }" @click="setMode('live')">
          <span v-if="time.mode === 'live'" class="live-dot"></span>Live
        </button>
        <button :class="{ on: time.mode === 'sim' }" @click="setMode('sim')">24h simulation</button>
      </div>
      <!-- visibility (not v-if) keeps the row layout identical in both modes — no width jump -->
      <button class="play" id="playBtn" aria-label="Play / pause"
        :style="time.mode === 'live' ? 'visibility:hidden' : ''" @click="setPlaying(!time.playing)">
        {{ time.playing ? "❚❚" : "▶" }}
      </button>
      <div class="timeline-wrap">
        <div class="timeline">
          <svg id="dayChart" viewBox="0 0 1000 56" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#FF3355" stop-opacity="0.55" />
                <stop offset="100%" stop-color="#FF3355" stop-opacity="0.02" />
              </linearGradient>
            </defs>
            <path id="chartArea" :d="chart.area" /><path id="chartLine" :d="chart.line" />
            <line id="playhead" :x1="playX" y1="0" :x2="playX" y2="56" />
            <circle id="playdot" :cx="playX" :cy="playY" r="3.5" />
          </svg>
          <input type="range" id="scrub" min="0" max="1439" step="1" :value="Math.floor(time.minute)"
            :style="time.mode === 'live' ? 'visibility:hidden' : ''" @input="onScrub" />
        </div>
        <div class="hour-labels"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span></div>
      </div>
      <div class="clock">
        <span class="t" id="clock">{{ clock }}</span>
        <span class="z">{{ time.mode === "live" ? "UTC · LIVE" : "UTC" }}</span>
      </div>
      <div class="spd" id="spd" :style="time.mode === 'live' ? 'visibility:hidden' : ''">
        <button v-for="s in speeds" :key="s.v" :data-spd="s.v" :class="{ on: time.speed === s.v }" @click="setSpeed(s.v)">{{ s.label }}</button>
      </div>
    </div>
    <div class="kpi-row" id="kpiRow">
      <div class="kpi req" :class="{ active: time.metric === 'requests' }" data-kpi="requests">
        <span class="ic">⚡</span>
        <div><div class="v" id="kpiReq">{{ kpi.req }}</div><div class="l">Requests / sec</div></div>
        <span :class="trends.req.cls" id="trReq">{{ trends.req.txt }}</span>
      </div>
      <div class="kpi usr" :class="{ active: time.metric === 'users' }" data-kpi="users">
        <span class="ic">👤</span>
        <div><div class="v" id="kpiUsr">{{ kpi.usr }}</div><div class="l">Active users</div></div>
        <span :class="trends.usr.cls" id="trUsr">{{ trends.usr.txt }}</span>
      </div>
      <div class="kpi ord" :class="{ active: time.metric === 'orders' }" data-kpi="orders">
        <span class="ic">🛒</span>
        <div><div class="v" id="kpiOrd">{{ kpi.ord }}</div><div class="l">New orders / 24h</div></div>
        <span :class="trends.ord.cls" id="trOrd">{{ trends.ord.txt }}</span>
      </div>
      <div class="kpi inst" :class="{ active: time.metric === 'instances' }" data-kpi="instances">
        <span class="ic">▦</span>
        <div><div class="v" id="kpiInst">{{ kpi.inst }}</div><div class="l">Running instances (AKS)</div></div>
        <span :class="trends.inst.cls" id="trInst">{{ trends.inst.txt }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useTimeEngine } from "../../composables/useTimeEngine";
import { fmt } from "../../data/format";
import type { MetricKey } from "../../api/types";

const { time, clock, ordersToday, setPlaying, setSpeed, setMode, scrub, globalAt } = useTimeEngine();

const speeds = [{ v: 60, label: "1×" }, { v: 180, label: "3×" }, { v: 600, label: "10×" }];
const W = 1000, H = 56;
const X = (min: number) => (min / 1440) * W;

function onScrub(e: Event) { scrub(Number((e.target as HTMLInputElement).value)); }

// Port of buildDayChart: sample the current metric across the day (every 30 min).
const chart = computed(() => {
  const m = time.metric;
  const pts: [number, number][] = [];
  for (let i = 0; i <= 48; i++) { const min = i * 30; pts.push([min, globalAt(m, min)]); }
  const max = Math.max(...pts.map((p) => p[1])) || 1;
  const Y = (v: number) => H - 3 - (v / max) * (H - 9);
  let d = "M" + X(0).toFixed(1) + "," + Y(pts[0][1]).toFixed(1);
  pts.forEach((p) => { d += "L" + X(p[0]).toFixed(1) + "," + Y(p[1]).toFixed(1); });
  return { line: d, area: d + `L${W},${H}L0,${H}Z`, max };
});

const playX = computed(() => X(time.minute));
const playY = computed(() => H - 3 - (globalAt(time.metric, time.minute) / chart.value.max) * (H - 9));

const kpi = computed(() => ({
  req: fmt(globalAt("requests")),
  usr: fmt(globalAt("users")),
  ord: fmt(ordersToday.value),
  inst: String(Math.round(globalAt("instances"))),
}));

// Port of setTrend: compare current vs 30 min earlier (wrapped).
function trend(m: MetricKey) {
  const delta = globalAt(m) - globalAt(m, (time.minute - 30 + 1440) % 1440);
  if (Math.abs(delta) < 1) return { txt: "▬", cls: "trend" };
  return delta > 0 ? { txt: "▲", cls: "trend up" } : { txt: "▼", cls: "trend down" };
}
const trends = computed(() => ({
  req: trend("requests"), usr: trend("users"), ord: trend("orders"), inst: trend("instances"),
}));
</script>
