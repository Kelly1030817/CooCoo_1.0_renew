import type { ShoppingItem } from "@coocoo/contracts";
import { getSupabaseAdmin } from "../../shared/infrastructure/supabase";

const map=(row:Record<string,unknown>):ShoppingItem=>({id:String(row.id),name:String(row.name),category:row.category as ShoppingItem["category"],qty:Number(row.quantity),unit:String(row.unit),checked:Boolean(row.checked),status:String(row.status),estCost:Number(row.estimated_cost)});
export class SupabaseShoppingRepository {
  async list(userId:string){const {data,error}=await getSupabaseAdmin().from("shopping_items").select("*").eq("user_id",userId).order("position");if(error)throw error;return data.map(map)}
  async save(userId:string,item:Partial<ShoppingItem>&Pick<ShoppingItem,"name">){const values={user_id:userId,name:item.name,ingredient_key:item.name.toLocaleLowerCase("zh-TW"),category:item.category||"other",quantity:item.qty??1,unit:item.unit||"包",checked:item.checked??false,status:item.status||"needed",estimated_cost:item.estCost??0};const query=item.id?getSupabaseAdmin().from("shopping_items").update(values).eq("id",item.id).eq("user_id",userId):getSupabaseAdmin().from("shopping_items").insert(values);const {data,error}=await query.select().single();if(error)throw error;return map(data)}
  async delete(userId:string,id:string){const {error}=await getSupabaseAdmin().from("shopping_items").delete().eq("id",id).eq("user_id",userId);if(error)throw error;return {id}}
  async restock(userId:string){const {data,error}=await getSupabaseAdmin().rpc("restock_checked_shopping",{p_user_id:userId});if(error)throw error;return {count:Number(data)}}
}
