import { getSupabaseAdmin } from "../../shared/infrastructure/supabase";

export class SupabaseInviteRepository {
  private async assertOwner(userId: string) {
    const { data, error } = await getSupabaseAdmin().from("app_roles").select("role").eq("user_id", userId).eq("role", "owner").maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("OWNER_ROLE_REQUIRED");
  }
  async list(userId: string) { await this.assertOwner(userId); const { data, error } = await getSupabaseAdmin().from("beta_invites").select("*").order("created_at", { ascending: false }); if (error) throw error; return data; }
  async create(userId: string, email: string) { await this.assertOwner(userId); const { data, error } = await getSupabaseAdmin().from("beta_invites").insert({ email: email.trim().toLowerCase(), invited_by: userId }).select().single(); if (error) throw error; return data; }
  async revoke(userId: string, inviteId: string) { await this.assertOwner(userId); const { data, error } = await getSupabaseAdmin().from("beta_invites").update({ status: "revoked" }).eq("id", inviteId).select().single(); if (error) throw error; return data; }
}
