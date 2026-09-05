import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { AuthRecoveryPanel } from "./AuthRecoveryPanel";

describe("AuthRecoveryPanel", () => {
  test("offers Google reauthentication without asking the user to redo onboarding", () => {
    const html = renderToStaticMarkup(
      <AuthRecoveryPanel busy={false} error="" onGoogleSignIn={() => undefined} />,
    );

    expect(html).toContain("使用 Google 重新登入");
    expect(html).toContain("主廚相談室設定仍保留著");
    expect(html).not.toContain("disabled");
  });

  test("shows progress and a friendly error", () => {
    const html = renderToStaticMarkup(
      <AuthRecoveryPanel busy error="Google 登入暫時無法開始" onGoogleSignIn={() => undefined} />,
    );

    expect(html).toContain("正在前往 Google…");
    expect(html).toContain("disabled");
    expect(html).toContain("Google 登入暫時無法開始");
  });
});
