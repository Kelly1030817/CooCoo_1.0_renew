import { describe, expect, mock, test } from "bun:test";
import { AppStateSchema } from "@coocoo/contracts";
import { createSeedState } from "@coocoo/core";
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

  test("rejects a /state payload that fails AppStateSchema", async () => {
    const api = createApiClient(
      async () => null,
      async () => Response.json({ data: { version: 1 } }),
    );

    await expect(api("/state", undefined, AppStateSchema)).rejects.toMatchObject({
      body: { error: { code: "CONTRACT_MISMATCH" } },
      message: "伺服器回傳了與契約不符的資料。",
    });
  });

  test("accepts a /state payload that matches AppStateSchema", async () => {
    const state = createSeedState();
    const api = createApiClient(
      async () => null,
      async () => Response.json({ data: state }),
    );

    await expect(api("/state", undefined, AppStateSchema)).resolves.toEqual(state);
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
