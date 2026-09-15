export const appRoutePaths = {
  today: "/today",
  shopping: "/shopping",
  fridge: "/fridge",
  recipes: "/recipes",
  me: "/me",
  onboarding: "/onboarding",
} as const;

export type AppRoute = keyof typeof appRoutePaths;

const APP_ROUTES: AppRoute[] = ["today", "shopping", "fridge", "recipes", "me", "onboarding"];
const routesByPath: Record<string, AppRoute> = {};
for (const route of APP_ROUTES) {
  routesByPath[appRoutePaths[route]] = route;
}

function normalizePathname(pathname: string) {
  if (!pathname || pathname === "/") return "/";
  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return withLeadingSlash.replace(/\/+$/, "");
}

export function pathForRoute(route: AppRoute) {
  return appRoutePaths[route];
}

export function isAppPath(pathname: string) {
  return normalizePathname(pathname) in routesByPath;
}

export function routeFromPathname(pathname: string): AppRoute {
  return routesByPath[normalizePathname(pathname)] ?? "today";
}
