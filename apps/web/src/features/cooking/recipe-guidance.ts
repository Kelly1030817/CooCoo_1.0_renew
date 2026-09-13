import type { GuidanceMode, RecipeStep } from "@coocoo/contracts";

export function instructionForMode(step: RecipeStep, mode: GuidanceMode) {
  return mode === "compact" ? step.compactInstruction?.trim() || step.instruction : step.instruction;
}

export function toggledGuidanceMode(mode: GuidanceMode): GuidanceMode {
  return mode === "detailed" ? "compact" : "detailed";
}
