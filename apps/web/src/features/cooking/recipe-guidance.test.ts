import { describe, expect, test } from "bun:test";
import type { RecipeStep } from "@coocoo/contracts";
import { instructionForMode, toggledGuidanceMode } from "./recipe-guidance";

const step: RecipeStep = {
  id: "step-1",
  order: 1,
  instruction: "雞胸肉煮 10 分鐘，以食物溫度計確認最厚處至少 74°C，再取出撕絲。",
  compactInstruction: "雞胸肉煮 10 分鐘，最厚處達 74°C 後撕絲。",
  guidance: { successCue: "最厚處至少 74°C。", why: "中心溫度是可靠熟度依據。", rescueTip: "未達溫時每次加熱 1 分鐘。" },
  voiceText: "雞胸肉煮熟後撕絲。",
  timerSeconds: 600,
  safetyNote: "不可只靠顏色判斷熟度。",
};

describe("recipe guidance modes", () => {
  test("uses two presentations without changing the canonical step", () => {
    expect(instructionForMode(step, "detailed")).toBe(step.instruction);
    expect(instructionForMode(step, "compact")).toBe(step.compactInstruction);
    expect(step.timerSeconds).toBe(600);
    expect(step.safetyNote).toContain("不可只靠顏色");
  });

  test("keeps legacy recipes usable when compact copy is absent", () => {
    expect(instructionForMode({ ...step, compactInstruction: undefined }, "compact")).toBe(step.instruction);
  });

  test("switches only the presentation mode", () => {
    expect(toggledGuidanceMode("detailed")).toBe("compact");
    expect(toggledGuidanceMode("compact")).toBe("detailed");
  });
});
