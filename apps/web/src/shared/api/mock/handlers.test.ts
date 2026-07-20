import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
import { setupServer } from "msw/node";

let server: ReturnType<typeof setupServer>;
const api = (path: string, init?: RequestInit) =>
  fetch(`http://localhost/api/v1${path}`, init);

beforeAll(async () => {
  Object.defineProperty(globalThis, "location", {
    configurable: true,
    value: new URL("http://localhost"),
  });
  const { handlers } = await import("./handlers");
  server = setupServer(...handlers);
  server.listen({ onUnhandledRequest: "error" });
});
beforeEach(async () => {
  await api("/__mock/reset", { method: "POST" });
});
afterAll(() => server.close());

describe("MSW contract adapter", () => {
  test("uses the shared success envelope and deterministic seed", async () => {
    const response = await api("/inventory");
    const body = (await response.json()) as { data: Array<{ name: string }> };
    expect(response.status).toBe(200);
    expect(body.data.map((item) => item.name)).toEqual([
      "酪梨",
      "胡蘿蔔",
      "起司",
      "雞蛋",
      "鮭魚",
      "綜合莓果",
    ]);
  });

  test("rejects an invalid recipe fixture with the public error envelope", async () => {
    const response = await api("/recipes/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ingredientIds: [], style: "japanese" }),
    });
    const body = (await response.json()) as {
      error: { code: string; message: string; requestId: string };
    };
    expect(response.status).toBe(422);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(typeof body.error.requestId).toBe("string");
  });

  test("reset restores the fixed seed after a mutation", async () => {
    await api("/inventory/i1", { method: "DELETE" });
    await api("/__mock/reset", { method: "POST" });
    const body = (await (await api("/inventory")).json()) as {
      data: Array<{ id: string }>;
    };
    expect(body.data.some((item) => item.id === "i1")).toBe(true);
  });
});
