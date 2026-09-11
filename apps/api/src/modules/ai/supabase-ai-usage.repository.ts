import { getSupabaseAdmin } from "../../shared/infrastructure/supabase";

export type AiFeature="receipt_ocr"|"recipe_generation"|"shopping_analysis"|"chef_chat";
export class SupabaseAiUsageRepository {
  async hash(value:unknown){
    const bytes=value instanceof Uint8Array?value:new TextEncoder().encode(JSON.stringify(value));
    const digest=await crypto.subtle.digest('SHA-256',Uint8Array.from(bytes).buffer);
    return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
  }
  async reserve<T=unknown>(userId:string,operationId:string,feature:AiFeature,inputHash:string,model:string,maxTwd:number):Promise<T|null>{
    const {data,error}=await getSupabaseAdmin().rpc('reserve_ai_operation',{p_user:userId,p_operation:operationId,p_feature:feature,p_hash:inputHash,p_model:model,p_max:maxTwd});
    if(error)throw error;
    const reservation=data as null|{status?:string;result?:unknown};
    if(reservation?.status==='failed'&&reservation.result==null)throw new Error('AI_OPERATION_FAILED');
    return reservation?.status==='completed'||reservation?.status==='failed'?reservation.result as T:null;
  }
  async settle(userId:string,operationId:string,status:'completed'|'failed',actualTwd:number,result:unknown){
    const {error}=await getSupabaseAdmin().rpc('settle_ai_operation',{p_user:userId,p_operation:operationId,p_status:status,p_actual:actualTwd,p_result:result});
    if(error)throw error;
  }
}
