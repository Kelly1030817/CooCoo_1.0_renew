import type { CookwareProfile,FridgeProfile } from "@coocoo/contracts";
import { getSupabaseAdmin } from "../../shared/infrastructure/supabase";
export class SupabaseSettingsRepository{
 async fridge(userId:string){const{data,error}=await getSupabaseAdmin().from("fridge_profiles").select("*").eq("user_id",userId).maybeSingle();if(error)throw error;return data?{brand:data.brand,model:data.model,capacityLiters:data.capacity_liters,coldRatio:Number(data.cold_ratio),isConfigured:data.is_configured}:{brand:"",model:"",capacityLiters:0,coldRatio:.6,isConfigured:false}}
 async saveFridge(userId:string,value:FridgeProfile){const{error}=await getSupabaseAdmin().from("fridge_profiles").upsert({user_id:userId,brand:value.brand,model:value.model,capacity_liters:value.capacityLiters,cold_ratio:value.coldRatio,is_configured:value.isConfigured,updated_at:new Date().toISOString()});if(error)throw error;return value}
 async cookware(userId:string):Promise<CookwareProfile[]>{const{data,error}=await getSupabaseAdmin().from("cookware").select("*").eq("user_id",userId);if(error)throw error;return data.map(row=>({id:row.id,type:row.type,name:row.type,brand:"",model:"",capacity:row.capacity||"",wattage:0}))}
 async saveCookware(userId:string,items:CookwareProfile[]){const{error}=await getSupabaseAdmin().rpc("replace_cookware",{p_user_id:userId,p_items:items.map(item=>({id:item.id,type:item.type,capacity:item.capacity,limitations:[]}))});if(error)throw error;return items}
}
