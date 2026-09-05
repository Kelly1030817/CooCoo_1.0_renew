import type {
  AmountEvent,
  AppState,
  CookingOutcome,
  GoalDraft,
  GoalMilestone,
  HealthAssets,
  InventoryItem,
  MoneyGoal,
  OnboardingProfile,
  Recipe,
  RescuePlan,
  ShoppingItem,
} from "@coocoo/contracts";

export * from "./mvp";
import { completeCookingSession } from "./mvp";

const DAY_MS = 86_400_000;
const int = (value: unknown, fallback = 0) =>
  Number.isFinite(Number(value)) ? Math.round(Number(value)) : fallback;
const nonNegative = (value: unknown, fallback = 0) =>
  Math.max(0, int(value, fallback));
const dateOnly = (date: Date) =>
  Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
export const parseDateOnly = (value: unknown) =>
  /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ""))
    ? new Date(`${String(value)}T00:00:00.000Z`)
    : null;

export const calculateAverageEatingOutCost = (
  total: unknown,
  meals: unknown,
) => {
  const count = nonNegative(meals);
  return count === 0 ? null : Math.round(nonNegative(total) / count);
};
export const suggestHomeCookBudget = (cost: unknown, ratio = 0.6) =>
  Math.round(nonNegative(cost) * Math.max(0, ratio));
export const calculateEstimatedSaving = (outside: unknown, home: unknown) =>
  Math.max(0, nonNegative(outside) - nonNegative(home));
export const calculateCurrentSaved = (
  events: Pick<AmountEvent, "amount">[] = [],
) =>
  Math.max(
    0,
    events.reduce((sum, event) => sum + int(event.amount), 0),
  );
export const createBalanceAdjustment = (
  events: Pick<AmountEvent, "amount">[],
  desired: unknown,
) => {
  const currentBalance = calculateCurrentSaved(events);
  const nextBalance = nonNegative(desired);
  return { amount: nextBalance - currentBalance, currentBalance, nextBalance };
};

export function validateMilestonePercents(
  shortPercent = 25,
  mediumPercent = 60,
) {
  const errors: string[] = [];
  if (!Number.isFinite(shortPercent) || shortPercent <= 0)
    errors.push("短期門檻必須大於 0%。");
  if (!Number.isFinite(mediumPercent) || mediumPercent >= 100)
    errors.push("中期門檻必須小於 100%。");
  if (shortPercent >= mediumPercent) errors.push("短期門檻必須小於中期門檻。");
  return { valid: errors.length === 0, errors, shortPercent, mediumPercent };
}

export function createMilestones(
  targetAmount: unknown,
  options: Partial<GoalDraft> = {},
) {
  const target = nonNegative(targetAmount);
  const validation = validateMilestonePercents(
    options.shortPercent ?? 25,
    options.mediumPercent ?? 60,
  );
  if (!validation.valid)
    return { milestones: [] as GoalMilestone[], errors: validation.errors };
  return {
    errors: [] as string[],
    milestones: [
      {
        id: "short",
        label: options.shortLabel || "第一段累積",
        percent: validation.shortPercent,
        targetAmount: Math.round((target * validation.shortPercent) / 100),
      },
      {
        id: "medium",
        label: options.mediumLabel || "穩定前進",
        percent: validation.mediumPercent,
        targetAmount: Math.round((target * validation.mediumPercent) / 100),
      },
      {
        id: "long",
        label: options.longLabel || "完成主要目標",
        percent: 100,
        targetAmount: target,
      },
    ],
  };
}

export function calculateGoalProjection(
  input: {
    targetAmount?: number;
    currentSavedAmount?: number;
    estimatedSavingPerMeal?: number;
    weeklyCookingMeals?: number;
    targetDate?: string | null;
    now?: Date;
  } = {},
) {
  const targetAmount = nonNegative(input.targetAmount);
  const currentSavedAmount = nonNegative(input.currentSavedAmount);
  const estimatedSavingPerMeal = nonNegative(input.estimatedSavingPerMeal);
  const weeklyCookingMeals = nonNegative(input.weeklyCookingMeals);
  const remainingAmount = Math.max(0, targetAmount - currentSavedAmount);
  const now =
    input.now && !Number.isNaN(input.now.getTime())
      ? new Date(input.now)
      : new Date();
  const base = {
    status: "ready",
    targetAmount,
    currentSavedAmount,
    remainingAmount,
    mealsNeeded: null as number | null,
    estimatedWeeks: null as number | null,
    estimatedDate: null as string | null,
    targetDate: input.targetDate || null,
    requiredWeeklyMeals: null as number | null,
    scheduleStatus: null as string | null,
  };
  if (targetAmount <= 0) return { ...base, status: "invalid_target" };
  if (remainingAmount === 0)
    return { ...base, status: "completed", mealsNeeded: 0, estimatedWeeks: 0 };
  if (estimatedSavingPerMeal <= 0) return { ...base, status: "no_saving" };
  const mealsNeeded = Math.ceil(remainingAmount / estimatedSavingPerMeal);
  const result = { ...base, mealsNeeded };
  const targetDate = parseDateOnly(input.targetDate);
  if (targetDate) {
    const today = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const remainingDays = Math.ceil(
      (targetDate.getTime() - today.getTime()) / DAY_MS,
    );
    if (remainingDays < 0) result.scheduleStatus = "overdue";
    else {
      result.requiredWeeklyMeals = Math.ceil(
        mealsNeeded / Math.max(remainingDays / 7, 1 / 7),
      );
      result.scheduleStatus =
        weeklyCookingMeals > result.requiredWeeklyMeals
          ? "ahead"
          : weeklyCookingMeals === result.requiredWeeklyMeals
            ? "on_track"
            : "behind";
    }
  }
  if (weeklyCookingMeals <= 0) return { ...result, status: "no_frequency" };
  result.estimatedWeeks = mealsNeeded / weeklyCookingMeals;
  result.estimatedDate = dateOnly(
    new Date(now.getTime() + Math.ceil(result.estimatedWeeks * 7) * DAY_MS),
  );
  return result;
}

