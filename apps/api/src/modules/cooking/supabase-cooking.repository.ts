import type { Static } from "@sinclair/typebox";
import { CookingOutcomeCommandSchema } from "@coocoo/contracts";
import { getSupabaseAdmin } from "../../shared/infrastructure/supabase";

type CookingCommand=Static<typeof CookingOutcomeCommandSchema>;
export class SupabaseCookingRepository {
  async complete(userId:string,input:CookingCommand){const {data,error}=await getSupabaseAdmin().rpc("complete_cooking_transaction",{p_user_id:userId,p_operation_id:input.completionKey,p_recipe:input.recipe,p_requirements:input.ingredientRequirements||[],p_home_cook_cost:input.homeCookCost,p_confirmed_savings:input.actualDeposit,p_servings_cooked:input.servingsCooked||1,p_servings_eaten:input.servingsEaten??1,p_vegetables:input.vegetables});if(error)throw error;return data}
}
