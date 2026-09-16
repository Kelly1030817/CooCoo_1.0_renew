import type { CookwareProfile } from "@coocoo/contracts";
import { getSupabaseAdmin } from "../../shared/infrastructure/supabase";
export class SupabaseSettingsRepository {
  async cookware(userId: string): Promise<CookwareProfile[]> {
    const { data, error } = await getSupabaseAdmin()
      .from("cookware")
      .select("*")
      .eq("user_id", userId);
    if (error) throw error;
    return data.map((row) => ({
      id: row.id,
      type: row.type,
      name: row.type,
      brand: "",
      model: "",
      capacity: row.capacity || "",
      wattage: 0,
    }));
  }
  async saveCookware(userId: string, items: CookwareProfile[]) {
    const { error } = await getSupabaseAdmin().rpc("replace_cookware", {
      p_user_id: userId,
      p_items: items.map((item) => ({
        id: item.id,
        type: item.type,
        capacity: item.capacity,
        limitations: [],
      })),
    });
    if (error) throw error;
    return items;
  }
}
