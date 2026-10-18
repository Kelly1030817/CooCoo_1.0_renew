import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { AuthRecoveryPanel } from "./AuthRecoveryPanel";

describe("AuthRecoveryPanel", () => {
  test("offers email recovery while preserving onboarding", () => {
    const html = renderToStaticMarkup(<AuthRecoveryPanel />);
    expect(html).toContain("主廚相談室設定仍保留著");
    expect(html).toContain("Email 登入");
    expect(html).toContain("寄送驗證碼");
    expect(html).not.toContain("Google");
  });
});