export function createGoalFromDraft(
  draft: GoalDraft,
  options: { id?: string; now?: Date } = {},
) {
  const errors: string[] = [];
  const eatingOutCost =
    calculateAverageEatingOutCost(draft.eatingOutTotal, draft.eatingOutMeals) ??
    nonNegative(draft.directEatingOutCost);
  const milestones = createMilestones(draft.targetAmount, draft);
  if (!draft.name.trim()) errors.push("請輸入目標名稱。");
  if (nonNegative(draft.targetAmount) <= 0)
    errors.push("目標金額必須大於 0 元。");
  if (eatingOutCost <= 0) errors.push("請提供可用的平均外食餐費。");
  if (draft.targetDate && !parseDateOnly(draft.targetDate))
    errors.push("目標日期格式不正確。");
  errors.push(...milestones.errors);
  if (errors.length) return { valid: false as const, errors };
  const now = options.now ?? new Date();
  const createdAt = now.toISOString();
  const id = options.id || `goal_${now.getTime()}`;
  const opening = nonNegative(draft.currentSavedAmount);
  const goal: MoneyGoal = {
    id,
    purpose: draft.purpose || "custom",
    name: draft.name.trim(),
    targetAmount: nonNegative(draft.targetAmount),
    targetDate: draft.targetDate || null,
    status: opening >= draft.targetAmount ? "completed" : "active",
    createdAt,
    completedAt: opening >= draft.targetAmount ? createdAt : null,
    milestones: milestones.milestones,
  };
  const plan = {
    eatingOutMeals: nonNegative(draft.eatingOutMeals),
    eatingOutTotal: nonNegative(draft.eatingOutTotal),
    eatingOutCost,
    homeCookBudget: nonNegative(draft.homeCookBudget),
    weeklyCookingMeals: nonNegative(draft.weeklyCookingMeals),
    estimatedSavingPerMeal: calculateEstimatedSaving(
      eatingOutCost,
      draft.homeCookBudget,
    ),
    updatedAt: createdAt,
  };
  const openingEvent: AmountEvent = {
    id: `${id}_opening`,
    goalId: id,
    type: "opening_balance",
    amount: opening,
    createdAt,
  };
  return {
    valid: true as const,
    errors: [],
    goal,
    cookingPlan: plan,
    openingEvent,
    projection: calculateGoalProjection({
      targetAmount: goal.targetAmount,
      currentSavedAmount: opening,
      estimatedSavingPerMeal: plan.estimatedSavingPerMeal,
      weeklyCookingMeals: plan.weeklyCookingMeals,
      targetDate: goal.targetDate,
      now,
    }),
  };
}

export function goalDraftFromOnboarding(profile: OnboardingProfile): GoalDraft {
  const plannedMealCount = Math.max(1, profile.plannedMealSlots.length);
  return {
    purpose: "dream",
    name: profile.dreamName,
    targetAmount: profile.dreamTargetAmount,
    currentSavedAmount: 0,
    targetDate: null,
    eatingOutMeals: 1,
    eatingOutTotal: profile.outsideMealComparisonPrice,
    directEatingOutCost: profile.outsideMealComparisonPrice,
    homeCookBudget: Math.floor(profile.dailyMealBudget / plannedMealCount),
    weeklyCookingMeals: profile.weeklyHomeCookTarget,
  };
}

