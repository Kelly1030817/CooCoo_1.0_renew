import { describe, expect, mock, test } from "bun:test";
import { createApiClient } from "./client";

describe("API authentication adapter", () => {
  test("sends the Supabase access token to the API", async () => {
    const fetchMock = mock(async () => Response.json({ data: { ok: true } }));
    const api = createApiClient(async () => "session-token", fetchMock as typeof fetch);

    await expect(api<{ ok: boolean }>("/state")).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/state",
      expect.objectContaining({ headers: expect.objectContaining({ authorization: "Bearer session-token" }) }),
    );
  });

  test("turns a plain-text AUTH_REQUIRED response into an actionable API error", async () => {
    const api = createApiClient(
      async () => null,
      mock(async () => new Response("AUTH_REQUIRED", { status: 401 })) as typeof fetch,
    );

    await expect(api("/state")).rejects.toMatchObject({
      status: 401,
      message: "請先登入再使用這項功能。",
    });
  });
});
