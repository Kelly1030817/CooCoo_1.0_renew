import { EmailSignIn } from "./EmailSignIn";

export function AuthRecoveryPanel() {
  return (
    <main className="onboarding-shell">
      <p className="eyebrow">CooCoo</p>
      <h1 className="text-2xl font-extrabold text-slate-blue">登入狀態已失效</h1>
      <p>你的主廚相談室設定仍保留著。請使用原帳號的 Email 驗證碼登入，繼續使用 CooCoo。</p>
      <EmailSignIn />
      <small className="integration-note">不需要重新填寫廚具、飲食限制、冰箱或週目標。</small>
    </main>
  );
}
