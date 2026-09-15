import type { ApiErrorBody, ApiSuccess } from '@coocoo/contracts'
import { supabase } from '../auth/supabase'
import { isApiErrorBody, isApiSuccess, parseJsonText } from '../lib/api-body'

export class ApiError extends Error {
  readonly status: number
  readonly body: ApiErrorBody
  constructor(status: number, body: ApiErrorBody) { super(body.error.message);this.status=status;this.body=body }
}

const fallbackMessages: Record<string, string> = {
  AUTH_REQUIRED: "請先登入再使用這項功能。",
  AUTH_INVALID: "登入狀態已失效，請重新登入。",
};

async function readResponse<T>(response: Response): Promise<ApiSuccess<T> | ApiErrorBody> {
  const text = await response.text();
  try {
    const parsed = parseJsonText(text);
    if (isApiErrorBody(parsed)) return parsed;
    if (isApiSuccess<T>(parsed)) return parsed;
    throw new Error("UNRECOGNIZED_RESPONSE");
  } catch (error) {
    if (error instanceof Error && error.message === "UNRECOGNIZED_RESPONSE") {
      if (response.ok) throw new Error("伺服器回傳了無法辨識的資料格式。", { cause: error });
      const code = text.trim() || `HTTP_${response.status}`;
      return {
        error: {
          code,
          message: fallbackMessages[code] || "操作未完成，請稍後再試。",
          requestId: response.headers.get("x-request-id") || "client-response",
        },
      };
    }
    if (response.ok) throw new Error("伺服器回傳了無法辨識的資料格式。", { cause: error });
    const code = text.trim() || `HTTP_${response.status}`;
    return {
      error: {
        code,
        message: fallbackMessages[code] || "操作未完成，請稍後再試。",
        requestId: response.headers.get("x-request-id") || "client-response",
      },
    };
  }
}

type AccessTokenReader = () => Promise<string | null>
type Fetcher = typeof fetch

function buildRequestHeaders(
  init: RequestInit | undefined,
  accessToken: string | null,
  isFormData: boolean,
): Headers {
  const headers = new Headers(init?.headers);
  if (!isFormData && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  if (accessToken) {
    headers.set("authorization", `Bearer ${accessToken}`);
  }
  return headers;
}

export function createApiClient(
  readAccessToken: AccessTokenReader,
  fetcher: Fetcher = fetch,
) {
  return async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const accessToken = await readAccessToken()
    const isFormData = init?.body instanceof FormData
    const response = await fetcher(`/api/v1${path}`, {
      ...init,
      headers: buildRequestHeaders(init, accessToken, isFormData),
    })
    const body = await readResponse<T>(response)
    if (!response.ok || isApiErrorBody(body)) {
      throw new ApiError(response.status, isApiErrorBody(body) ? body : {
        error: {
          code: `HTTP_${response.status}`,
          message: "操作未完成，請稍後再試。",
          requestId: response.headers.get("x-request-id") || "client-response",
        },
      })
    }
    return body.data
  }
}

export const api = createApiClient(async () =>
  (await supabase?.auth.getSession())?.data.session?.access_token ?? null,
)

export const json = (method:string, value:unknown):RequestInit => ({method,body:JSON.stringify(value)})
