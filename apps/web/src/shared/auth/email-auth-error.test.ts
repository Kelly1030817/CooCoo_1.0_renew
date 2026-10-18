import { describe, expect, test } from "vitest";
import { emailAuthErrorMessage } from "./email-auth-error";

describe("email auth failure messages", () => {
  test("network errors explain that delivery or verification has not completed", () => {
    expect(emailAuthErrorMessage(new TypeError("Failed to fetch"))).toContain("尚未完成寄送或驗證");
    expect(
      emailAuthErrorMessage({ name: "AuthRetryableFetchError", message: "unknown" }),
    ).toContain("無法連線到登入服務");
  });
  test("SMTP server failures do not masquerade as a browser network failure", () => {
    const message = emailAuthErrorMessage({
      name: "AuthRetryableFetchError",
      status: 500,
      message: "Error sending magic link email",
    });
    expect(message).toContain("確認寄信設定");
    expect(message).not.toContain("檢查網路");
  });
  test("preserves invite rejection and translates expiry and rate limits", () => {
    expect(emailAuthErrorMessage(new Error("CooCoo 封閉測試目前只接受受邀 Email"))).toContain(
      "只接受受邀 Email",
    );
    expect(emailAuthErrorMessage({ code: "otp_expired" })).toContain("已過期");
    expect(emailAuthErrorMessage({ status: 429 })).toContain("過於頻繁");
  });
});
