import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { ChefRevisitModal } from "./ChefRevisitModal";

describe("ChefRevisitModal (日常回訪對話流)", () => {
  test("renders initial greeting and three quick decision action buttons without emoji", () => {
    const html = renderToStaticMarkup(
      <ChefRevisitModal
        onClose={() => undefined}
        onSelectLowEnergy={() => undefined}
        inventoryNames={["半盒雞蛋", "青江菜"]}
        weeklyTarget={3}
      />
    );

    expect(html).toContain("主廚 CooCoo 相談室");
    expect(html).toContain("日常隨行");
    expect(html).toContain("半盒雞蛋與青江菜");
    expect(html).toContain("腦力透支！要 12 分鐘低體力出餐");
    expect(html).toContain("這週臨時聚餐多，自煮想少 1 餐");
    expect(html).toContain("今晚純放鬆！登記一次外食");
    // Ensure no emoji
    expect(html).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u);
  });
});
