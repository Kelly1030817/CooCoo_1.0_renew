import { describe, expect, test } from "vitest";
import { resolveOnboardingStep } from "./useOnboardingStep";

function withMockWindow(run: () => void) {
  let href = "http://localhost/onboarding";
  const prev = globalThis.window;
  globalThis.window = {
    location: {
      get href() {
        return href;
      },
      get search() {
        return new URL(href).search;
      },
      get pathname() {
        return new URL(href).pathname;
      },
      get hash() {
        return new URL(href).hash;
      },
    },
    history: {
      state: null,
      replaceState(_state: unknown, _title: string, url?: string | URL | null) {
        if (url) {
          href = new URL(String(url), "http://localhost").href;
        }
      },
    },
    scrollTo: () => {},
  } as Window & typeof globalThis;
  try {
    run();
  } finally {
    globalThis.window = prev;
  }
}

describe("resolveOnboardingStep", () => {
  test("prefers a valid step query over the saved draft step", () => {
    withMockWindow(() => {
      window.history.replaceState(window.history.state, "", "/onboarding?step=3");
      expect(resolveOnboardingStep(1, 2)).toBe(3);
    });
  });

  test("falls back to initial then saved step", () => {
    withMockWindow(() => {
      window.history.replaceState(window.history.state, "", "/onboarding");
      expect(resolveOnboardingStep(2, 1)).toBe(2);
      expect(resolveOnboardingStep(undefined, 3)).toBe(3);
    });
  });
});
