<template>
  <section class="scene active" data-scene="incidents">
    <div class="rel">
    <div class="scene-head">
      <div>
        <div class="eyebrow">Reliability &amp; incidents · a live view for {{ customer }}</div>
        <h2 v-if="activeIncidents.length">{{ activeIncidents.length }} active incident{{ activeIncidents.length > 1 ? "s" : "" }} — <span class="accent">we're on it</span></h2>
        <h2 v-else>All systems <span class="accent">operational</span></h2>
        <p class="lead">{{ leadText }}</p>
      </div>
    </div>

    <!-- ===== Active incidents (there may be several) ===== -->
    <div v-for="(inc, idx) in activeIncidents" :key="idx" class="incident" :style="sevVars(inc.severity)">
      <div class="head">
        <div class="body">
          <span class="sev">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            {{ sevLabel(inc.severity) }} · {{ stageLabel(inc.stage) }}
          </span>
          <h3>{{ inc.title }}</h3>
          <div class="meta">
            <span>Started <b>{{ inc.started }}</b> · {{ inc.ago }}</span>
            <span>Scope <b>{{ inc.region }}</b></span>
            <span>Affected <b>{{ inc.affected }}</b></span>
            <span class="nxt">Next update {{ inc.nextUpdate }}</span>
          </div>
          <ol class="stepper">
            <li v-for="(s, i) in STAGES" :key="s.id"
              :class="{ done: i < stageIndex(inc), active: i === stageIndex(inc) }">{{ s.label }}</li>
          </ol>
        </div>
      </div>
      <div class="impact">
        <div class="box"><div class="t">What this means for you</div><p>{{ inc.impact }}</p></div>
        <div class="box"><div class="t">What we're doing</div><p>{{ inc.doing }}</p></div>
      </div>
      <div class="log">
        <div class="lh">Updates</div>
        <div v-for="(u, i) in inc.updates" :key="i" class="upd" :class="{ now: u.now }">
          <div class="tm">{{ u.time }}</div>
          <div class="c"><div class="st">{{ u.stage }}</div><p>{{ u.text }}</p></div>
        </div>
      </div>
    </div>

    <!-- ===== Business metrics ===== -->
    <div class="sub-head">Business metrics <span>· rolling 90-day view we review with you</span></div>
    <div class="metrics">
      <div v-for="k in metrics.kpis" :key="k.key" class="metric">
        <div class="k">{{ k.key }}</div>
        <div class="v">{{ k.value }}<small v-if="k.unit">{{ k.unit }}</small></div>
        <div class="foot">
          <span v-if="k.trend" class="trend" :class="k.trend">{{ k.trendText }}</span>
          <span class="sub">{{ k.sub }}</span>
        </div>
      </div>
    </div>

    <!-- ===== Reliability trends ===== -->
    <div class="sub-head">Reliability trends <span>· the direction of travel</span></div>
    <div class="trends">
      <div class="panel">
        <div class="ph"><h4>Incidents per month</h4><span>6-month view</span></div>
        <div class="bars">
          <div v-for="m in metrics.incidentsPerMonth" :key="m.month" class="col" :title="`${m.count} in ${m.month}`">
            <div class="val">{{ m.count }}</div>
            <div class="bar" :style="{ height: (m.count / maxInc * 100 || 3) + '%' }"></div>
            <div class="cap">{{ m.month }}</div>
          </div>
        </div>
      </div>
      <div class="panel">
        <div class="ph"><h4>Mean time to resolve</h4><span v-if="metrics.mttrTrend.length">now {{ fmtMin(metrics.mttrTrend[metrics.mttrTrend.length - 1]) }} · ↓ improving</span></div>
        <svg class="mttr" viewBox="0 0 560 172" v-html="mttrSvg" role="img" aria-label="Mean time to resolve, trending down over 6 months"></svg>
      </div>
    </div>

    <!-- ===== History ===== -->
    <div class="sub-head">Incident history <span>· resolved incidents, plain-language summaries</span></div>
    <div class="filters">
      <button v-for="f in FILTERS" :key="f.id" :class="{ on: filter === f.id }" @click="setFilter(f.id)">{{ f.label }}</button>
    </div>
    <div class="hist">
      <div v-for="(h, i) in history" :key="i" class="hrow" :class="{ open: open === i }" :style="sevVars(h.severity)">
        <button class="top" @click="open = open === i ? -1 : i">
          <span class="date"><b>{{ dayNum(h.date) }} {{ monthOf(h.date) }}</b>{{ yearOf(h.date) }}</span>
          <span class="ti">{{ h.title }}<span class="cause">{{ h.cause }}</span></span>
          <span class="rt">
            <span class="chip">{{ sevLabel(h.severity) }}</span>
            <span class="dur">{{ h.duration }}</span>
            <svg class="caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M9 6l6 6-6 6"/></svg>
          </span>
        </button>
        <div class="detail">
          <div class="inner">
            <div class="f"><div class="t">Scope</div><p>{{ h.region }}</p></div>
            <div class="f"><div class="t">Estimated affected</div><p>{{ h.affected }}</p></div>
            <div class="f"><div class="t">Detected by</div><p>{{ h.detected }}</p></div>
            <div class="f wide"><div class="t">Customer impact</div><p>{{ h.impact }}</p></div>
            <a v-if="h.postmortemUrl" class="pm" :href="h.postmortemUrl" target="_blank" rel="noopener noreferrer">
              View postmortem summary
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M17 7H8M17 7v9"/></svg>
            </a>
          </div>
        </div>
      </div>
    </div>
    <button v-if="history.length < historyTotal" class="loadmore" @click="loadMore">
      Load more · {{ history.length }} of {{ historyTotal }}
    </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useSolutionData } from "../../composables/useSolutionData";
