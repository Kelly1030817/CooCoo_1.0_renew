import type { MouseEvent } from "react";
import {
  BookOpen,
  CalendarDays,
  Refrigerator,
  ShoppingBag,
  User,
  type LucideIcon,
} from "lucide-react";
import { pathForRoute, type AppRoute } from "@/app/routing/routes";
import { cn } from "@/shared/lib/cn";

const tabs: [AppRoute, LucideIcon, string][] = [
  ["today", CalendarDays, "今日"],
  ["shopping", ShoppingBag, "採買"],
  ["fridge", Refrigerator, "冰箱"],
  ["recipes", BookOpen, "食譜"],
  ["me", User, "我的"],
];

function shouldUseBrowserNavigation(event: MouseEvent<HTMLAnchorElement>) {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

export type BottomNavProps = {
  active: AppRoute;
  onNavigate: (route: AppRoute) => void;
  urgent: number;
  shopping: number;
};

export function BottomNav({ active, onNavigate, urgent, shopping }: BottomNavProps) {
  return (
    <nav
      aria-label="主要功能"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-[#e7ddca] bg-[rgb(255_253_244_/_0.96)] shadow-[0_-8px_30px_rgb(61_64_91_/_0.08)] backdrop-blur-[16px]"
    >
      <div className="mx-auto grid h-[72px] max-w-[600px] grid-cols-5 px-2 pt-1 pb-[calc(4px+env(safe-area-inset-bottom))]">
        {tabs.map(([id, Icon, label]) => {
          const isActive = active === id;
          return (
            <a
              key={id}
              href={pathForRoute(id)}
              onClick={(event) => {
                if (shouldUseBrowserNavigation(event)) return;
                event.preventDefault();
                onNavigate(id);
              }}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex min-h-[52px] min-w-0 flex-col items-center justify-center gap-[3px] text-[10px] font-extrabold no-underline",
                isActive
                  ? "text-[#8f3d28] before:absolute before:top-0 before:h-[3px] before:w-7 before:rounded-b-md before:bg-[#e8a849] before:content-['']"
                  : "text-[#777367]",
              )}
            >
              <Icon
                aria-hidden="true"
                className="size-[23px]"
                strokeWidth={isActive ? 2.4 : 1.75}
              />
              <span>{label}</span>
              {id === "fridge" && urgent > 0 && (
                <b className="absolute top-0.5 right-[15%] grid h-[17px] min-w-[17px] place-items-center rounded-full border-2 border-[#fff7e8] bg-[#b94c36] text-[9px] font-extrabold text-white">
                  {urgent}
                </b>
              )}
              {id === "shopping" && shopping > 0 && (
                <b className="absolute top-0.5 right-[15%] grid h-[17px] min-w-[17px] place-items-center rounded-full border-2 border-[#fff7e8] bg-[#b94c36] text-[9px] font-extrabold text-white">
                  {shopping}
                </b>
              )}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
