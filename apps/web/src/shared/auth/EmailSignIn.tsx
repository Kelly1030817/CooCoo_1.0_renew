import { useEffect, useRef, useState } from "react";
import { queryClient } from "../../app/query-client";
import { authSessionQueryKey } from "./session";
import {
  isAuthPreviewOnly,
  currentPageRedirectTo,
  requestEmailOtp,
  supabase,
  verifyEmailOtp,
} from "./supabase";
import { emailAuthErrorMessage } from "./email-auth-error";
import "./email-sign-in.css";

export function EmailSignIn() {
  const canAuthenticate = Boolean(supabase) && !isAuthPreviewOnly;
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  useEffect(() => {
    if (!cooldown) return undefined;
    const timer = window.setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const perform = async (action: () => Promise<void>) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (reason) {
      setError(emailAuthErrorMessage(reason));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  const send = () =>
    perform(async () => {
      await requestEmailOtp(email.trim(), currentPageRedirectTo());
      setSentTo(email.trim());
      setToken("");
      setCooldown(60);
    });
  const verify = () =>
    perform(async () => {
      const session = await verifyEmailOtp(sentTo, token.trim());
      queryClient.setQueryData(authSessionQueryKey, session);
      setToken("");
    });

  return (
    <form
      className="email-sign-in"
      aria-label="Email 登入"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canAuthenticate) return;
        if (sentTo) void verify();
        else if (!cooldown) void send();
      }}
    >
      {isAuthPreviewOnly ? (
        <p role="status">此預覽只供檢視登入畫面，尚未開放寄送驗證碼。請勿輸入個人 Email。</p>
      ) : !supabase ? (
        <p>本機預覽使用測試資料，無法寄送驗證碼。</p>
      ) : null}
      <label>
        Email
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          disabled={busy || Boolean(sentTo) || !canAuthenticate}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="輸入你的 Email"
        />
      </label>
      {sentTo && (
        <>
          <p role="status">驗證信已寄出，請查看 {sentTo}，回到這裡輸入驗證碼。</p>
          <label>
            驗證碼
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="([0-9]{6}|[0-9]{8})"
              minLength={6}
              maxLength={8}
              required
              value={token}
              disabled={busy}
              onChange={(event) => setToken(event.target.value.replace(/\D/g, ""))}
            />
          </label>
        </>
      )}
      <button type="submit" disabled={busy || !canAuthenticate || (!sentTo && cooldown > 0)}>
        {busy
          ? "處理中…"
          : sentTo
            ? "驗證並登入"
            : cooldown
              ? `${cooldown} 秒後可寄送`
              : isAuthPreviewOnly
                ? "此預覽暫不提供寄信"
                : "寄送驗證碼"}
      </button>
      {sentTo && (
        <div className="email-sign-in-actions">
          <button type="button" disabled={busy || cooldown > 0} onClick={() => void send()}>
            {cooldown ? `${cooldown} 秒後可重寄` : "重新寄送驗證碼"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setSentTo("");
              setToken("");
              setError("");
            }}
          >
            更換 Email
          </button>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
      <small>不需要密碼；已填的主廚設定會保留。</small>
    </form>
  );
}
