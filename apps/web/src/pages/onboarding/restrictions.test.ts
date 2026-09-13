import { describe, expect, test } from "vitest";
import {
  addCustomRestriction,
  hasRestriction,
  restrictionQuickOptions,
  toggleRestriction,
} from "./restrictions";

describe("onboarding hard restriction quick picks", () => {
  test("adds and removes a quick restriction without changing other restrictions", () => {
    const peanut = restrictionQuickOptions[0];
    const custom = addCustomRestriction([], "香菜");
    const selected = toggleRestriction(custom, peanut);

    expect(hasRestriction(selected, peanut)).toBe(true);
    expect(selected).toHaveLength(2);
    expect(toggleRestriction(selected, peanut)).toEqual(custom);
  });

  test("trims custom restrictions and prevents duplicates", () => {
    const selected = addCustomRestriction([], "  香菜  ");
    expect(selected[0]).toMatchObject({ label: "香菜", isHardLimit: true });
    expect(addCustomRestriction(selected, "香菜")).toEqual(selected);
  });
});
