import { Elysia } from "elysia";
import { CooCooService, getRescuePlan, parseShoppingText } from "@coocoo/core";
import type { GoalDraft, InventoryItem } from "@coocoo/contracts";
import { ContractSchemas } from "@coocoo/contracts";
import { MemoryStateRepository } from "./shared/infrastructure/memory-state.repository";

const requestId = () => crypto.randomUUID();
const ok = <T>(data: T) => ({ data });
const fail = (error: unknown) => {
  const code = error instanceof Error ? error.message : "UNKNOWN_ERROR";
  const messages: Record<string, string> = {
    GOAL_NOT_FOUND: "找不到主要目標",
    ITEM_NOT_FOUND: "找不到食材",
    UNSAFE_ACTION: "不安全食材只能丟棄",
    INGREDIENT_REQUIRED: "請至少選擇一項食材",
  };
  return {
    error: {
      code,
      message: messages[code] || "操作未完成，請稍後再試。",
      requestId: requestId(),
    },
  };
};

export const repository = new MemoryStateRepository();
export const service = new CooCooService(repository);

export const app = new Elysia({ name: "coocoo-api" })
  .onError(({ code, error, set }) => {
    if (code !== "VALIDATION") return;
    set.status = 422;
    return { error: { code: "VALIDATION_ERROR", message: error.message, requestId: requestId() } };
  })
  .get("/api/v1/health", () => ok({ status: "ok" }))
  .get("/api/v1/state", () => ok(service.state()))
  .get("/api/v1/session", () => ok(service.state().session))
  .post("/api/v1/auth/login", ({ body }) => ok(service.login(body.email)), {
    body: ContractSchemas.LoginRequestSchema,
  })
  .post("/api/v1/auth/logout", () => ok(service.logout()))
  .get("/api/v1/goals/current", () => {
    const s = service.state();
    return ok({
      goal: s.activeGoal,
      cookingPlan: s.cookingPlan,
      amountEvents: s.amountEvents,
      habitProgress: s.habitProgress,
      healthAssets: s.healthAssets,
    });
  })
  .post(
    "/api/v1/goals",
    ({ body, set }) => {
      const result = service.createGoal(body as GoalDraft);
      if (!result.valid) {
        set.status = 422;
        return {
          error: {
            code: "VALIDATION_ERROR",
            message: result.errors.join(" "),
            requestId: requestId(),
          },
        };
      }
      return ok(result);
    },
    { body: ContractSchemas.GoalDraftSchema },
  )
  .patch(
    "/api/v1/goals/:id",
    ({ body, set }) => {
      try {
        return ok(service.adjustGoal(body as never));
      } catch (e) {
        set.status = 404;
        return fail(e);
      }
    },
    { body: ContractSchemas.GoalPatchSchema },
  )
  .post(
    "/api/v1/goals/:id/amount-events",
    ({ body, set }) => {
      try {
        return ok(
          service.adjustGoal({ desiredSaved: Number(body.desiredSaved) }),
        );
      } catch (e) {
        set.status = 404;
        return fail(e);
      }
    },
    { body: ContractSchemas.AmountEventCommandSchema },
  )
  .get("/api/v1/inventory", () => ok(service.state().inventory))
  .post(
    "/api/v1/inventory",
    ({ body }) => ok(service.addInventory(body as Omit<InventoryItem, "id">)),
    { body: ContractSchemas.InventoryCreateSchema },
  )
  .delete("/api/v1/inventory/:id", ({ params }) => {
    service.deleteInventory(params.id);
    return ok({ id: params.id });
  })
  .get("/api/v1/inventory/rescue-candidates", () =>
    ok(
      service
        .state()
        .inventory.filter((i) => i.chamber === "cold" && i.daysLeft <= 3)
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .map((item) => ({ item, plan: getRescuePlan(item) })),
    ),
  )
  .post(
    "/api/v1/inventory/:id/rescue",
    ({ params, body, set }) => {
      try {
        return ok(service.rescue(params.id, body.action, body.foodSafe));
      } catch (e) {
        set.status = 422;
        return fail(e);
      }
    },
    { body: ContractSchemas.RescueCommandSchema },
  )
  .post(
    "/api/v1/recipes/generate",
    ({ body, set }) => {
      try {
        return ok(
          service.generateRecipe(
            body.ingredientIds,
            body.style,
            body.excludeTitle,
          ),
        );
      } catch (e) {
        set.status = 422;
        return fail(e);
      }
    },
    { body: ContractSchemas.RecipeGenerateSchema },
  )
  .post(
    "/api/v1/cooking/outcomes",
    ({ body, set }) => {
      const result = service.completeCooking(body);
      if (!result.accepted) {
        set.status = 409;
        return fail(new Error(result.reason || "COOKING_REJECTED"));
      }
      return ok(result);
    },
    { body: ContractSchemas.CookingOutcomeCommandSchema },
  )
  .get("/api/v1/shopping-items", () => ok(service.state().shoppingItems))
  .post(
    "/api/v1/shopping-items",
    ({ body }) => ok(service.saveShopping(body)),
    { body: ContractSchemas.ShoppingWriteSchema },
  )
  .patch(
    "/api/v1/shopping-items/:id",
    ({ params, body }) => ok(service.saveShopping({ ...body, id: params.id })),
    { body: ContractSchemas.ShoppingWriteSchema },
  )
  .delete("/api/v1/shopping-items/:id", ({ params }) => {
    service.deleteShopping(params.id);
    return ok({ id: params.id });
  })
  .post("/api/v1/shopping/restock", () => ok(service.restock()))
  .post(
    "/api/v1/shopping/parse",
    ({ body }) => ok(parseShoppingText(body.text)),
    { body: ContractSchemas.ShoppingParseSchema },
  )
  .post("/api/v1/shopping/analyze", () =>
    ok({
      summary: "優先補足即期餐需要的蔬菜與蛋白質。",
      recommendations: service.state().shoppingItems.slice(0, 3),
    }),
  )
  .get("/api/v1/settings/fridge", () => ok(service.state().fridgeProfile))
  .put(
    "/api/v1/settings/fridge",
    ({ body }) =>
      ok(service.updateSettings({ fridgeProfile: body }).fridgeProfile),
    { body: ContractSchemas.FridgeProfileSchema },
  )
  .get("/api/v1/settings/cookware", () => ok(service.state().cookware))
  .put(
    "/api/v1/settings/cookware",
    ({ body }) => ok(service.updateSettings({ cookware: body }).cookware),
    { body: ContractSchemas.CookwareListSchema },
  )
  .post("/api/v1/__mock/reset", () => ok(service.reset()));
