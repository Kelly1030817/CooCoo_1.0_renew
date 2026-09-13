import type { MealTaskRestockCommand, MealTaskRestockResult, ShoppingItem, WeeklyStockupItem } from "@coocoo/contracts";
import { shoppingCategoryFor } from "@coocoo/core";
import { getSupabaseAdmin } from "../../shared/infrastructure/supabase";

const map=(row:Record<string,unknown>):ShoppingItem=>({id:String(row.id),name:String(row.name),category:row.category as ShoppingItem["category"],qty:Number(row.quantity),unit:String(row.unit),checked:Boolean(row.checked),status:String(row.status),estCost:Number(row.estimated_cost),shortageId:row.shortage_id?String(row.shortage_id):undefined,mealPlanId:row.meal_plan_id?String(row.meal_plan_id):undefined,source:row.source?(row.source as ShoppingItem["source"]):undefined});
export class SupabaseShoppingRepository {
  async list(userId:string){const {data,error}=await getSupabaseAdmin().from("shopping_items").select("*").eq("user_id",userId).order("position");if(error)throw error;return data.map(map)}
  async save(userId:string,item:Partial<ShoppingItem>&Pick<ShoppingItem,"name">){
    if(!item.id&&item.shortageId){
      const existing=await getSupabaseAdmin().from("shopping_items").select("*").eq("user_id",userId).eq("shortage_id",item.shortageId).order("position").limit(1);
      if(existing.error)throw existing.error;
      if(existing.data?.length)return map(existing.data[0] as Record<string,unknown>);
    }
    let canonicalKey=item.name.toLocaleLowerCase("zh-TW");
    if(item.id){
      const prior=await getSupabaseAdmin().from("shopping_items").select("*").eq("id",item.id).eq("user_id",userId).single();
      if(prior.error)throw prior.error;
      item={...map(prior.data),...item};
    }
    if(item.shortageId){
      const tasks=await getSupabaseAdmin().from("meal_tasks").select("shortages").eq("user_id",userId).eq("status","needs_shopping");
      if(tasks.error)throw tasks.error;
      const shortage=tasks.data.flatMap(t=>t.shortages).find(sh=>sh.id===item.shortageId);
      if(!shortage||!["needed","unavailable"].includes(shortage.resolution))throw new Error("SHORTAGE_NOT_ACTIVE");
      if(item.name!==shortage.name||item.unit&&item.unit!==shortage.unit)throw new Error("USE_RECIPE_ADJUSTMENT");
      canonicalKey=shortage.ingredientKey;
      item={...item,name:shortage.name,unit:shortage.unit,source:"task"};
    }
    const values={user_id:userId,name:item.name,ingredient_key:canonicalKey,category:item.category||shoppingCategoryFor(item.name),quantity:item.qty??1,unit:item.unit||"包",checked:item.checked??false,status:item.status||"needed",estimated_cost:item.estCost??0,shortage_id:item.shortageId??null,meal_plan_id:item.mealPlanId??null,source:item.source??null};
    const query=item.id?getSupabaseAdmin().from("shopping_items").update(values).eq("id",item.id).eq("user_id",userId):getSupabaseAdmin().from("shopping_items").insert(values);
    const {data,error}=await query.select().single();if(error){
      if(error.code==="23505"&&item.shortageId){const existing=await getSupabaseAdmin().from("shopping_items").select("*").eq("user_id",userId).eq("shortage_id",item.shortageId).single();if(existing.error)throw existing.error;return map(existing.data);}
      throw error;
    }return map(data)}
  async syncWeeklyPlan(userId:string,mealPlanId:string,items:WeeklyStockupItem[]){
    const client=getSupabaseAdmin();
    const existing=await client.from("shopping_items").select("ingredient_key,unit,checked").eq("user_id",userId).eq("meal_plan_id",mealPlanId);
    if(existing.error)throw existing.error;
    const checked=new Set((existing.data??[]).filter(item=>item.checked).map(item=>`${item.ingredient_key}::${item.unit}`));
    const removed=await client.from("shopping_items").delete().eq("user_id",userId).eq("meal_plan_id",mealPlanId).eq("checked",false);
    if(removed.error)throw removed.error;
    const rows=items.filter(item=>!checked.has(`${item.ingredientKey}::${item.unit}`)).map((item,index)=>({user_id:userId,meal_plan_id:mealPlanId,name:item.name,ingredient_key:item.ingredientKey,category:item.category,quantity:item.quantity,unit:item.unit,checked:false,status:"本週一次備齊",estimated_cost:0,shortage_id:null,source:"plan",position:index}));
    if(rows.length){const {error}=await client.from("shopping_items").insert(rows);if(error)throw error;}
    return this.list(userId);
  }
  async delete(userId:string,id:string){const {error}=await getSupabaseAdmin().from("shopping_items").delete().eq("id",id).eq("user_id",userId);if(error)throw error;return {id}}
  async restock(userId:string,command:MealTaskRestockCommand):Promise<MealTaskRestockResult>{
    const {data,error}=await getSupabaseAdmin().rpc("restock_checked_shopping_v2",{
      p_user_id:userId,
      p_operation_id:command.operationId,
      p_items:command.purchasedItems.map((item)=>({shopping_item_id:item.shoppingItemId,shortage_id:item.shortageId??null,actual_quantity:item.actualQuantity,actual_unit:item.actualUnit,actual_price:item.actualPrice??null,storage_location:item.storageLocation,expires_on:item.expiresOn??null})),
      p_meal_task_id:command.mealTaskId??null,
      p_shortage_revision:command.shortageRevision??null,
    });
    if(error)throw new Error(error.message);
    const result=data as MealTaskRestockResult&{replayed?:boolean};
    return {...result,replayed:Boolean(result.replayed)};
  }
}
