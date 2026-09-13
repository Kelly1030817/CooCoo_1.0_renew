import type { AppState, CookingOutcome, PlannedMeal, TodayMission } from "@coocoo/contracts";
import { EXP_POINTS } from "./growth";

const TAIPEI_TIME_ZONE = "Asia/Taipei";

export function dateInTimeZone(value: Date | string, timeZone = TAIPEI_TIME_ZONE) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const read = (type: "year" | "month" | "day") => parts.find((part) => part.type === type)?.value;
  const year = read("year");
  const month = read("month");
  const day = read("day");
  return year && month && day ? `${year}-${month}-${day}` : null;
}

export function deriveTodayMissions(
  state: Pick<AppState, "expEvents" | "inventory">,
  now: Date | string = new Date(),
): TodayMission[] {
  const today = dateInTimeZone(now) ?? "";
  const todaysEvents = state.expEvents.filter((event) => dateInTimeZone(event.createdAt) === today);
  const has = (type: "cooking_completed" | "prepared_serving_eaten" | "expiring_ingredient_used") =>
    todaysEvents.some((event) => event.type === type);
  return [
    {
      key: "cook_today",
      label: "完成今天的料理",
      reward: EXP_POINTS.cooking_completed,
      done: has("cooking_completed"),
      source: "cooking_completed",
    },
    {
      key: "eat_prepared",
      label: "吃掉 1 份熟食",
      reward: EXP_POINTS.prepared_serving_eaten,
      done: has("prepared_serving_eaten"),
      source: "prepared_serving_eaten",
    },
    {
      key: "use_expiring",
      label: "用掉即期食材",
      reward: EXP_POINTS.expiring_ingredient_used,
      done: has("expiring_ingredient_used"),
      source: "expiring_ingredient_used",
      hint: state.inventory.filter((item) => item.daysLeft <= 3).length,
    },
  ];
}

export function withTodayMissions<T extends AppState>(state: T, now: Date | string = new Date()): T {
  return { ...state, missions: deriveTodayMissions(state, now) };
}

export function todayMealNumberLabel(meals: PlannedMeal[], now: Date | string = new Date()) {
  const today = dateInTimeZone(now);
  if (!today) return "今日餐點";
  const todaysMeals = meals
    .filter((meal) => meal.date === today && meal.status !== "cancelled")
    .sort((left, right) => left.slot.localeCompare(right.slot));
  const plannedIndex = todaysMeals.findIndex((meal) => meal.status === "planned");
  if (plannedIndex >= 0) return `今日第 ${plannedIndex + 1} 餐`;
  const cookedIndex = todaysMeals.findIndex((meal) => meal.status === "cooked");
  return cookedIndex >= 0 ? `今日第 ${cookedIndex + 1} 餐 · 已煮` : "今日餐點";
}

export function completedOutcomeDates(outcomes: CookingOutcome[]) {
  return new Set(outcomes.map((outcome) => dateInTimeZone(outcome.createdAt)).filter(Boolean));
}

export function mealsWithRecordedOutcomes(meals: PlannedMeal[], outcomes: CookingOutcome[]) {
  const completedKeys = new Set(
    outcomes.map((outcome) => `${dateInTimeZone(outcome.createdAt)}::${outcome.mealName}`),
  );
  return meals.map((meal) => ({
    ...meal,
    status: meal.status === "planned" && completedKeys.has(`${meal.date}::${meal.title}`)
      ? "cooked" as const
      : meal.status,
  }));
}
