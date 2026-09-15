import { describe, expect, mock, test } from "bun:test";
import { createApiClient } from "./client";

describe("API authentication adapter", () => {
  test("sends the Supabase access token to the API", async () => {
    const fetchImpl: typeof fetch = async () => Response.json({ data: { ok: true } });
    const fetchMock = mock(fetchImpl);
    const api = createApiClient(async () => "session-token", fetchMock);

    await expect(api<{ ok: boolean }>("/state")).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call = fetchMock.mock.calls[0];
    expect(call?.[0]).toBe("/api/v1/state");
    const init = call?.[1];
    expect(init).toBeDefined();
    const headers = new Headers(init?.headers);
    expect(headers.get("authorization")).toBe("Bearer session-token");
  });

  test("turns a plain-text AUTH_REQUIRED response into an actionable API error", async () => {
    const fetchImpl: typeof fetch = async () => new Response("AUTH_REQUIRED", { status: 401 });
    const api = createApiClient(async () => null, fetchImpl);

    await expect(api("/state")).rejects.toMatchObject({
      status: 401,
      message: "請先登入再使用這項功能。",
    });
  });
});
