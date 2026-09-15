import { describe, expect, it } from "vitest";
import {
  appRoutePaths,
  isAppPath,
  pathForRoute,
  routeFromPathname,
  type AppRoute,
} from "./routes";

const appRoutes: AppRoute[] = ["today", "shopping", "fridge", "recipes", "me", "onboarding"];

describe("CooCoo app routes", () => {
  it.each(appRoutes.map((route) => [route, appRoutePaths[route]] as const))(
    "maps %s to %s and back",
    (route, path) => {
      expect(pathForRoute(route)).toBe(path);
      expect(routeFromPathname(path)).toBe(route);
      expect(isAppPath(path)).toBe(true);
    },
  );

  it("accepts trailing slashes without creating a different page", () => {
    expect(routeFromPathname("/shopping/")).toBe("shopping");
    expect(isAppPath("/shopping/")).toBe(true);
  });

  it("uses today as the safe entry page for root and unknown paths", () => {
    expect(routeFromPathname("/")).toBe("today");
    expect(routeFromPathname("/not-a-page")).toBe("today");
    expect(isAppPath("/")).toBe(false);
    expect(isAppPath("/not-a-page")).toBe(false);
  });
});
