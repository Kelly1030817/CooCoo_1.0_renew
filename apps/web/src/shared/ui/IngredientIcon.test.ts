import { describe, it, expect } from "bun:test";
import { detectIngredientCategory } from "./ingredient-category";

describe("Scheme 1 Ingredient Category Detection", () => {
  it("detects melons and gourds correctly", () => {
    expect(detectIngredientCategory("櫛瓜")).toBe("melon");
    expect(detectIngredientCategory("南瓜")).toBe("melon");
    expect(detectIngredientCategory("絲瓜")).toBe("melon");
    expect(detectIngredientCategory("冬瓜")).toBe("melon");
    expect(detectIngredientCategory("小黃瓜")).toBe("melon");
  });

  it("detects mushrooms correctly", () => {
    expect(detectIngredientCategory("鴻喜菇")).toBe("mushroom");
    expect(detectIngredientCategory("金針菇")).toBe("mushroom");
    expect(detectIngredientCategory("杏鮑菇")).toBe("mushroom");
    expect(detectIngredientCategory("黑木耳")).toBe("mushroom");
  });

  it("detects roots and tubers correctly", () => {
    expect(detectIngredientCategory("山藥")).toBe("root");
    expect(detectIngredientCategory("地瓜")).toBe("root");
    expect(detectIngredientCategory("馬鈴薯")).toBe("root");
    expect(detectIngredientCategory("紅蘿蔔")).toBe("root");
    expect(detectIngredientCategory("青蔥")).toBe("root");
  });

  it("detects leafy vegetables correctly", () => {
    expect(detectIngredientCategory("高麗菜")).toBe("leafy");
    expect(detectIngredientCategory("空心菜")).toBe("leafy");
    expect(detectIngredientCategory("地瓜葉")).toBe("leafy");
    expect(detectIngredientCategory("菠菜")).toBe("leafy");
  });

  it("detects beans, eggs, and dairy correctly", () => {
    expect(detectIngredientCategory("洗選雞蛋")).toBe("egg_dairy_bean");
    expect(detectIngredientCategory("板豆腐")).toBe("egg_dairy_bean");
    expect(detectIngredientCategory("無糖豆漿")).toBe("egg_dairy_bean");
    expect(detectIngredientCategory("起司片")).toBe("egg_dairy_bean");
  });

  it("detects meats and seafood correctly", () => {
    expect(detectIngredientCategory("豬五花肉片")).toBe("meat_seafood");
    expect(detectIngredientCategory("去骨雞腿肉")).toBe("meat_seafood");
    expect(detectIngredientCategory("鮭魚排")).toBe("meat_seafood");
    expect(detectIngredientCategory("冷凍白蝦仁")).toBe("meat_seafood");
  });

  it("detects staples correctly", () => {
    expect(detectIngredientCategory("白飯")).toBe("staple");
    expect(detectIngredientCategory("關廟麵條")).toBe("staple");
    expect(detectIngredientCategory("冷凍烏龍麵")).toBe("staple");
    expect(detectIngredientCategory("高麗菜水餃")).toBe("staple");
  });

  it("detects condiments and preserves correctly", () => {
    expect(detectIngredientCategory("食用油")).toBe("condiment");
    expect(detectIngredientCategory("薄鹽醬油")).toBe("condiment");
    expect(detectIngredientCategory("外婆醃脆瓜")).toBe("condiment");
    expect(detectIngredientCategory("韓式泡菜")).toBe("condiment");
  });
});
