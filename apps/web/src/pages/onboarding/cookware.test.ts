import { describe, expect, test } from "vitest";
import { getCustomCookware, setCustomCookwareName } from "./cookware";

describe("custom onboarding cookware", () => {
  test("adds one custom appliance without replacing known cookware", () => {
    const cookware = setCustomCookwareName(
      [{ type: "電磁爐", limitations: [] }],
      "多功能快煮鍋",
    );

    expect(cookware).toEqual([
      { type: "電磁爐", limitations: [] },
      { type: "多功能快煮鍋", limitations: [] },
    ]);
    expect(getCustomCookware(cookware)?.type).toBe("多功能快煮鍋");
  });

  test("replaces the previous custom appliance and removes blank input", () => {
    const initial = [
      { type: "電鍋", limitations: [] },
      { type: "卡式爐", limitations: [] },
    ];

    expect(setCustomCookwareName(initial, "蒸煮盒")).toEqual([
      { type: "電鍋", limitations: [] },
      { type: "蒸煮盒", limitations: [] },
    ]);
    expect(setCustomCookwareName(initial, "  ")).toEqual([
      { type: "電鍋", limitations: [] },
    ]);
  });
});
