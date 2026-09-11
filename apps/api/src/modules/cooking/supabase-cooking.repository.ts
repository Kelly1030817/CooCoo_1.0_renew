import type { Static } from "@sinclair/typebox";
import { CookingOutcomeCommandSchema } from "@coocoo/contracts";
import { getSupabaseAdmin } from "../../shared/infrastructure/supabase";

type CookingCommand=Static<typeof CookingOutcomeCommandSchema>;
export class SupabaseCookingRepository {
  async complete(userId:string,input:CookingCommand){const {data,error}=await getSupabaseAdmin().rpc("complete_cooking_v2_transaction",{p_user_id:userId,p_operation_id:input.completionKey,p_recipe:input.recipe,p_requirements:input.ingredientRequirements||[],p_ingredient_cost:input.ingredientCost,p_comparison_meal_price:input.comparisonMealPrice??null,p_track_cost:input.trackCost,p_servings_cooked:input.servingsCooked||1,p_servings_eaten:input.servingsEaten??1,p_vegetables:input.vegetables,p_used_expiring:input.usedExpiringIngredient,p_completed_double_meal:input.completedDoubleMeal,p_meal_task_id:input.mealTaskId??null});if(error)throw error;return data}
}
