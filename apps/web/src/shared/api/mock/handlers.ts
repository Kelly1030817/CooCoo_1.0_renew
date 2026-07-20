import { http, HttpResponse } from "msw";
import { Value } from "@sinclair/typebox/value";
import type { TSchema, Static } from "@sinclair/typebox";
import { CooCooService, getRescuePlan, parseShoppingText } from "@coocoo/core";
import { ContractSchemas } from "@coocoo/contracts";
import { BrowserStateRepository } from "./repository";

const service = new CooCooService(new BrowserStateRepository());
const ok = <T>(data: T, status = 200) =>
  HttpResponse.json({ data }, { status });
const error = (cause: unknown, status = 422) => {
  const code = cause instanceof Error ? cause.message : "UNKNOWN_ERROR";
  const messages: Record<string, string> = {
    ITEM_NOT_FOUND: "找不到食材",
    UNSAFE_ACTION: "不安全食材只能丟棄",
    INGREDIENT_REQUIRED: "請至少選擇一項食材",
    duplicate: "這次料理已經記錄過",
  };
  return HttpResponse.json(
    {
      error: {
        code,
        message: messages[code] || "操作未完成，請稍後再試。",
        requestId: crypto.randomUUID(),
      },
    },
    { status },
  );
};
const validated = <T extends TSchema>(schema: T, value: unknown): Static<T> => {
  if (!Value.Check(schema, value)) throw new Error("VALIDATION_ERROR");
  return value as Static<T>;
};

export const handlers = [
  http.get("/api/v1/state", () => ok(service.state())),
  http.get("/api/v1/session", () => ok(service.state().session)),
  http.post("/api/v1/auth/login", async ({ request }) => {
    try {
      return ok(
        service.login(
          validated(ContractSchemas.LoginRequestSchema, await request.json())
            .email,
        ),
      );
    } catch (e) {
      return error(e);
    }
  }),
  http.post("/api/v1/auth/logout", () => ok(service.logout())),
  http.get("/api/v1/goals/current", () => {
    const s = service.state();
    return ok({
      goal: s.activeGoal,
      cookingPlan: s.cookingPlan,
      amountEvents: s.amountEvents,
      habitProgress: s.habitProgress,
      healthAssets: s.healthAssets,
    });
  }),
  http.post("/api/v1/goals", async ({ request }) => {
    try {
      const result = service.createGoal(
        validated(ContractSchemas.GoalDraftSchema, await request.json()),
      );
      return result.valid
        ? ok(result, 201)
        : HttpResponse.json(
            {
              error: {
                code: "VALIDATION_ERROR",
                message: result.errors.join(" "),
                requestId: crypto.randomUUID(),
              },
            },
            { status: 422 },
          );
    } catch (e) {
      return error(e);
    }
  }),
  http.patch("/api/v1/goals/:id", async ({ request }) => {
    try {
      return ok(service.adjustGoal((await request.json()) as never));
    } catch (e) {
      return error(e, 404);
    }
  }),
  http.post("/api/v1/goals/:id/amount-events", async ({ request }) => {
    try {
      return ok(
        service.adjustGoal({
          desiredSaved: Number(
            ((await request.json()) as { desiredSaved: number }).desiredSaved,
          ),
        }),
      );
    } catch (e) {
      return error(e, 404);
    }
  }),
  http.get("/api/v1/inventory", () => ok(service.state().inventory)),
  http.post("/api/v1/inventory", async ({ request }) => {
    try {
      return ok(
        service.addInventory(
          validated(
            ContractSchemas.InventoryCreateSchema,
            await request.json(),
          ),
        ),
        201,
      );
    } catch (e) {
      return error(e);
    }
  }),
  http.delete("/api/v1/inventory/:id", ({ params }) => {
    service.deleteInventory(String(params.id));
    return ok({ id: params.id });
  }),
  http.get("/api/v1/inventory/rescue-candidates", () =>
    ok(
      service
        .state()
        .inventory.filter((i) => i.chamber === "cold" && i.daysLeft <= 3)
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .map((item) => ({ item, plan: getRescuePlan(item) })),
    ),
  ),
  http.post("/api/v1/inventory/:id/rescue", async ({ params, request }) => {
    try {
      const body = validated(
        ContractSchemas.RescueCommandSchema,
        await request.json(),
      );
      return ok(service.rescue(String(params.id), body.action, body.foodSafe));
    } catch (e) {
      return error(e);
    }
  }),
  http.post("/api/v1/recipes/generate", async ({ request }) => {
    try {
      const b = validated(
        ContractSchemas.RecipeGenerateSchema,
        await request.json(),
      );
      return ok(
        service.generateRecipe(b.ingredientIds, b.style, b.excludeTitle),
      );
    } catch (e) {
      return error(e);
    }
  }),
  http.post("/api/v1/cooking/outcomes", async ({ request }) => {
    try {
      const result = service.completeCooking(
        validated(
          ContractSchemas.CookingOutcomeCommandSchema,
          await request.json(),
        ),
      );
      return result.accepted
        ? ok(result, 201)
        : error(new Error(result.reason || "COOKING_REJECTED"), 409);
    } catch (e) {
      return error(e);
    }
  }),
  http.get("/api/v1/shopping-items", () => ok(service.state().shoppingItems)),
  http.post("/api/v1/shopping-items", async ({ request }) => {
    try {
      return ok(
        service.saveShopping(
          validated(ContractSchemas.ShoppingWriteSchema, await request.json()),
        ),
        201,
      );
    } catch (e) {
      return error(e);
    }
  }),
  http.patch("/api/v1/shopping-items/:id", async ({ params, request }) => {
    try {
      const b = validated(
        ContractSchemas.ShoppingWriteSchema,
        await request.json(),
      );
      return ok(service.saveShopping({ ...b, id: String(params.id) }));
    } catch (e) {
      return error(e);
    }
  }),
  http.delete("/api/v1/shopping-items/:id", ({ params }) => {
    service.deleteShopping(String(params.id));
    return ok({ id: params.id });
  }),
  http.post("/api/v1/shopping/restock", () => ok(service.restock())),
  http.post("/api/v1/shopping/parse", async ({ request }) => {
    try {
      return ok(
        parseShoppingText(
          validated(ContractSchemas.ShoppingParseSchema, await request.json())
            .text,
        ),
      );
    } catch (e) {
      return error(e);
    }
  }),
  http.post("/api/v1/shopping/analyze", () =>
    ok({
      summary: "優先補足即期餐需要的蔬菜與蛋白質。",
      recommendations: service.state().shoppingItems.slice(0, 3),
    }),
  ),
  http.get("/api/v1/settings/fridge", () => ok(service.state().fridgeProfile)),
  http.put("/api/v1/settings/fridge", async ({ request }) => {
    try {
      return ok(
        service.updateSettings({
          fridgeProfile: validated(
            ContractSchemas.FridgeProfileSchema,
            await request.json(),
          ),
        }).fridgeProfile,
      );
    } catch (e) {
      return error(e);
    }
  }),
  http.get("/api/v1/settings/cookware", () => ok(service.state().cookware)),
  http.put("/api/v1/settings/cookware", async ({ request }) => {
    try {
      return ok(
        service.updateSettings({
          cookware: validated(
            ContractSchemas.CookwareListSchema,
            await request.json(),
          ),
        }).cookware,
      );
    } catch (e) {
      return error(e);
    }
  }),
  http.post("/api/v1/__mock/reset", () => ok(service.reset())),
];
