export const appRoutePaths = {
  today: "/today",
  shopping: "/shopping",
  fridge: "/fridge",
  kitchen: "/kitchen",
  dream: "/dream",
} as const;

export type AppRoute = keyof typeof appRoutePaths;

const routesByPath = Object.fromEntries(
  Object.entries(appRoutePaths).map(([route, path]) => [path, route]),
) as Record<string, AppRoute>;

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
