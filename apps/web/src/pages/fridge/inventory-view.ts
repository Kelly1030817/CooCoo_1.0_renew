import { canonicalIngredient } from "@coocoo/core";
import type { InventoryItem } from "@coocoo/contracts";

export interface InventoryGroup {
  key: string;
  name: string;
  chamber: InventoryItem["chamber"];
  unit: string;
  qty: number;
  daysLeft: number;
  estimatedValue: number;
  unpricedBatchCount: number;
  staleBatchCount: number;
  batches: InventoryItem[];
}

export function needsInventoryConfirmation(item: InventoryItem, now = new Date()) {
  const confirmedAt = Date.parse(item.lastConfirmedAt);
  if (!Number.isFinite(confirmedAt)) return true;
  const ageInDays = (now.getTime() - confirmedAt) / 86_400_000;
  return ageInDays >= (item.chamber === "cold" ? 7 : 30);
}

export function groupInventory(items: InventoryItem[], now = new Date()): InventoryGroup[] {
  const groups = new Map<string, InventoryItem[]>();

  for (const item of items) {
    const key = `${item.chamber}:${canonicalIngredient(item.ingredientKey)}:${item.unit}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  return [...groups.entries()]
    .map(([key, batches]) => {
      const ordered = [...batches].sort(
        (left, right) =>
          left.daysLeft - right.daysLeft || left.addedDate.localeCompare(right.addedDate),
      );
      return {
        key,
        name: ordered[0].name,
        chamber: ordered[0].chamber,
        unit: ordered[0].unit,
        qty: ordered.reduce((sum, batch) => sum + batch.qty, 0),
        daysLeft: ordered[0].daysLeft,
        estimatedValue: ordered.reduce((sum, batch) => sum + batch.estimatedValue, 0),
        unpricedBatchCount: ordered.filter((batch) => batch.estimatedValue === 0).length,
        staleBatchCount: ordered.filter((batch) => needsInventoryConfirmation(batch, now)).length,
        batches: ordered,
      };
    })
    .sort(
      (left, right) =>
        left.daysLeft - right.daysLeft || left.name.localeCompare(right.name, "zh-TW"),
    );
}
