export function shouldAutoSwitchToPurchase(input: {
  hasDecision: boolean;
  inventoryRecipeCount: number;
  purchaseRecipeCount: number;
  hasAutoSwitched: boolean;
  ticketMode: "fridge" | "purchase";
}) {
  return input.hasDecision &&
    input.inventoryRecipeCount === 0 &&
    input.purchaseRecipeCount > 0 &&
    !input.hasAutoSwitched &&
    input.ticketMode === "fridge";
}
