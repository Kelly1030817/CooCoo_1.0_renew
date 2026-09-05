import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;
let authClient: SupabaseClient | null = null;

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name}_REQUIRED`);
  return value;
}

function serverSecret() {
  const value = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) throw new Error("SUPABASE_SECRET_KEY_REQUIRED");
  return value;
}

export function getSupabaseAdmin() {
  if (!adminClient) adminClient = createClient(required("SUPABASE_URL"), serverSecret(), { auth: { persistSession: false, autoRefreshToken: false } });
  return adminClient;
}

export async function authenticateRequest(authorization?: string) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_PUBLISHABLE_KEY) {
    if (process.env.NODE_ENV === "production") throw new Error("SUPABASE_AUTH_NOT_CONFIGURED");
    return { id: "00000000-0000-4000-8000-000000000001", email: "preview@coocoo.local" };
  }
  const token = authorization?.replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("AUTH_REQUIRED");
  if (!authClient) authClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) throw new Error("AUTH_INVALID");
  return { id: data.user.id, email: data.user.email ?? "" };
}
