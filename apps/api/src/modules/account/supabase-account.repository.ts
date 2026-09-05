import { getSupabaseAdmin } from "../../shared/infrastructure/supabase";

const exportTables=["profiles","cookware","fridge_profiles","dietary_restrictions","goals","inventory_batches","shopping_items","meal_plans","planned_meals","recipes","receipts","receipt_items","cooking_sessions","meal_servings","savings_events","offline_operations","sync_conflicts"] as const;
export class SupabaseAccountRepository {
  async export(userId:string){const client=getSupabaseAdmin();const entries=await Promise.all(exportTables.map(async table=>{const {data,error}=await client.from(table).select("*").eq("user_id",userId);if(error)throw error;return [table,data] as const}));return {exportedAt:new Date().toISOString(),version:1,data:Object.fromEntries(entries)}}
  toCsv(value:Awaited<ReturnType<SupabaseAccountRepository["export"]>>){const lines=["table,row_json"];for(const [table,rows] of Object.entries(value.data))for(const row of rows as unknown[])lines.push(`${table},"${JSON.stringify(row).replaceAll('"','""')}"`);return lines.join("\n")}
  async deleteAccount(userId:string){const client=getSupabaseAdmin();const {data,error}=await client.from("receipts").select("original_image_path").eq("user_id",userId);if(error)throw error;const paths=(data||[]).map(row=>row.original_image_path);if(paths.length){const removed=await client.storage.from("receipt-images").remove(paths);if(removed.error)throw removed.error}const result=await client.auth.admin.deleteUser(userId);if(result.error)throw result.error;return {deleted:true}}
}