export function applyOnboardingProfile(
  state: AppState,
  profile: OnboardingProfile,
  options: { id?: string; now?: Date } = {},
) {
  const next = structuredClone(state);
  next.onboardingProfile = structuredClone(profile);

  if (next.activeGoal) return next;

  const result = createGoalFromDraft(goalDraftFromOnboarding(profile), options);
  if (!result.valid) throw new Error("INVALID_ONBOARDING_GOAL");

  next.activeGoal = result.goal;
  next.cookingPlan = result.cookingPlan;
  next.amountEvents = [result.openingEvent, ...next.amountEvents];
  return next;
}

export function getMilestoneProgress(
  milestones: GoalMilestone[],
  savedAmount: number,
) {
  let currentAssigned = false;
  return milestones.map((milestone) => {
    const status =
      savedAmount >= milestone.targetAmount
        ? "completed"
        : !currentAssigned
          ? ((currentAssigned = true), "current")
          : "upcoming";
    return {
      ...milestone,
      remainingAmount: Math.max(0, milestone.targetAmount - savedAmount),
      status,
    };
  });
}

export function applyGoalProgress(
  goal: MoneyGoal,
  savedAmount: number,
  now = new Date(),
) {
  const isCompleted = savedAmount >= goal.targetAmount;
  const newlyCompleted = isCompleted && goal.status !== "completed";
  const completedAt = now.toISOString();
  return {
    newlyCompleted,
    goal: {
      ...goal,
      status: isCompleted ? ("completed" as const) : ("active" as const),
      completedAt: isCompleted ? goal.completedAt || completedAt : null,
      milestones: goal.milestones.map((m) => ({
        ...m,
        completedAt:
          savedAmount >= m.targetAmount
            ? m.completedAt || completedAt
            : m.completedAt || null,
      })),
    },
  };
}

export function getWeekStart(input: Date | string = new Date()) {
  const date = input instanceof Date ? new Date(input) : new Date(input);
  if (Number.isNaN(date.getTime())) return null;
  const utc = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  utc.setUTCDate(utc.getUTCDate() - (utc.getUTCDay() || 7) + 1);
  return dateOnly(utc);
}

export function recordCookingOutcome(
  existing: CookingOutcome[],
  input: {
    completionKey: string;
    goalId: string | null;
    mealName?: string;
    source?: string;
    eatingOutCost?: number;
    homeCookCost?: number;
    estimatedSaving?: number;
    actualDeposit?: number;
  },
  options: { id?: string; now?: Date } = {},
) {
  if (
    !input.completionKey ||
    existing.some((outcome) => outcome.completionKey === input.completionKey)
  )
    return {
      accepted: false as const,
      reason: input.completionKey ? "duplicate" : "invalid_identity",
      outcome: null,
      amountEvents: [] as AmountEvent[],
    };
  const now = options.now ?? new Date();
  const createdAt = now.toISOString();
  const id = options.id || `meal_${now.getTime()}`;
  const estimatedSaving = nonNegative(input.estimatedSaving);
  const actualDeposit = nonNegative(input.actualDeposit);
  const mealDeposit = Math.min(actualDeposit, estimatedSaving);
  const extraDeposit = Math.max(0, actualDeposit - estimatedSaving);
  const outcome: CookingOutcome = {
    id,
    completionKey: input.completionKey,
    goalId: input.goalId,
    mealName: input.mealName || "自煮料理",
    source: input.source || "manual",
    eatingOutCost: nonNegative(input.eatingOutCost),
    homeCookCost: nonNegative(input.homeCookCost),
    estimatedSaving,
    actualDeposit,
    mealDeposit,
    extraDeposit,
    createdAt,
  };
  const amountEvents: AmountEvent[] = [];
  if (input.goalId && mealDeposit)
    amountEvents.push({
      id: `${id}_meal`,
      goalId: input.goalId,
      outcomeId: id,
      type: "meal_deposit",
      amount: mealDeposit,
      createdAt,
    });
  if (input.goalId && extraDeposit)
    amountEvents.push({
      id: `${id}_extra`,
      goalId: input.goalId,
      outcomeId: id,
      type: "extra_deposit",
      amount: extraDeposit,
      createdAt,
    });
  return { accepted: true as const, reason: null, outcome, amountEvents };
}

