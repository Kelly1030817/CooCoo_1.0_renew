import { describe, expect, test } from "bun:test";
import { recognizeReceipt, type ReceiptModel } from "./gemini-receipt-recognizer";

const image = { bytes: new Uint8Array([1]), mimeType: "image/jpeg" as const };
describe("receipt recognition contract", () => {
  test("accepts itemized OCR fields and confidence", async () => {
    const model: ReceiptModel = { recognize: async () => ({ purchasedOn: "2026-08-25", items: [{ name: "雞蛋", quantity: 1, unit: "盒", unitPrice: 75, actualPrice: 75, confidence: { name: .98, quantity: .8, unitPrice: .9, actualPrice: .9 } }] }) };
    expect((await recognizeReceipt(model, image)).items[0].name).toBe("雞蛋");
  });
  test("rejects invalid Gemini JSON instead of inventing success", async () => {
    const model: ReceiptModel = { recognize: async () => ({ items: [{ name: "雞蛋" }] }) };
    expect(recognizeReceipt(model, image)).rejects.toThrow("OCR_SCHEMA_INVALID");
  });
  test("rejects pure QR or non-itemized images", async () => {
    const model: ReceiptModel = { recognize: async () => ({ purchasedOn: null, items: [] }) };
    expect(recognizeReceipt(model, image)).rejects.toThrow("OCR_NO_ITEMIZED_DETAILS");
  });
});
