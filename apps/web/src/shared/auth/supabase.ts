import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const isSupabaseConfigured = Boolean(url && publishableKey);
export const supabase = isSupabaseConfigured ? createClient(url, publishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
}) : null;

export function buildEmailOtpOptions(origin: string) {
  return { shouldCreateUser: true, emailRedirectTo: origin } as const;
}

function decodeCallbackMessage(value: string) {
  let decoded = value;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      break;
    }
  }
  return decoded;
}

export function readAuthCallbackIssue(hash: string) {
  const parameters = new URLSearchParams(hash.replace(/^#/, ""));
  const code = parameters.get("error_code");
  if (!code) return null;
  if (code === "otp_expired") {
    return {
      code,
      message: "這封驗證信已使用或過期，請重新寄送一封新的驗證信。",
    };
  }
  const description = decodeCallbackMessage(parameters.get("error_description") || "登入沒有完成，請重新嘗試。");
  if (description.startsWith("Unable to exchange external code")) {
    return {
      code,
      message: "Google 登入未完成，請稍後重試；若持續發生，請檢查 OAuth 用戶端憑證設定。",
    };
  }
  return {
    code,
    message: description,
  };
}

export async function requestEmailOtp(email: string) {
  if (!supabase) throw new Error("尚未設定 Supabase Auth");
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: buildEmailOtpOptions(window.location.origin),
  });
  if (error) throw error;
}

export async function verifyEmailOtp(email: string, token: string) {
  if (!supabase) throw new Error("尚未設定 Supabase Auth");
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) throw error;
}

export async function startGoogleAuth() {
  if (!supabase) throw new Error("尚未設定 Supabase Auth");
  const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
  if (error) throw error;
}
