import { GoogleGenAI } from "@google/genai";
import { Value } from "@sinclair/typebox/value";
import { ReceiptRecognitionSchema, type ReceiptRecognition } from "@coocoo/contracts";

export interface ReceiptImage {
  bytes: Uint8Array;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
}

export interface ReceiptModel {
  recognize(image: ReceiptImage): Promise<unknown>;
}

export class GeminiReceiptModel implements ReceiptModel {
  private readonly client: GoogleGenAI;
  private readonly model: string;
  constructor(apiKey = process.env.GEMINI_API_KEY, model = process.env.GEMINI_MODEL || "gemini-3.7-flash") {
    if (!apiKey) throw new Error("GEMINI_API_KEY_REQUIRED");
    this.client = new GoogleGenAI({ apiKey });
    this.model = model;
  }
  async recognize(image: ReceiptImage) {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: [{ inlineData: { mimeType: image.mimeType, data: Buffer.from(image.bytes).toString("base64") } }, { text: "辨識這張有逐項明細的台灣賣場收據或電子發票明細截圖。只回傳 JSON。不要猜測看不清楚的內容；信心分數 0 到 1。純 QR code、手寫單或沒有品項明細時 items 回傳空陣列。金額使用整數新台幣。" }],
      config: { responseMimeType: "application/json", responseJsonSchema: ReceiptRecognitionSchema },
    });
    if (!response.text) throw new Error("OCR_EMPTY_RESPONSE");
    return JSON.parse(response.text);
  }
}

export async function recognizeReceipt(model: ReceiptModel, image: ReceiptImage): Promise<ReceiptRecognition> {
  if (image.bytes.byteLength === 0 || image.bytes.byteLength > 10 * 1024 * 1024) throw new Error("INVALID_RECEIPT_FILE_SIZE");
  const result = await model.recognize(image);
  if (!Value.Check(ReceiptRecognitionSchema, result)) throw new Error("OCR_SCHEMA_INVALID");
  if (result.items.length === 0) throw new Error("OCR_NO_ITEMIZED_DETAILS");
  return result;
}
