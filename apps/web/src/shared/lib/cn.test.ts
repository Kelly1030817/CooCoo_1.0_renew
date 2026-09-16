import { describe, expect, test } from "bun:test";
import { cn } from "./cn";

describe("cn", () => {
  test("later Tailwind classes win conflicts", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });
});
