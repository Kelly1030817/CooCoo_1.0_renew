import type { OnboardingProfile } from "@coocoo/contracts";
import { getSupabaseAdmin } from "../../shared/infrastructure/supabase";

export class SupabaseOnboardingRepository {
  async save(userId: string, profile: OnboardingProfile) {
    const { error } = await getSupabaseAdmin().rpc("save_onboarding_profile", { p_user_id: userId, p_profile: profile });
    if (error) throw error;
    return profile;
  }
  async read(userId: string) {
    const client = getSupabaseAdmin();
    const [profile, cookware, restrictions, weeklyGoal, reminders] = await Promise.all([
      client.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      client.from("cookware").select("*").eq("user_id", userId),
      client.from("dietary_restrictions").select("*").eq("user_id", userId),
      client.from("weekly_goals_v2").select("*").eq("user_id", userId).order("week_start", { ascending: false }).limit(1).maybeSingle(),
      client.from("notification_preferences").select("*").eq("user_id", userId).maybeSingle(),
    ]);
    for (const result of [profile, cookware, restrictions, weeklyGoal, reminders]) if (result.error) throw result.error;
    return { profile: profile.data, cookware: cookware.data, restrictions: restrictions.data, weeklyGoal: weeklyGoal.data, reminders: reminders.data };
  }
}
