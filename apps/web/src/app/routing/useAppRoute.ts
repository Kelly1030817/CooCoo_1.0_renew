import { useCallback, useEffect, useState } from "react";
import {
  isAppPath,
  pathForRoute,
  routeFromPathname,
  type AppRoute,
} from "./routes";

function readRoute() {
  return routeFromPathname(window.location.pathname);
}

export function useAppRoute() {
  const [route, setRoute] = useState<AppRoute>(readRoute);

  useEffect(() => {
    const canonicalRoute = readRoute();
    const canonicalPath = pathForRoute(canonicalRoute);

    if (!isAppPath(window.location.pathname)) {
      window.history.replaceState(
        window.history.state,
        "",
        `${canonicalPath}${window.location.search}${window.location.hash}`,
      );
    }

    const handlePopState = () => setRoute(readRoute());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = useCallback((nextRoute: AppRoute) => {
    const nextPath = pathForRoute(nextRoute);
    if (window.location.pathname !== nextPath) {
      window.history.pushState(null, "", nextPath);
    }
    setRoute(nextRoute);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return { route, navigate };
}
