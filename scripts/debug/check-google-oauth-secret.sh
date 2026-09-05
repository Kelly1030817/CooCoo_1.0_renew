#!/bin/zsh

set -u

printf '\nCooCoo Google Secret 配對測試\n'
printf '請貼上完整 Client secret，再按 Enter。\n'
printf '貼上後畫面不會顯示任何字元，這是正常的。\n> '

IFS= read -rs coocoo_client_secret
printf '\n\n正在向 Google 驗證，請稍候...\n'

coocoo_result=$(curl -sS -X POST https://oauth2.googleapis.com/token \
  --data-urlencode 'client_id=310566759999-8b32ecq0odd1b13i9vki18lmscjj0hfc.apps.googleusercontent.com' \
  --data-urlencode "client_secret=$coocoo_client_secret" \
  --data-urlencode 'code=coocoo-intentionally-invalid-code' \
  --data-urlencode 'grant_type=authorization_code' \
  --data-urlencode 'redirect_uri=https://cpyvizycjvburtpljxiu.supabase.co/auth/v1/callback')

unset coocoo_client_secret
coocoo_error=$(printf '%s' "$coocoo_result" | jq -r '.error // "unknown"')

if [[ "$coocoo_error" == 'invalid_grant' ]]; then
  printf '\n✅ 配對正確：這個 Secret 屬於目前的 CooCoo Web。\n'
elif [[ "$coocoo_error" == 'invalid_client' ]]; then
  printf '\n❌ 配對失敗：這不是完整 Secret，或不屬於目前的 CooCoo Web。\n'
else
  printf '\n⚠️ Google 回傳其他結果：%s\n' "$coocoo_error"
fi

unset coocoo_result coocoo_error
