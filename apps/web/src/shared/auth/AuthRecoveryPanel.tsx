type AuthRecoveryPanelProps = {
  busy: boolean;
  error: string;
  onGoogleSignIn: () => void;
};

export function AuthRecoveryPanel({ busy, error, onGoogleSignIn }: AuthRecoveryPanelProps) {
  return (
    <main className="onboarding-shell">
      <p className="eyebrow">CooCoo</p>
      <h1 className="text-2xl font-extrabold text-slate-blue">登入狀態已失效</h1>
      <p>你的主廚相談室設定仍保留著。重新使用 Google 登入後，就能繼續使用 CooCoo。</p>
      <button
        type="button"
        className="google-button"
        disabled={busy}
        onClick={onGoogleSignIn}
      >
        {busy ? "正在前往 Google…" : "使用 Google 重新登入"}
      </button>
      {error ? <p role="alert" className="offline-error">{error}</p> : null}
      <small className="integration-note">不需要重新填寫廚具、飲食限制、預算或圓夢目標。</small>
    </main>
  );
}
