import { describe, expect, test } from "vitest";
import { addPreferredFlavor, parseFlavorInput, removePreferredFlavor } from "./flavors";

describe("preferred flavor tags", () => {
  test("parses single flavor and trims whitespace", () => {
    expect(parseFlavorInput("  清爽  ")).toEqual(["清爽"]);
    expect(parseFlavorInput("")).toEqual([]);
    expect(parseFlavorInput("   ")).toEqual([]);
  });

  test("parses multiple flavors separated by Chinese punctuation or whitespace", () => {
    expect(parseFlavorInput("清爽、微辣，台式 家常,不甜")).toEqual([
      "清爽",
      "微辣",
      "台式",
      "家常",
      "不甜",
    ]);
  });

  test("adds new flavor and prevents duplicates", () => {
    const current = ["清爽"];
    expect(addPreferredFlavor(current, "不辣")).toEqual(["清爽", "不辣"]);
    expect(addPreferredFlavor(current, "清爽")).toEqual(["清爽"]);
    expect(addPreferredFlavor(current, "  ")).toEqual(["清爽"]);
  });

  test("removes selected flavor", () => {
    const current = ["清爽", "不辣", "微甜"];
    expect(removePreferredFlavor(current, "不辣")).toEqual(["清爽", "微甜"]);
    expect(removePreferredFlavor(current, "不存在")).toEqual(["清爽", "不辣", "微甜"]);
  });
});
