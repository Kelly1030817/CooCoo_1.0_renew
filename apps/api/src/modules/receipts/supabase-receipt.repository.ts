import type { ReceiptRecognition } from "@coocoo/contracts";
import { getSupabaseAdmin } from "../../shared/infrastructure/supabase";

export class SupabaseReceiptRepository {
  async create(userId: string, image: File) {
    const client = getSupabaseAdmin();
    const receiptId = crypto.randomUUID();
    const extension = image.type === "image/png" ? "png" : image.type === "image/webp" ? "webp" : "jpg";
    const path = `${userId}/${receiptId}/original.${extension}`;
    const { error: uploadError } = await client.storage.from("receipt-images").upload(path, image, { contentType: image.type, upsert: false });
    if (uploadError) throw uploadError;
    const { data, error } = await client.from("receipts").insert({ id: receiptId, user_id: userId, original_image_path: path, status: "uploaded" }).select().single();
    if (error) { await client.storage.from("receipt-images").remove([path]); throw error; }
    return data;
  }

  async image(userId: string, receiptId: string) {
    const client = getSupabaseAdmin();
    const { data: receipt, error } = await client.from("receipts").select("id,original_image_path").eq("id", receiptId).eq("user_id", userId).single();
    if (error || !receipt) throw new Error("RECEIPT_NOT_FOUND");
    const { data, error: downloadError } = await client.storage.from("receipt-images").download(receipt.original_image_path);
    if (downloadError) throw downloadError;
    return { receipt, bytes: new Uint8Array(await data.arrayBuffer()), mimeType: data.type as "image/jpeg" | "image/png" | "image/webp" };
  }

  async saveRecognition(userId: string, receiptId: string, recognition: ReceiptRecognition) {
    const client = getSupabaseAdmin();
    const rows = recognition.items.map((item) => ({ ...item, id: crypto.randomUUID(), user_id: userId, receipt_id: receiptId, unit_price: item.unitPrice, actual_price: item.actualPrice, storage_location: null, expires_on: null, confirmed: false }));
    const sanitized = rows.map(({ unitPrice: _unitPrice, actualPrice: _actualPrice, ...row }) => row);
    const { error: itemError } = await client.from("receipt_items").insert(sanitized);
    if (itemError) throw itemError;
    const { data, error } = await client.from("receipts").update({ purchased_on: recognition.purchasedOn, status: "needs_review", updated_at: new Date().toISOString() }).eq("id", receiptId).eq("user_id", userId).select("*,receipt_items(*)").single();
    if (error) throw error;
    return data;
  }

  async markFailed(userId: string, receiptId: string, errorMessage: string) {
    await getSupabaseAdmin().from("receipts").update({ status: "failed", recognition_error: errorMessage, updated_at: new Date().toISOString() }).eq("id", receiptId).eq("user_id", userId);
  }
  async confirm(userId: string, receiptId: string, items: unknown[]) {
    const { error } = await getSupabaseAdmin().rpc("confirm_receipt_and_restock", { p_user_id: userId, p_receipt_id: receiptId, p_items: items });
    if (error) throw error;
    return { id: receiptId, inventoryCount: items.length };
  }
  async delete(userId: string, receiptId: string) {
    const client = getSupabaseAdmin();
    const { data, error } = await client.from("receipts").select("original_image_path").eq("id", receiptId).eq("user_id", userId).single();
    if (error) throw error;
    const { error: storageError } = await client.storage.from("receipt-images").remove([data.original_image_path]);
    if (storageError) throw storageError;
    const { error: deleteError } = await client.from("receipts").delete().eq("id", receiptId).eq("user_id", userId);
    if (deleteError) throw deleteError;
    return { id: receiptId };
  }
}
