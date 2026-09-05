import { describe, expect, test } from "vitest";
import { buildEmailOtpOptions, readAuthCallbackIssue } from "./supabase";

describe("Supabase email authentication", () => {
  test("returns the browser origin as the magic-link redirect", () => {
    expect(buildEmailOtpOptions("http://localhost:5173")).toEqual({
      shouldCreateUser: true,
      emailRedirectTo: "http://localhost:5173",
    });
  });

  test("turns an expired callback into an actionable message", () => {
    expect(
      readAuthCallbackIssue(
        "#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired",
      ),
    ).toEqual({
      code: "otp_expired",
      message: "這封驗證信已使用或過期，請重新寄送一封新的驗證信。",
    });
  });

  test("decodes a provider error that Supabase encoded more than once", () => {
    expect(
      readAuthCallbackIssue(
        "#error=server_error&error_code=unexpected_failure&error_description=Unable+to+exchange+external+code%253A+4%252F0A",
      ),
    ).toEqual({
      code: "unexpected_failure",
      message: "Google 登入未完成，請稍後重試；若持續發生，請檢查 OAuth 用戶端憑證設定。",
    });
  });

  test("ignores normal auth callbacks", () => {
    expect(readAuthCallbackIssue("#access_token=token&token_type=bearer")).toBeNull();
  });
});
