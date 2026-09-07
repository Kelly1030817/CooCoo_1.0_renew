import { getSupabaseAdmin } from "../../shared/infrastructure/supabase";

export class SupabaseAiUsageRepository {
  async assertWithinLimit(userId: string, feature: "receipt_ocr" | "recipe_generation" | "shopping_analysis", limit = 10) {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const client = getSupabaseAdmin();
    const { count, error } = await client.from("ai_usage_events").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("feature", feature).gte("created_at", since).eq("status", "started");
    if (error) throw error;
    if ((count ?? 0) >= limit) { await this.record(userId, feature, "rate_limited", 0); throw new Error("AI_RATE_LIMITED"); }
  }
  async record(userId: string, feature: string, status: "started" | "succeeded" | "failed" | "rate_limited", inputBytes: number, model = process.env.GEMINI_MODEL || "gemini-3.7-flash") {
    const { error } = await getSupabaseAdmin().from("ai_usage_events").insert({ user_id: userId, feature, status, model, input_bytes: inputBytes });
    if (error) throw error;
  }
  async reserveShopping(userId:string,operationId:string,inputHash:string,model:string,maxTwd:number){
    const db=getSupabaseAdmin();
    const existing=await db.from('shopping_ai_operations').select('input_hash,status,result').eq('user_id',userId).eq('operation_id',operationId).maybeSingle();
    if(existing.error)throw existing.error;
    if(existing.data){if(existing.data.input_hash!==inputHash)throw new Error('AI_OPERATION_CONFLICT');return existing.data.result;}
    const reserved=await db.rpc('reserve_shopping_ai',{p_user:userId,p_operation:operationId,p_hash:inputHash,p_model:model,p_max:maxTwd});
    if(reserved.error)throw reserved.error;return null;
  }
  async settleShopping(userId:string,operationId:string,status:'completed'|'failed',actualTwd:number,result:unknown){
    const settled=await getSupabaseAdmin().rpc('settle_shopping_ai',{p_user:userId,p_operation:operationId,p_status:status,p_actual:actualTwd,p_result:result});if(settled.error)throw settled.error;
  }
}
