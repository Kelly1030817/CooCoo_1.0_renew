import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { useUi } from "./ui-context";

function Probe() {
  useUi();
  return null;
}

describe("useUi", () => {
  test("throws when rendered outside Providers", () => {
    expect(() => renderToStaticMarkup(<Probe />)).toThrow("useUi must be used within Providers");
  });
});
