import { useStatus } from "./useStatus";
import { useInfoPanel } from "./useInfoPanel";
import { NODE_CATALOG } from "../data/nodeCatalog";
import { escapeHtml } from "../data/escapeHtml";

// Port of the engine's statRows() + setInfoNode(): renders a node's live status,
// Azure service, description and tags into the info panel. Used by Region, Tenants
// and Platform scenes. All dynamic values escaped before entering the v-html sink.
export function useNodeInfo() {
  const { stateOf, latencyOf } = useStatus();
  const { setInfo } = useInfoPanel();

  function statRows(key: string): string {
    const st = stateOf(key);
    const lat = latencyOf(key);
    const latStr = lat == null ? "—" : `${lat} ms`;
    const nd = NODE_CATALOG[key];
    const azure = nd?.azure ? nd.azure.split("·")[0].trim() : "";
    return `<div class="kv">
      <div class="row"><span class="k">Status</span><span class="v ${escapeHtml(st)}">${escapeHtml(st.toUpperCase())}</span></div>
      <div class="row"><span class="k">Latency (p50)</span><span class="v">${escapeHtml(latStr)}</span></div>
      ${nd?.azure ? `<div class="row"><span class="k">Azure service</span><span class="v" style="color:var(--vc-cyan)">${escapeHtml(azure)}</span></div>` : ""}
    </div>`;
  }

  function showNode(key: string) {
    const nd = NODE_CATALOG[key];
    if (!nd) {
      setInfo({ kic: "● Component", title: key, subtitle: "", bodyHtml: statRows(key) });
      return;
    }
    let html = statRows(key);
    // nd.desc is an app-authored static literal (may contain <strong>) — intentionally not escaped.
    html += `<p>${nd.desc}</p>`;
    if (nd.tags) html += `<div class="tags">${nd.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>`;
    if (nd.link) {
      html += `<a class="drill-hint" href="${escapeHtml(nd.link)}" target="_blank" rel="noopener" style="text-decoration:none">Visit ${escapeHtml(nd.title)} ↗</a>`;
    }
    if (key === "xapi") {
      html += `<button class="drill-hint" data-goscene="platform" data-goview="xapi">See the XAPI request flow ›</button>`;
    }
    setInfo({ kic: "● Component", title: nd.title, subtitle: nd.azure ?? "", bodyHtml: html });
  }

  return { showNode };
}