export function recordMealProgress(
  state: Pick<AppState, "habitProgress" | "healthAssets">,
  input: {
    outcomeId: string;
    foodSafe: boolean;
    vegetables: boolean;
    lowOil: boolean;
    mindfulSeasoning: boolean;
  },
  now = new Date(),
) {
  if (
    state.habitProgress.events.some(
      (event) => event.outcomeId === input.outcomeId,
    )
  )
    return { accepted: false as const, reason: "duplicate", ...state };
  const createdAt = now.toISOString();
  const weekKey = getWeekStart(now)!;
  const events = [
    ...state.habitProgress.events,
    { outcomeId: input.outcomeId, createdAt, weekKey },
  ];
  const weeklyCompletions = events.reduce<Record<string, number>>(
    (acc, event) => ({
      ...acc,
      [event.weekKey]: (acc[event.weekKey] || 0) + 1,
    }),
    {},
  );
  const qualifies =
    input.foodSafe &&
    (input.vegetables || input.lowOil || input.mindfulSeasoning);
  const healthEvents = qualifies
    ? [
        ...state.healthAssets.events,
        {
          outcomeId: input.outcomeId,
          createdAt,
          vegetables: input.vegetables,
          lowOil: input.lowOil,
          mindfulSeasoning: input.mindfulSeasoning,
          source: "self_reported" as const,
        },
      ]
    : state.healthAssets.events;
  const healthAssets: HealthAssets = {
    healthyAutonomyMeals: healthEvents.length,
    vegetableMeals: healthEvents.filter((e) => e.vegetables).length,
    lowOilMeals: healthEvents.filter((e) => e.lowOil).length,
    mindfulSeasoningMeals: healthEvents.filter((e) => e.mindfulSeasoning)
      .length,
    events: healthEvents,
  };
  return {
    accepted: true as const,
    reason: null,
    habitProgress: { totalMeals: events.length, weeklyCompletions, events },
    healthAssets,
    healthRecorded: qualifies,
  };
}

export function getRescuePlan(item: InventoryItem): RescuePlan {
  const fruit = /果|莓|酪梨|香蕉|芒果/.test(item.name);
  const vegetable = /菜|蘿蔔|番茄|瓜|菇|筍|洋蔥/.test(item.name);
  const eatNow = fruit
    ? {
        title: `${item.name}快速拌碗`,
        detail: "切塊後以現有基本調味料完成，不需額外採買主食材。",
        minutes: 8,
        quantity: Math.min(1, item.qty),
      }
    : vegetable
      ? {
          title: `${item.name}一鍋蒸煮`,
          detail:
            item.name === "胡蘿蔔"
              ? "切小塊後與現有 起司 加蓋蒸煮，低油煙完成。"
              : "切小塊後以基本調味料加蓋蒸煮，低油煙完成。",
          minutes: 15,
          quantity: Math.min(1, item.qty),
        }
      : {
          title: `${item.name}低油煙燜煮`,
          detail: "以少量水和基本調味料加蓋燜熟，中心必須完全加熱。",
          minutes: 15,
          quantity: Math.min(1, item.qty),
        };
  const preserve = fruit
    ? {
        title: `${item.name}冷凍果昔包`,
        detail: "切塊平鋪冷凍，分成單次用量，之後直接攪打。",
        packages: 2,
        days: 14,
      }
    : {
        title: `${item.name}冷凍備料包`,
        detail: "洗淨、瀝乾並切成一餐份，平鋪冷凍避免結塊。",
        packages: Math.max(1, Math.min(2, Math.ceil(item.qty))),
        days: 14,
      };
  return { itemId: item.id, eatNow, preserve };
}

export function parseShoppingText(text: string) {
  const chinese: Record<string, number> = {
    一: 1,
    二: 2,
    兩: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
    十: 10,
  };
  return text
    .split(/[、,，\n]+/)
    .map((v) => v.trim())
    .filter(Boolean)
    .map((part, index) => {
      const match = part.match(
        /^(.+?)(\d+|[一二兩三四五六七八九十])?\s*(顆|包|盒|瓶|束|條|片|份|罐|入|g|公斤)?$/,
      );
      return {
        id: `parsed_${index}`,
        name: (match?.[1] || part).trim(),
        qty: match?.[2] ? Number(match[2]) || chinese[match[2]] || 1 : 1,
        unit: match?.[3] || "包",
        category: /肉|魚|蛋|奶|起司/.test(part)
          ? ("protein" as const)
          : ("produce" as const),
        checked: true,
        status: "語音新增",
        estCost: 50,
      };
    });
}

