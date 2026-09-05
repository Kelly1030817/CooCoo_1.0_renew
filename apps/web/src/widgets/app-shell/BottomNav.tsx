import type { MouseEvent } from "react";
import { pathForRoute, type AppRoute } from "@/app/routing/routes";
import "./BottomNav.css";

const tabs: [AppRoute, string, string][] = [
  ["today", "today", "今日"],
  ["shopping", "shopping_bag", "採買"],
  ["fridge", "kitchen", "冰箱"],
  ["kitchen", "skillet", "廚房"],
  ["dream", "savings", "圓夢"],
];

function shouldUseBrowserNavigation(event: MouseEvent<HTMLAnchorElement>) {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

export function BottomNav({
  active,
  onNavigate,
  urgent,
  shopping,
}: {
  active: AppRoute;
  onNavigate: (route: AppRoute) => void;
  urgent: number;
  shopping: number;
}) {
  return (
    <nav aria-label="主要功能" className="bottom-nav">
      <div>
        {tabs.map(([id, icon, label]) => (
          <a
            key={id}
            href={pathForRoute(id)}
            onClick={(event) => {
              if (shouldUseBrowserNavigation(event)) return;
              event.preventDefault();
              onNavigate(id);
            }}
            aria-current={active === id ? "page" : undefined}
            className={active === id ? "active" : ""}
          >
            <span className={`material-symbols-outlined ${active === id ? "fill" : ""}`}>{icon}</span>
            <span>{label}</span>
            {id === "fridge" && urgent > 0 && <b>{urgent}</b>}
            {id === "shopping" && shopping > 0 && <b>{shopping}</b>}
          </a>
        ))}
      </div>
    </nav>
  );
}
