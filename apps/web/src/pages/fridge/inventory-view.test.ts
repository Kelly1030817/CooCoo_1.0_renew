import { describe, expect, test } from "vitest";
import type { InventoryItem } from "@coocoo/contracts";
import { groupInventory, needsInventoryConfirmation } from "./inventory-view";

const item = (patch: Partial<InventoryItem>): InventoryItem => ({
  id: crypto.randomUUID(),
  ingredientKey: "番茄",
  name: "番茄",
  chamber: "cold",
  qty: 250,
  unit: "克",
  daysLeft: 1,
  expiresOn: "2026-09-14",
  lastConfirmedAt: "2026-09-13T00:00:00.000Z",
  image: "/favicon.svg",
  addedDate: "2026-09-12",
  estimatedValue: 0,
  storageProtocol: "先進先出",
  boxSize: "M",
  ...patch,
});

describe("fridge inventory view", () => {
  test("groups the same ingredient, chamber and unit while preserving FIFO batches", () => {
    const groups = groupInventory(
      [
        item({ id: "later", qty: 500, daysLeft: 5, expiresOn: "2026-09-18", estimatedValue: 60 }),
        item({ id: "first", qty: 250, daysLeft: 1, expiresOn: "2026-09-14" }),
      ],
      new Date("2026-09-13T12:00:00.000Z"),
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      qty: 750,
      daysLeft: 1,
      estimatedValue: 60,
      unpricedBatchCount: 1,
    });
    expect(groups[0].batches.map((batch) => batch.id)).toEqual(["first", "later"]);
  });

  test("keeps different storage locations and units separate", () => {
    expect(
      groupInventory([
        item({ chamber: "cold", unit: "克" }),
        item({ chamber: "frozen", unit: "克" }),
        item({ chamber: "pantry", unit: "包" }),
      ]),
    ).toHaveLength(3);
  });

  test("uses the backend confirmation windows for cold and longer-storage stock", () => {
    const now = new Date("2026-09-13T12:00:00.000Z");
    expect(
      needsInventoryConfirmation(
        item({ chamber: "cold", lastConfirmedAt: "2026-09-06T12:00:00.000Z" }),
        now,
      ),
    ).toBe(true);
    expect(
      needsInventoryConfirmation(
        item({ chamber: "frozen", lastConfirmedAt: "2026-08-15T12:00:00.000Z" }),
        now,
      ),
    ).toBe(false);
    expect(
      needsInventoryConfirmation(item({ chamber: "pantry", lastConfirmedAt: "invalid" }), now),
    ).toBe(true);
  });
});
