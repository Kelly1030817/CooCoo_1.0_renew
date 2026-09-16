import { afterEach, describe, expect, test } from "bun:test";
import { armToastDismiss } from "./providers";

describe("toast timer", () => {
  afterEach(() => {
    for (let id = 1; id < 10000; id += 1) clearTimeout(id);
  });

  test("clears the previous timer so only the latest dismiss runs", () => {
    const order: string[] = [];
    armToastDismiss(() => order.push("first"), 20);
    armToastDismiss(() => order.push("second"), 20);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(order).toEqual(["second"]);
        resolve();
      }, 50);
    });
  });
});