import { useIncidents } from "../../composables/useIncidents";
import { getIncidentHistory } from "../../api/client";
import {
  STAGES, SEVERITY_LABEL,
  type Severity, type IncidentStage, type ActiveIncident, type HistoryIncident,
} from "../../api/incidents";

const sol = useSolutionData();
const customer = computed(() => sol.model.project.customer.title);

// Active incidents (several possible, gated to Extra Large) + business metrics.
const { activeIncidents, metrics } = useIncidents();
function stageIndex(inc: ActiveIncident) { return STAGES.findIndex((s) => s.id === inc.stage); }

const leadText = computed(() => {
  const n = activeIncidents.value.length;
  if (n === 0) return "No active incidents. All services are running normally across every region.";
  if (n === 1) {
    const a = activeIncidents.value[0];
    return `${a.title} · ${a.region} · started ${a.started}. Everything else is operating normally.`;
  }
  return `${n} incidents are being worked on. Everything else is operating normally.`;
});

const SEV_COLOR: Record<Severity, string> = {
  sev1: "var(--down)", sev2: "var(--warn)", sev3: "var(--gold)", maint: "var(--vc-blue)",
};
const SEV_SOFT: Record<Severity, string> = {
  sev1: "rgba(239,68,68,.15)", sev2: "rgba(245,165,36,.15)", sev3: "rgba(251,191,36,.15)", maint: "rgba(43,127,255,.15)",
};
function sevVars(s: Severity) { return { "--sev": SEV_COLOR[s], "--sev-soft": SEV_SOFT[s] }; }
function sevLabel(s: Severity) { return SEVERITY_LABEL[s]; }
function stageLabel(s: IncidentStage) { return STAGES.find((x) => x.id === s)?.label ?? s; }
function fmtMin(m: number) { const h = Math.floor(m / 60), mm = m % 60; return h ? `${h}h ${mm}m` : `${mm}m`; }

// ── History: filtered + paginated straight from the service ──
const FILTERS = [
  { id: "all", label: "All" },
  { id: "sev", label: "Sev-1 / Sev-2" },
  { id: "maint", label: "Maintenance" },
] as const;
const PAGE = 20;
const filter = ref<string>("all");
const open = ref<number>(-1);
const history = ref<HistoryIncident[]>([]);
const historyTotal = ref(0);

function severitiesFor(f: string): string[] {
  if (f === "sev") return ["sev1", "sev2"];
  if (f === "maint") return ["maint"];
  return [];
}
async function loadHistory(reset: boolean) {
  const skip = reset ? 0 : history.value.length;
  const res = await getIncidentHistory({ severities: severitiesFor(filter.value), skip, take: PAGE });
  history.value = reset ? res.results : [...history.value, ...res.results];
  historyTotal.value = res.totalCount;
  if (reset) open.value = -1;
}
function setFilter(id: string) { if (filter.value === id) return; filter.value = id; void loadHistory(true); }
function loadMore() { void loadHistory(false); }
void loadHistory(true); // initial page

