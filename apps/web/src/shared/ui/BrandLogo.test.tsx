import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { BrandLogo } from "./BrandLogo";

describe("BrandLogo Component", () => {
  test("renders CooCoo chef mascot SVG logo and title aligned with onboarding", () => {
    const html = renderToStaticMarkup(<BrandLogo />);

    // Brand text
    expect(html).toContain("CooCoo 煮煮");

    // Chef hat mascot SVG matching onboarding
    expect(html).toContain("M6 13.87A4 4 0 0 1 7.41 6");
    expect(html).toContain("chef-eyes");

    // Refrigerator icon is completely absent
    expect(html).not.toMatch(/>\s*kitchen\s*</);

    // 100% SVG, no emoji
    expect(html).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u);
  });
});
