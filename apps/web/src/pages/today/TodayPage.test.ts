import { describe, expect, test } from "bun:test";
import { shouldAutoSwitchToPurchase } from "./recommendationMode";

describe("Today recommendation mode", () => {
  test("shows small-purchase candidates only when inventory has no eligible recipe", () => {
    expect(shouldAutoSwitchToPurchase({
      hasDecision: true,
      inventoryRecipeCount: 0,
      purchaseRecipeCount: 2,
      hasAutoSwitched: false,
      ticketMode: "fridge",
    })).toBeTrue();
  });

  test("does not override a user choice or switch without candidates", () => {
    expect(shouldAutoSwitchToPurchase({
      hasDecision: true,
      inventoryRecipeCount: 0,
      purchaseRecipeCount: 2,
      hasAutoSwitched: true,
      ticketMode: "fridge",
    })).toBeFalse();
    expect(shouldAutoSwitchToPurchase({
      hasDecision: true,
      inventoryRecipeCount: 0,
      purchaseRecipeCount: 0,
      hasAutoSwitched: false,
      ticketMode: "fridge",
    })).toBeFalse();
  });
});