// Date helpers ("Jun 10, 2026").
function monthOf(d: string) { return d.split(" ")[0]; }
function dayNum(d: string) { return d.split(" ")[1].replace(",", ""); }
function yearOf(d: string) { return d.split(", ")[1]; }

const maxInc = computed(() => Math.max(...metrics.value.incidentsPerMonth.map((m) => m.count), 1));

// MTTR trend (SVG string; green = good/improving). Uniform scaling so dots stay
// circular; padded plot area + month labels + an emphasized final point.
const mttrSvg = computed(() => {
  const v = metrics.value.mttrTrend;
  if (v.length < 2) return "";
  const months = metrics.value.incidentsPerMonth.map((m) => m.month);
  const W = 560, H = 172, L = 20, R = 20, T = 24, B = 30;
  const min = Math.min(...v), max = Math.max(...v);
  const x = (i: number) => L + (i / (v.length - 1)) * (W - L - R);
  const y = (val: number) => T + (1 - (val - min) / (max - min || 1)) * (H - T - B);
  const baseY = H - B;
  const last = v.length - 1;
  const line = v.map((val, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(val).toFixed(1)).join(" ");
  const area = `M${x(0).toFixed(1)} ${baseY} ` + v.map((val, i) => "L" + x(i).toFixed(1) + " " + y(val).toFixed(1)).join(" ") + ` L${x(last).toFixed(1)} ${baseY} Z`;
  const grid = [0, 0.5, 1].map((f) => { const gy = (T + f * (H - T - B)).toFixed(1); return `<line x1="${L}" y1="${gy}" x2="${W - R}" y2="${gy}" stroke="var(--line)" stroke-width="1"/>`; }).join("");
  const dots = v.slice(0, -1).map((val, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(val).toFixed(1)}" r="3" fill="var(--ok)"/>`).join("");
  const ex = x(last).toFixed(1), ey = y(v[last]).toFixed(1);
  const endpoint = `<circle cx="${ex}" cy="${ey}" r="9" fill="var(--ok)" opacity="0.16"/>` +
    `<circle cx="${ex}" cy="${ey}" r="4.5" fill="var(--ok)" stroke="var(--panel)" stroke-width="2"/>` +
    `<text x="${ex}" y="${(y(v[last]) - 13).toFixed(1)}" text-anchor="end" font-size="12" font-weight="700" fill="var(--ok)">${fmtMin(v[last])}</text>`;
  const labels = months.map((m, i) => `<text x="${x(i).toFixed(1)}" y="${H - 9}" text-anchor="middle" font-size="11" fill="var(--muted-2)">${m}</text>`).join("");
  return `<defs><linearGradient id="mg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--ok)" stop-opacity=".22"/><stop offset="1" stop-color="var(--ok)" stop-opacity="0"/></linearGradient></defs>${grid}<path d="${area}" fill="url(#mg)"/><path d="${line}" fill="none" stroke="var(--ok)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>${dots}${endpoint}${labels}`;
});
</script>

<style scoped>
/* This scene is a scrolling document, not a fixed-viewport diagram: override the
   global flex .scene (which would shrink tall content) to a normal scrollable block. */
.scene[data-scene="incidents"] { display: block; }
.rel { max-width: 1180px; margin: 0 auto; padding-bottom: 44px; }
.accent { color: var(--gold); }
.loadmore { margin: 12px auto 0; display: block; font: inherit; font-size: 13px; font-weight: 600; color: var(--muted);
  background: var(--panel); border: 1px solid var(--line); border-radius: 9px; padding: 9px 18px; cursor: pointer; transition: .15s; }
.loadmore:hover { border-color: var(--gold); color: var(--text); }
.sub-head { display: flex; align-items: baseline; gap: 8px; margin: 26px 2px 12px; font-size: 14px; font-weight: 700; color: var(--text); }
.sub-head span { font-size: 12px; font-weight: 400; color: var(--muted); }

/* Active incident */
.incident { background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); overflow: hidden; }
.incident .head { padding: 20px 22px; border-left: 4px solid var(--sev); }
.sev { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; letter-spacing: .06em;
  text-transform: uppercase; padding: 4px 10px 4px 8px; border-radius: 999px; background: var(--sev-soft); color: var(--sev); }
.sev svg { width: 13px; height: 13px; }
.incident h3 { margin: 10px 0 0; font-size: 19px; font-weight: 700; color: var(--text); }
.meta { display: flex; flex-wrap: wrap; gap: 8px 18px; margin-top: 12px; font-size: 13px; color: var(--muted); }
.meta b { color: var(--text); font-weight: 600; }
.meta .nxt { color: var(--sev); font-weight: 600; }
.stepper { display: flex; margin: 18px 0 2px; padding: 0; list-style: none; }
.stepper li { flex: 1; position: relative; text-align: center; font-size: 11.5px; font-weight: 600; color: var(--muted-2); padding-top: 20px; }
.stepper li::before { content: ""; position: absolute; top: 6px; left: calc(-50% + 7px); width: calc(100% - 14px); height: 3px; border-radius: 3px; background: var(--line-2); }
.stepper li:first-child::before { display: none; }
.stepper li::after { content: ""; position: absolute; top: 0; left: calc(50% - 7px); width: 14px; height: 14px; border-radius: 50%; background: var(--panel); border: 2px solid var(--line-2); box-sizing: border-box; transition: .2s; }
.stepper li.done { color: var(--muted); }
.stepper li.done::before, .stepper li.active::before { background: var(--sev); }
.stepper li.done::after { background: var(--sev); border-color: var(--sev); }
.stepper li.active { color: var(--sev); }
.stepper li.active::after { background: var(--panel); border-color: var(--sev); border-width: 4px; box-shadow: 0 0 0 4px var(--sev-soft); }
.impact { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; padding: 4px 22px 6px; }
.impact .box { background: var(--panel-2); border: 1px solid var(--line); border-radius: 10px; padding: 13px 15px; }
.impact .box .t { font-size: 10.5px; letter-spacing: .07em; text-transform: uppercase; color: var(--muted-2); font-weight: 700; margin-bottom: 6px; }
.impact .box p { margin: 0; font-size: 13.5px; color: var(--text); line-height: 1.5; }
.log { border-top: 1px solid var(--line); margin-top: 14px; padding: 16px 22px 20px; }
.log .lh { font-size: 10.5px; letter-spacing: .07em; text-transform: uppercase; color: var(--muted-2); font-weight: 700; margin-bottom: 12px; }
.upd { display: grid; grid-template-columns: 68px 1fr; gap: 12px; padding-bottom: 14px; }
.upd:last-child { padding-bottom: 0; }
.upd .tm { font-size: 12px; color: var(--muted-2); font-variant-numeric: tabular-nums; text-align: right; padding-top: 1px; }
.upd .c { padding-left: 16px; position: relative; border-left: 2px solid var(--line); }
.upd:last-child .c { border-left-color: transparent; }
.upd .c::before { content: ""; position: absolute; left: -7px; top: 4px; width: 10px; height: 10px; border-radius: 50%; background: var(--panel); border: 2px solid var(--line); }
.upd.now .c::before { background: var(--sev); border-color: var(--sev); }
.upd .st { font-size: 10.5px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: var(--muted); }
.upd.now .st { color: var(--sev); }
.upd p { margin: 3px 0 0; font-size: 13.5px; color: var(--text); line-height: 1.5; }

/* Business-metric tiles (scene-scoped names to avoid the global .kpi flex rule). */
.metrics { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
.metric { display: flex; flex-direction: column; background: var(--panel); border: 1px solid var(--line);
  border-radius: 12px; padding: 15px 16px 14px; min-width: 0; }
.metric .k { font-size: 10.5px; letter-spacing: .05em; text-transform: uppercase; color: var(--muted-2); font-weight: 600; line-height: 1.35; min-height: 2.7em; }
.metric .v { font-size: 30px; font-weight: 800; letter-spacing: -.02em; line-height: 1; margin-top: 10px; color: var(--text); font-variant-numeric: tabular-nums; }
.metric .v small { font-size: 15px; font-weight: 700; color: var(--muted); margin-left: 2px; }
.metric .foot { display: flex; align-items: baseline; gap: 7px; margin-top: 11px; font-size: 11.5px; color: var(--muted); line-height: 1.4; flex-wrap: wrap; }
.metric .foot .sub { flex: 1; min-width: 0; }
.metric .trend { font-weight: 800; font-variant-numeric: tabular-nums; white-space: nowrap; padding: 2px 7px; border-radius: 999px; }
.metric .trend.good { color: var(--ok); background: rgba(34,197,94,.13); }
.metric .trend.bad { color: var(--down); background: rgba(239,68,68,.13); }
.metric .trend:empty { display: none; }

/* Trends */
.trends { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.panel { background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); padding: 16px 18px; }
.panel .ph { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 14px; }
.panel .ph h4 { margin: 0; font-size: 13px; font-weight: 700; color: var(--text); }
.panel .ph span { font-size: 12px; color: var(--muted-2); }
.bars { display: flex; align-items: flex-end; gap: 10px; height: 120px; }
.bars .col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; height: 100%; justify-content: flex-end; }
.bars .col .bar { width: 100%; max-width: 34px; background: var(--vc-blue); border-radius: 4px 4px 2px 2px; min-height: 3px; }
.bars .col .val { font-size: 11px; font-weight: 700; color: var(--muted); font-variant-numeric: tabular-nums; }
.bars .col .cap { font-size: 11px; color: var(--muted-2); font-variant-numeric: tabular-nums; }
.mttr { width: 100%; height: auto; display: block; }

/* Filters + history */
.filters { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.filters button { font: inherit; font-size: 12.5px; font-weight: 600; border: 1px solid var(--line); background: var(--panel);
  color: var(--muted); padding: 6px 12px; border-radius: 8px; cursor: pointer; }
.filters button.on { border-color: var(--gold); color: var(--text); }
.hist { display: flex; flex-direction: column; gap: 10px; }
.hrow { background: var(--panel); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
.hrow .top { width: 100%; text-align: left; background: transparent; border: 0; border-left: 4px solid var(--sev);
  display: grid; grid-template-columns: 104px 1fr auto; gap: 14px; align-items: center; padding: 14px 18px; cursor: pointer; font: inherit; }
.hrow .date { font-size: 12px; color: var(--muted-2); font-variant-numeric: tabular-nums; }
.hrow .date b { display: block; color: var(--text); font-size: 14px; font-weight: 700; }
.hrow .ti { font-weight: 600; font-size: 14.5px; color: var(--text); }
.hrow .ti .cause { display: block; font-weight: 400; color: var(--muted); font-size: 13px; margin-top: 3px; }
.hrow .rt { display: flex; align-items: center; gap: 10px; }
.chip { font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; padding: 3px 9px; border-radius: 999px; background: var(--sev-soft); color: var(--sev); white-space: nowrap; }
.dur { font-size: 12.5px; color: var(--muted); font-variant-numeric: tabular-nums; min-width: 58px; text-align: right; }
.caret { width: 16px; height: 16px; color: var(--muted-2); transition: transform .18s; }
.hrow.open .caret { transform: rotate(90deg); }
.hrow .detail { max-height: 0; overflow: hidden; transition: max-height .25s ease; }
.hrow.open .detail { max-height: 260px; }
.hrow .detail .inner { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px 16px; padding: 4px 18px 18px 22px; border-top: 1px solid var(--line); font-size: 13px; }
.hrow .detail .inner .f.wide { grid-column: 1 / -1; }
.hrow .detail .inner .t { font-size: 10px; letter-spacing: .07em; text-transform: uppercase; color: var(--muted-2); font-weight: 700; margin: 12px 0 4px; }
.hrow .detail .inner p { margin: 0; color: var(--text); line-height: 1.5; }
.hrow .detail .inner .pm { grid-column: 1 / -1; margin-top: 14px; display: inline-flex; align-items: center; gap: 6px;
  justify-self: start; font-size: 12.5px; font-weight: 600; color: var(--gold); text-decoration: none;
  border: 1px solid var(--line); border-radius: 8px; padding: 7px 12px; transition: .15s; }
.hrow .detail .inner .pm:hover { border-color: var(--gold); background: rgba(251,191,36,.08); }
.hrow .detail .inner .pm svg { width: 14px; height: 14px; }

@media (max-width: 1080px) { .metrics { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 900px) {
  .metrics { grid-template-columns: repeat(2, 1fr); }
  .trends, .impact { grid-template-columns: 1fr; }
  .hrow .top { grid-template-columns: 96px 1fr; }
  .hrow .rt { grid-column: 1 / -1; justify-content: flex-start; }
  .hrow .detail .inner { grid-template-columns: 1fr; }
}
</style>
