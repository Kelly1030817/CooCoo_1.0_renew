import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ShoppingChefChatModal } from "./ShoppingChefChatModal";
import type { MealTask } from "@coocoo/contracts";

const queryClient = new QueryClient();

const mockActiveTask: MealTask = {
  id: "task-1",
  date: "2026-09-14",
  slot: "dinner",
  recipe: {
    recipeId: "recipe-teriyaki-chicken",
    title: "照燒雞肉蓋飯",
    servings: 2,
    prepMinutes: 10,
    totalMinutes: 20,
    cookwareTypes: ["pan"],
    ingredients: [
      { ingredientKey: "chicken_thigh", name: "去骨雞腿肉", quantity: 2, unit: "隻", isPantryStaple: false },
      { ingredientKey: "scallion", name: "青蔥", quantity: 2, unit: "支", isPantryStaple: false },
    ],
    steps: [
      { id: "step-1", instruction: "雞腿肉皮朝下煎至金黃", detailedInstruction: "大火熱鍋後轉中火" },
    ],
    safetyReviewed: true,
  },
  plannedTotalServings: 2,
  status: "needs_shopping",
  shortages: [
    { id: "shortage-scallion", ingredientKey: "scallion", name: "青蔥", quantity: 2, unit: "支", resolution: "needed" },
  ],
  currentMeal: { date: "2026-09-14", slot: "dinner", servings: 2 },
  nextMeal: { date: "2026-09-15", slot: "lunch", servings: 0, strategy: "cook_extra" },
  revision: 1,
};

describe("ShoppingChefChatModal (AI 陪我逛對話框)", () => {
  test("renders Onboarding-aligned header, quota chip, and context greeting without emoji", () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <ShoppingChefChatModal
          onClose={() => undefined}
          activeTask={mockActiveTask}
          rescuedItems={[
            { id: "inv-1", name: "傳統板豆腐", qty: 1, unit: "盒", storageLocation: "cold", expiresOn: "2026-09-15", daysLeft: 1 },
          ]}
        />
      </QueryClientProvider>
    );

    // Header & identity
    expect(html).toContain("主廚 CooCoo");
    expect(html).toContain("聆聽日常");
    expect(html).toContain("口袋自煮夥伴");
    expect(html).toContain("30 則");

    // Context greeting
    expect(html).toContain("照燒雞肉蓋飯");
    expect(html).toContain("青蔥");
    expect(html).toContain("傳統板豆腐");

    // Action proposal card
    expect(html).toContain("主廚現場替代提案");
    expect(html).toContain("洋蔥");
    expect(html).toContain("採納建議：改買洋蔥 1 顆");

    // Quick chips
    expect(html).toContain("青蔥缺貨怎麼辦？");
    expect(html).toContain("即期食材如何順便用？");
    expect(html).toContain("預算 100 元內怎麼買？");

    // Strictly no emoji
    expect(html).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u);
  });
});
