import { reactive, readonly } from "vue";

export interface InfoContent { kic: string; title: string; subtitle: string; bodyHtml: string; }

const state = reactive<InfoContent>({ kic: "● Overview", title: "Solution Architecture Map", subtitle: "", bodyHtml: "" });

export function useInfoPanel() {
  function setInfo(content: InfoContent) { Object.assign(state, content); }
  return { info: readonly(state), setInfo };
}