const image =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80";
const legacyInventoryImages: Record<string, string> = {
  i1: "https://lh3.googleusercontent.com/aida-public/AB6AXuDdDfNSxxGjlHNotFR11Hpy8v0T59noNyOTeU1h1IVOWbvlNmeTxfenbqWlC9JlJd2C1uWaeGZG5NUNKAFPYf5DBYM0bqUZOJWTlGNP1mUVsE6KZuaqJaz4zegaSUCfDR9UIpbsS9babhgQP6pMXTPYuOXIC9YJTOBEonszTcpAxPE6ez7AWXLSJhAMj_VTRmcmzJKUxlOd4TjUmLfHCNZz6Txsts4f__iskIIzk63tGPapSOtIPGucoJDUZxE8L4U9g-NqDIYHwgw",
  i2: "https://lh3.googleusercontent.com/aida-public/AB6AXuCB6T3B4nig1ziAwIm1wSVgPv1ecoPiWrdICCeoGct9PZinlrXcpUQLkGSEkHJRIslOBINUxs6ZNwMBLnl1vyhYVduguWMa7x2HkBsxzHDaEOmF0agjsTINBgjsqQ7chfP3fC_mI20majBIld1HnR5Y8PNI7IT3u5wuu-5PNjoRFOkG_jreA3ffAQg0QVtjW-dvNnx_0Qj_eTq5Gessw8I9whoGXuCch4ME-JSUEsoNEJVFPUQcZhXzDIdVtyiXojBxpudh8aWhmeo",
  i3: "https://lh3.googleusercontent.com/aida-public/AB6AXuAsdLsTuOlvKjmOqP6m-wWjblzWJfC1TpbjHQz_O1cotBDXmXcvDKp4AmutQnCyC7653riqE4Y_wql5V06eWELmkrTAHUsg7sY4zSjaOSbQoJXlCvSo_R0dnrhxzpWykh2Neq8HMgzYM4PJeuZgXRTpV5cm_mRM6rpgjDylz4nmDz-wTWCxxHew-EKajA7Q8ZioqSXNlLrSKGEtE_dCRd57jjDzt1XXSyWrOGV4Skw1latyJ1fBrAHdLaU2MC25rMNDxHP0PYNaDxQ",
  i4: "https://lh3.googleusercontent.com/aida-public/AB6AXuBIkd8DDrNZLiSgFOwLZMm56-FPFbbYvtbQKQotyuuCix-LU3AO5mFP6Trce_mer2gBPcrHDQY7QVdQ7aQRLqlcY-9A1Y5ZqnJD9Kf2g9Tb02-8EXNcAlMrz-U8bpU3MBfkIAEUAHs1uUwiZLwkqMBSJMDYzWutfYrFdxdnB4l0q651uhvzxy6gpkSnklZVHRKCTUWsdvOQFBhSGwL-Re8FQbx7AoMP3dKUkKSDX3NULYorgFhGUSAT0bDxJPnDjyGEsoQgSp3LV-k",
  i5: "https://lh3.googleusercontent.com/aida-public/AB6AXuA6dY5HW5Sfpo5lwYOKgdf3wK0YGceYHNJkVEq9Lo2ssC96bZfivNbkOQJQHNAzQQQCCorFOLtWyoWq36O-TP8ayemePMJz_jPYafduq4jQAU99E0c05W7xavkGx2fsOtT42YY4az5VAqHka2eTqUe7qoiqDJaQLwtHfoOTmaxshZKaqXlp-_z3CAbyiIxBOwcjeq9me-EDV8Jg0PnmI5OWyQJLbqy68bVt0QO4xnqmuScAzxT5oMSZ6cSrn41c0IfX26JvVVMXgKo",
  i6: "https://lh3.googleusercontent.com/aida-public/AB6AXuCa5gj9PLU1Q9NoxiorfXJ2_JF82pUL6fyDNYaq9Y3iErHzgDV6iJYyq8FV3-iViBFhk_uD9n3H0Bq25QSyKXHS-Rv_pIoXvdV8PFrG64pD7rCxiIQ2xx8NNZZxthiFXayKdMdclHLi35UlxRamo6_qoQw0Y69WTRMhi2QKtPTHHtv1WS_jEqp9WSDCyULNpux8VM8FvPMZSalBZlMJsbMwayi9XI_F4QUVLpIdJoBkShTJHRdAKGnOeZGF1Y4QETY-MmXuvx2zpe0",
};
export function createSeedState(): AppState {
  const inventory: InventoryItem[] = [
    ["i1", "酪梨", "cold", 1, "顆", 0, "S", 120, "2026-06-26"],
    ["i2", "胡蘿蔔", "cold", 3, "條", 3, "M", 60, "2026-06-23"],
    ["i3", "起司", "cold", 150, "g", 4, "S", 100, "2026-06-25"],
    ["i4", "雞蛋", "cold", 6, "顆", 10, "M", 50, "2026-06-26"],
    ["i5", "鮭魚", "frozen", 2, "片", 90, "M", 250, "2026-06-25"],
    ["i6", "綜合莓果", "frozen", 1, "包", 150, "S", 150, "2026-06-26"],
  ].map(
    ([
      id,
      name,
      chamber,
      qty,
      unit,
      daysLeft,
      boxSize,
      savings,
      addedDate,
    ]) => ({
      id: String(id),
      name: String(name),
      chamber: chamber as "cold" | "frozen",
      qty: Number(qty),
      unit: String(unit),
      daysLeft: Number(daysLeft),
      image: legacyInventoryImages[String(id)] || image,
      addedDate: String(addedDate),
      roi: { savings: Number(savings), sodium: 100, fat: 5 },
      storageProtocol:
        chamber === "frozen"
          ? "壓扁冷凍最大化表面積，縮短解凍時間。"
          : "方形收納管理，先進先出並定期檢查。",
      boxSize: boxSize as "S" | "M" | "L",
    }),
  );
  const shoppingItems: ShoppingItem[] = [
    {
      id: "s1",
      name: "有機小松菜",
      category: "produce",
      qty: 2,
      unit: "束",
      checked: false,
      status: "剩餘 10%",
      estCost: 80,
    },
    {
      id: "s2",
      name: "牛番茄",
      category: "produce",
      qty: 4,
      unit: "顆",
      checked: false,
      status: "已耗盡",
      estCost: 120,
    },
    {
      id: "s3",
      name: "富士蘋果",
      category: "produce",
      qty: 3,
      unit: "顆",
      checked: true,
      status: "已選取",
      estCost: 150,
    },
    {
      id: "s4",
      name: "放牧土雞蛋",
      category: "protein",
      qty: 10,
      unit: "入",
      checked: false,
      status: "急需補貨",
      estCost: 180,
    },
    {
      id: "s5",
      name: "全脂鮮乳",
      category: "protein",
      qty: 1,
      unit: "瓶 (936ml)",
      checked: false,
      status: "剩餘 20%",
      estCost: 95,
    },
  ];
  return {
    version: 1,
    session: { user: null },
    activeGoal: null,
    archivedGoals: [],
    amountEvents: [],
    cookingPlan: null,
    cookingOutcomes: [],
    habitProgress: { totalMeals: 0, weeklyCompletions: {}, events: [] },
    healthAssets: {
      healthyAutonomyMeals: 0,
      vegetableMeals: 0,
      lowOilMeals: 0,
      mindfulSeasoningMeals: 0,
      events: [],
    },
    inventory,
    shoppingItems,
    fridgeProfile: {
      brand: "",
      model: "",
      capacityLiters: 0,
      coldRatio: 0.6,
      isConfigured: false,
    },
    cookware: [
      {
        id: "cw1",
        type: "electric_pot",
        name: "快煮鍋",
        brand: "象印",
        model: "CH-DWF10",
        capacity: "1L",
        wattage: 1300,
      },
      {
        id: "cw2",
        type: "rice_cooker",
        name: "電鍋",
        brand: "大同",
        model: "TAC-10L",
        capacity: "10人份",
        wattage: 800,
      },
      {
        id: "cw3",
        type: "induction",
        name: "電磁爐",
        brand: "飛利浦",
        model: "HD4924",
        capacity: "",
        wattage: 2100,
      },
    ],
  };
}

