import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const isAuthPreviewOnly =
  import.meta.env.DEV && import.meta.env.VITE_AUTH_PREVIEW_ONLY === "true";
export const isSupabaseConfigured = Boolean(url && publishableKey);
export const supabase = isSupabaseConfigured
  ? createClient(url, publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

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
  const description = decodeCallbackMessage(
    parameters.get("error_description") || "登入沒有完成，請重新嘗試。",
  );
  if (description.startsWith("Unable to exchange external code")) {
    return {
      code,
      message: "登入未完成，請回到 CooCoo 使用 Email 驗證碼重新登入。",
    };
  }
  return {
    code,
    message: description,
  };
}

export async function requestEmailOtp(email: string, redirectTo: string = window.location.origin) {
  if (isAuthPreviewOnly) throw new Error("此預覽只供檢視登入畫面，尚未開放寄送驗證碼。");
  if (!supabase) throw new Error("尚未設定 Supabase Auth");
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: buildEmailOtpOptions(redirectTo),
  });
  if (error) throw error;
}

export async function verifyEmailOtp(email: string, token: string) {
  if (isAuthPreviewOnly) throw new Error("此預覽只供檢視登入畫面，尚未開放寄送驗證碼。");
  if (!supabase) throw new Error("尚未設定 Supabase Auth");
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) throw error;
  if (!data.session) throw new Error("驗證未完成，請重新寄送驗證碼。");
  return data.session;
}

export function currentPageRedirectTo() {
  return `${window.location.origin}${window.location.pathname}${window.location.search}`;
}

export function onboardingRedirectTo(step: number) {
  return `${window.location.origin}/onboarding?step=${step}`;
}
