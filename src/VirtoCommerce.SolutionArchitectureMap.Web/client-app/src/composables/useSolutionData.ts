import { reactive, readonly } from "vue";
import { getCustomization, getModel } from "../api/client";
import { mockCustomization, mockModel } from "../api/mock";
import type { CustomizationResult, SolutionMapModel } from "../api/types";

interface State {
  loaded: boolean;
  usedFallback: boolean;
  model: SolutionMapModel;
  customization: CustomizationResult;
}

// Module-level singleton: every component sees the same reactive solution data.
const state = reactive<State>({
  loaded: false,
  usedFallback: false,
  model: structuredClone(mockModel),
  customization: structuredClone(mockCustomization),
});

let loadPromise: Promise<void> | null = null;

export function useSolutionData() {
  if (!loadPromise) {
    loadPromise = (async () => {
      const [model, customization] = await Promise.all([
        getModel().catch(() => { state.usedFallback = true; return structuredClone(mockModel); }),
        getCustomization().catch(() => { state.usedFallback = true; return structuredClone(mockCustomization); }),
      ]);
      state.model = model;
      state.customization = customization;
      state.loaded = true;
    })();
  }
  return readonly(state);
}