export interface StateRepository {
  read(): AppState;
  write(state: AppState): void;
  reset(): AppState;
}
export interface Runtime {
  now(): Date;
  id(): string;
}
const defaultRuntime: Runtime = {
  now: () => new Date(),
  id: () =>
    globalThis.crypto?.randomUUID?.() ||
    `id_${Date.now()}_${Math.random().toString(36).slice(2)}`,
};

export class CooCooService {
  private repository: StateRepository;
  private runtime: Runtime;
  constructor(repository: StateRepository, runtime: Runtime = defaultRuntime) {
    this.repository = repository;
    this.runtime = runtime;
  }
  state() {
    return structuredClone(this.repository.read());
  }
  reset() {
    return structuredClone(this.repository.reset());
  }
  login(email = "kelly@example.com") {
    const s = this.state();
    s.session = {
      user: { id: this.runtime.id(), email, displayName: email.split("@")[0] },
    };
    this.repository.write(s);
    return s.session;
  }
  logout() {
    const s = this.state();
    s.session = { user: null };
    this.repository.write(s);
    return s.session;
  }
  completeOnboarding(profile: OnboardingProfile) {
    const next = applyOnboardingProfile(this.state(), profile, {
      id: this.runtime.id(),
      now: this.runtime.now(),
    });
    this.repository.write(next);
    return {
      profile: structuredClone(profile),
      goal: structuredClone(next.activeGoal),
      cookingPlan: structuredClone(next.cookingPlan),
    };
  }
  createGoal(draft: GoalDraft) {
    const s = this.state();
    const result = createGoalFromDraft(draft, {
      id: this.runtime.id(),
      now: this.runtime.now(),
    });
    if (!result.valid) return result;
    if (s.activeGoal)
      s.archivedGoals.unshift({ ...s.activeGoal, status: "archived" });
    s.activeGoal = result.goal;
    s.cookingPlan = result.cookingPlan;
    s.amountEvents = [result.openingEvent];
    this.repository.write(s);
    return result;
  }
  adjustGoal(patch: {
    targetAmount?: number;
    targetDate?: string | null;
    desiredSaved?: number;
    homeCookBudget?: number;
    weeklyCookingMeals?: number;
  }) {
    const s = this.state();
    if (!s.activeGoal) throw new Error("GOAL_NOT_FOUND");
    const now = this.runtime.now().toISOString();
    if (patch.targetAmount)
      s.activeGoal.targetAmount = nonNegative(patch.targetAmount);
    if (patch.targetDate !== undefined)
      s.activeGoal.targetDate = patch.targetDate;
    if (patch.desiredSaved !== undefined) {
      const adj = createBalanceAdjustment(
        s.amountEvents.filter((e) => e.goalId === s.activeGoal!.id),
        patch.desiredSaved,
      );
      if (adj.amount)
        s.amountEvents.push({
          id: this.runtime.id(),
          goalId: s.activeGoal.id,
          type: "balance_adjustment",
          amount: adj.amount,
          createdAt: now,
        });
    }
    if (s.cookingPlan) {
      if (patch.homeCookBudget !== undefined)
        s.cookingPlan.homeCookBudget = nonNegative(patch.homeCookBudget);
      if (patch.weeklyCookingMeals !== undefined)
        s.cookingPlan.weeklyCookingMeals = nonNegative(
          patch.weeklyCookingMeals,
        );
      s.cookingPlan.estimatedSavingPerMeal = calculateEstimatedSaving(
        s.cookingPlan.eatingOutCost,
        s.cookingPlan.homeCookBudget,
      );
      s.cookingPlan.updatedAt = now;
    }
    s.activeGoal = createMilestones(s.activeGoal.targetAmount).milestones.length
      ? {
          ...applyGoalProgress(
            {
              ...s.activeGoal,
              milestones: createMilestones(s.activeGoal.targetAmount)
                .milestones,
            },
            calculateCurrentSaved(
              s.amountEvents.filter((e) => e.goalId === s.activeGoal!.id),
            ),
            this.runtime.now(),
          ).goal,
        }
      : s.activeGoal;
    this.repository.write(s);
    return s.activeGoal;
  }
  addInventory(item: Omit<InventoryItem, "id">) {
    const s = this.state();
    const next = { ...item, id: this.runtime.id() };
    s.inventory.push(next);
    this.repository.write(s);
    return next;
  }
  deleteInventory(id: string) {
    const s = this.state();
    s.inventory = s.inventory.filter((i) => i.id !== id);
    this.repository.write(s);
  }
  rescue(
    id: string,
    action: "eat" | "preserve" | "discard",
    foodSafe: boolean,
  ) {
    const s = this.state();
    const item = s.inventory.find((i) => i.id === id);
    if (!item) throw new Error("ITEM_NOT_FOUND");
    if (!foodSafe && action !== "discard") throw new Error("UNSAFE_ACTION");
    const plan = getRescuePlan(item);
    if (action === "eat" || action === "discard")
      s.inventory = s.inventory.filter((i) => i.id !== id);
    else {
      s.inventory = s.inventory.filter((i) => i.id !== id);
      s.inventory.push({
        ...item,
        id: this.runtime.id(),
        name: plan.preserve.title,
        chamber: "frozen",
        qty: plan.preserve.packages,
        unit: "包",
        daysLeft: plan.preserve.days,
        addedDate: dateOnly(this.runtime.now())!,
      });
    }
    this.repository.write(s);
    return { action, plan, item };
  }
  generateRecipe(
    ingredientIds: string[],
    style = "無特定風格",
    excludeTitle = "",
  ) {
    const s = this.state();
    const ingredients = s.inventory
      .filter((i) => ingredientIds.includes(i.id))
      .map((i) => i.name);
    if (!ingredients.length) throw new Error("INGREDIENT_REQUIRED");
    const variant = excludeTitle ? "新風味" : "";
    const recipe: Recipe = {
      id: this.runtime.id(),
      title: `${style.replace(/\s*\(.+\)/, "")}${variant}【${ingredients[0]}】物理學自煮料理`,
      style,
      prepTime: "15 分鐘",
      estCost: "NT$ 55",
      scientificPrinciple:
        "利用食材的高比熱容，在加蓋鍋體內形成溫和熱流，避免蛋白質過度緊縮。",
      ingredients,
      steps: [
        `處理 ${ingredients[0]}，若有水分請先用紙巾吸乾。`,
        ingredients[1]
          ? `將 ${ingredients[1]} 切細，加入少許鹽靜置 3 分鐘。`
          : "將食材預備完成。",
        "加熱後加入食材，加蓋利用餘溫慢熟，完成後立即享用。",
      ],
    };
    return recipe;
  }
  completeCooking(input: {
    completionKey: string;
    recipe: Recipe;
    ingredientIds: string[];
    homeCookCost: number;
    actualDeposit: number;
    foodSafe: boolean;
    vegetables: boolean;
    lowOil: boolean;
    mindfulSeasoning: boolean;
    servingsCooked?: number;
    servingsEaten?: number;
  }) {
    const s = this.state();
    const estimated = s.cookingPlan
      ? calculateEstimatedSaving(
          s.cookingPlan.eatingOutCost,
          input.homeCookCost,
        )
      : 0;
    const result = recordCookingOutcome(
      s.cookingOutcomes,
      {
        completionKey: input.completionKey,
        goalId: s.activeGoal?.id || null,
        mealName: input.recipe.title,
        source: "recipe",
        eatingOutCost: s.cookingPlan?.eatingOutCost || 0,
        homeCookCost: input.homeCookCost,
        estimatedSaving: estimated,
        actualDeposit: input.actualDeposit,
      },
      { id: this.runtime.id(), now: this.runtime.now() },
    );
    if (!result.accepted) return result;
    const servingsCooked = input.servingsCooked ?? 1;
    const servingsEaten = input.servingsEaten ?? 1;
    const servingResult = completeCookingSession(
      { completedOperationIds: [], servings: s.mealServings ?? [], savingsEvents: s.savingsEvents ?? [] },
      { operationId: input.completionKey, sessionId: result.outcome.id, servingsCooked, servingsEaten, outsideMealPrice: s.cookingPlan?.eatingOutCost || 0, ingredientCost: input.homeCookCost, confirmedSavings: input.actualDeposit },
      this.runtime.now().toISOString(),
    );
    s.mealServings = servingResult.servings.map((serving) => ({ ...serving, vegetableKeys: input.vegetables && serving.status === "eaten" ? ["reported-vegetable"] : [] }));
    s.savingsEvents = servingResult.savingsEvents;
    s.cookingOutcomes.push(result.outcome);
    s.amountEvents.push(...result.amountEvents);
    s.inventory = s.inventory.filter(
      (i) => !input.ingredientIds.includes(i.id),
    );
    const progress = recordMealProgress(
      s,
      {
        outcomeId: result.outcome.id,
        foodSafe: input.foodSafe,
        vegetables: input.vegetables,
        lowOil: input.lowOil,
        mindfulSeasoning: input.mindfulSeasoning,
      },
      this.runtime.now(),
    );
    s.habitProgress = progress.habitProgress;
    s.healthAssets = progress.healthAssets;
    for (let index = 1; index < servingsEaten; index += 1) {
      const extra = recordMealProgress(
        s,
        { outcomeId: `${result.outcome.id}:serving:${index + 1}`, foodSafe: input.foodSafe, vegetables: input.vegetables, lowOil: false, mindfulSeasoning: false },
        this.runtime.now(),
      );
      s.habitProgress = extra.habitProgress;
      s.healthAssets = extra.healthAssets;
    }
    if (s.activeGoal)
      s.activeGoal = applyGoalProgress(
        s.activeGoal,
        calculateCurrentSaved(
          s.amountEvents.filter((e) => e.goalId === s.activeGoal!.id),
        ),
        this.runtime.now(),
      ).goal;
    this.repository.write(s);
    return result;
  }
  saveShopping(item: Partial<ShoppingItem> & Pick<ShoppingItem, "name">) {
    const s = this.state();
    const existing = item.id
      ? s.shoppingItems.find((i) => i.id === item.id)
      : null;
    const next: ShoppingItem = {
      id: existing?.id || this.runtime.id(),
      name: item.name,
      category: item.category || existing?.category || "produce",
      qty: item.qty ?? existing?.qty ?? 1,
      unit: item.unit || existing?.unit || "包",
      checked: item.checked ?? existing?.checked ?? false,
      status: item.status || existing?.status || "手動新增",
      estCost: nonNegative(item.estCost ?? existing?.estCost ?? 50),
    };
    s.shoppingItems = existing
      ? s.shoppingItems.map((i) => (i.id === next.id ? next : i))
      : [...s.shoppingItems, next];
    this.repository.write(s);
    return next;
  }
  deleteShopping(id: string) {
    const s = this.state();
    s.shoppingItems = s.shoppingItems.filter((i) => i.id !== id);
    this.repository.write(s);
  }
  restock() {
    const s = this.state();
    const selected = s.shoppingItems.filter((i) => i.checked);
    selected.forEach((i) =>
      s.inventory.push({
        id: this.runtime.id(),
        name: i.name,
        chamber: "cold",
        qty: i.qty,
        unit: i.unit,
        daysLeft: 7,
        image,
        addedDate: dateOnly(this.runtime.now())!,
        roi: { savings: Math.max(50, i.estCost), sodium: 100, fat: 5 },
        storageProtocol: "方形收納管理：先進先出，定期檢查保鮮期。",
        boxSize: "M",
      }),
    );
    s.shoppingItems = s.shoppingItems.filter((i) => !i.checked);
    this.repository.write(s);
    return { count: selected.length, items: selected };
  }
  updateSettings(patch: Partial<Pick<AppState, "fridgeProfile" | "cookware">>) {
    const s = this.state();
    Object.assign(s, patch);
    this.repository.write(s);
    return s;
  }
}
