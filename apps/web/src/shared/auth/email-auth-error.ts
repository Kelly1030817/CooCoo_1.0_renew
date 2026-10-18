export function emailAuthErrorMessage(reason: unknown) {
  const error = reason && typeof reason === "object" ? reason : {};
  const message = "message" in error && typeof error.message === "string" ? error.message : "";
  const code = "code" in error ? error.code : undefined;
  const name = "name" in error ? error.name : undefined;
  const status = "status" in error ? error.status : undefined;
  if (typeof status === "number" && status >= 500) {
    return "登入服務暫時無法寄送或驗證郵件。請稍後重試，或聯絡 CooCoo 管理者確認寄信設定；已填的主廚設定仍保留。";
  }
  if (
    name === "AuthRetryableFetchError" ||
    /failed to fetch|fetch failed|networkerror|network request failed|load failed/i.test(message)
  ) {
    return "無法連線到登入服務，尚未完成寄送或驗證。請檢查網路後重試；已填的主廚設定仍保留。";
  }
  if (code === "otp_expired") return "驗證碼錯誤或已過期，請重新寄送驗證碼。";
  if (status === 429 || code === "over_email_send_rate_limit") {
    return "驗證碼寄送過於頻繁，請稍後再試。";
  }
  if (/[\u3400-\u9fff]/u.test(message)) return message;
  return "登入未完成，請稍後重試。若持續發生，請聯絡 CooCoo 管理者確認寄信服務。";
}
