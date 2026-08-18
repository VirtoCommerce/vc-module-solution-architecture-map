<template>
  <section class="scene active" data-scene="heatmap">
    <div class="scene-head">
      <div>
        <div class="eyebrow">Customization control · the 80 / 20 model</div>
        <h2>Customization <span class="accent">heat map</span> — standard vs tailored</h2>
        <p class="lead">Every component graded by how far it deviates from the hardened Virto base. <strong>Cool = common &amp; Virto-maintained</strong> (Virto Guarantee); <strong>hot = bespoke</strong> (you / {{ partnerName }}). Filter to isolate your customization surface; click any tile for ownership.</p>
      </div>
      <div class="ht-filter" id="htFilter">
        <button v-for="f in filters" :key="f.k" :data-filter="f.k" :class="{ on: filter === f.k }" @click="filter = f.k">{{ f.label }}</button>
      </div>
    </div>

    <div class="ht-summary" id="htSummary">
      <div class="ht-ratio">
        <div class="seg std" :style="{ flex: stdPct }"><span class="p">{{ stdPct }}%</span><span class="n">Standard base</span></div>
        <div class="seg tail" :style="{ flex: tailPct }"><span class="p">{{ tailPct }}%</span><span class="n">Tailored</span></div>
      </div>
      <div class="ht-sumtx"><b>{{ std }} of {{ total }} components</b> run on the hardened Virto base — maintained by Virto &amp; covered by the <b>Virto Guarantee</b>. <b>{{ tail }} are tailored</b> (extended or custom) — your controllable surface.</div>
    </div>

    <div class="diagram">
      <div class="ht-grid" id="htGrid">
        <div v-for="g in groups" :key="g.title" class="ht-panel">
          <div class="ht-panel-head">{{ g.title }}<span class="ht-count">{{ g.std }}/{{ g.items.length }} standard</span></div>
          <div class="ht-tiles">
            <button v-for="it in g.items" :key="it.id" v-show="tileVisible(it.level)"
              class="ht-tile" :class="[`lvl-${it.level}`, { sel: selectedId === it.id }]"
              :data-ht="it.id" :data-level="it.level" @click="selectTile(it, g.title)">
              <span class="ht-name">{{ it.name }}</span><span class="ht-badge">{{ HT_LEVELS[it.level].label }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="ht-legend" id="htLegend">
      <span v-for="l in HT_LEVELS" :key="l.label" class="it">
        <span class="sw" :style="{ background: l.color }"></span><span><b>{{ l.label }}</b> — {{ l.desc }}</span>
      </span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, watchEffect, ref } from "vue";
import { useSolutionData } from "../../composables/useSolutionData";
import { useInfoPanel } from "../../composables/useInfoPanel";
import { escapeHtml } from "../../data/escapeHtml";
import type { ComponentDto } from "../../api/types";

const data = useSolutionData();
const partnerName = computed(() => data.model.project.partner.name);
const { setInfo } = useInfoPanel();

const HT_LEVELS = [
  { label: "Standard", color: "#2B7FFF", desc: "Out-of-the-box Virto component. Maintained by Virto and covered by the Virto Guarantee." },
  { label: "Configured", color: "#38BDF8", desc: "Standard code adapted through configuration / settings only — still Virto-maintained." },
  { label: "Extended", color: "#F59E0B", desc: "Standard component extended with custom code or integration points. Shared responsibility." },
  { label: "Custom", color: "#FF6A3D", desc: "Bespoke build — owned and maintained by your implementation partner / you." },
];
const HT_OWNER = ["Virto", "Virto", "Virto + custom code", "Partner / custom"];

const filters = [
  { k: "all", label: "All" },
  { k: "custom", label: "Custom only" },
  { k: "standard", label: "Standard only" },
] as const;
type Filter = (typeof filters)[number]["k"];
const filter = ref<Filter>("all");

const selectedId = ref<string | null>(null);

function tailored(items: readonly ComponentDto[]) {
  return items.filter((i) => i.level >= 2).length;
}

const groups = computed(() => {
  const build = (title: string, group: "cloud" | "commerce") => {
    const items = data.customization.items.filter((i) => i.group === group);
    return { title, group, items, std: items.length - tailored(items) };
  };
  return [
    build("Virto Cloud · Infrastructure", "cloud"),
    build("Virto Commerce · Platform & Modules", "commerce"),
  ];
});

const allItems = computed(() => data.customization.items);
const total = computed(() => allItems.value.length);
const tail = computed(() => tailored(allItems.value));
const std = computed(() => total.value - tail.value);
const stdPct = computed(() => (total.value ? Math.round((std.value / total.value) * 100) : 0));
const tailPct = computed(() => 100 - stdPct.value);

function tileVisible(level: number) {
  return filter.value === "all" || (filter.value === "custom" && level >= 2) || (filter.value === "standard" && level <= 1);
}

// Port of selectHeatTile. All dynamic values escaped before entering the v-html sink.
function selectTile(it: ComponentDto, groupTitle: string) {
  selectedId.value = it.id;
  const lv = HT_LEVELS[it.level];
  const owner = it.owner || HT_OWNER[it.level];
  const bodyHtml = `
    <div class="kv">
      <div class="row"><span class="k">Customization</span><span class="v" style="color:${lv.color}">${escapeHtml(lv.label.toUpperCase())}</span></div>
      <div class="row"><span class="k">Owner</span><span class="v">${escapeHtml(owner)}</span></div>
      <div class="row"><span class="k">Support</span><span class="v" style="color:${it.level <= 1 ? "var(--ok)" : "var(--warn)"}">${it.level <= 1 ? "VIRTO GUARANTEE" : "TAILORED"}</span></div>
      ${it.version ? `<div class="row"><span class="k">Version</span><span class="v">${escapeHtml(it.version)}</span></div>` : ""}
    </div>
    <p>${it.note ? escapeHtml(it.note) : lv.desc}</p>
    <div class="info-cta">${it.level <= 1 ? "This is part of the <b>standard base</b> — Virto keeps it current and secure at no extra effort to you." : "This is <b>tailored</b> — track and version it as your own. When a customization recurs across clients, Virto can pull it into the standard base."}</div>`;
  setInfo({ kic: "● Component", title: it.name, subtitle: groupTitle, bodyHtml });
}

watchEffect(() => {
  // Port of setInfoOverview('heatmap'). Counts are numbers; body is otherwise static.
  setInfo({
    kic: "● Layer overview",
    title: "Customization heat map",
    subtitle: "Standard base vs tailored · 80 / 20",
    bodyHtml: `<p>A single inventory of <strong>what's standard vs what's tailored</strong> across Virto Cloud and Virto Commerce — so you always know your customization surface.</p>
      <div class="stat-mini">
        <div class="s"><div class="v">${std.value}</div><div class="l">Standard (Virto-maintained)</div></div>
        <div class="s"><div class="v">${tail.value}</div><div class="l">Tailored (your surface)</div></div>
      </div>
      <p><strong>Cool tiles</strong> are the hardened base — covered by the Virto Guarantee, kept current by Virto. <strong>Hot tiles</strong> are extended or custom (${escapeHtml(partnerName.value)}) — the parts you own and control.</p>
      <p style="color:var(--muted)">Use the filter to isolate <strong>Custom only</strong>, and click any tile for ownership &amp; support detail.</p>`,
  });
});
</script>
