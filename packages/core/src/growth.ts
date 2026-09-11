import type {
  BadgeAward,
  ChefRank,
  ExpEvent,
  ExpEventType,
  GrowthProfile,
  WeeklyGoal,
} from "@coocoo/contracts";

export const EXP_POINTS: Record<ExpEventType, number> = {
  cooking_completed: 30,
  prepared_serving_eaten: 10,
  expiring_ingredient_used: 10,
  double_meal_completed: 20,
  weekly_goal_completed: 40,
};

export const CHEF_RANKS = [
  { level: 1, name: "初火學徒", threshold: 0 },
  { level: 2, name: "赤銅助廚", threshold: 100 },
  { level: 3, name: "銀焰掌勺官", threshold: 250 },
  { level: 4, name: "星鑽副主廚", threshold: 500 },
  { level: 5, name: "傳奇總主廚", threshold: 900 },
] as const;

export function chefRankForExp(totalExp: number): ChefRank {
  let index = 0;
  for (let cursor = 0; cursor < CHEF_RANKS.length; cursor += 1) if (totalExp >= CHEF_RANKS[cursor].threshold) index = cursor;
  const rank = CHEF_RANKS[Math.max(0, index)];
  return {
    ...rank,
    nextThreshold: CHEF_RANKS[index + 1]?.threshold ?? null,
  };
}

export const BADGE_DEFINITIONS = [
  ...[1, 10, 30].map((target, index) => ({ badgeKey: `cooking-${target}`, category: "cooking" as const, tier: index + 1, title: ["第一道火光", "十餐上桌", "料理成習"][index], target, metric: "cooking" as const })),
  ...[1, 4, 12].map((target, index) => ({ badgeKey: `rhythm-${target}`, category: "rhythm" as const, tier: index + 1, title: ["第一週節奏", "穩穩一個月", "一季同行"][index], target, metric: "rhythm" as const })),
  ...[1, 5, 15].map((target, index) => ({ badgeKey: `waste-less-${target}`, category: "waste_less" as const, tier: index + 1, title: ["惜食初芽", "冰箱守護者", "惜食達人"][index], target, metric: "wasteLess" as const })),
  ...[3, 10, 25].map((target, index) => ({ badgeKey: `exploration-${target}`, category: "exploration" as const, tier: index + 1, title: ["三味探索", "十道風景", "百味前奏"][index], target, metric: "exploration" as const })),
];

export interface GrowthCounters {
  cooking: number;
  rhythm: number;
  wasteLess: number;
  exploration: number;
}

export function deriveGrowthProfile(events: ExpEvent[], awards: BadgeAward[], counters: GrowthCounters): GrowthProfile {
  const totalExp = events.reduce((sum, event) => sum + event.points, 0);
  const awarded = new Set(awards.map((award) => award.badgeKey));
  const next = BADGE_DEFINITIONS.find((badge) => !awarded.has(badge.badgeKey));
  return {
    totalExp,
    rank: chefRankForExp(totalExp),
    nextBadge: next ? { badgeKey: next.badgeKey, title: next.title, current: counters[next.metric], target: next.target } : null,
  };
}

export function awardExp(
  events: ExpEvent[],
  input: { operationId: string; type: ExpEventType; sourceId: string },
  now = new Date().toISOString(),
) {
  if (events.some((event) => event.operationId === input.operationId && event.type === input.type)) {
    return { accepted: false as const, events, event: null };
  }
  const event: ExpEvent = {
    id: `${input.operationId}:${input.type}`,
    operationId: input.operationId,
    type: input.type,
    points: EXP_POINTS[input.type],
    sourceId: input.sourceId,
    createdAt: now,
  };
  return { accepted: true as const, events: [...events, event], event };
}

export function grantWeeklyGoalReward(
  goal: WeeklyGoal,
  events: ExpEvent[],
  operationId: string,
  now = new Date().toISOString(),
) {
  if (goal.progress < goal.target || goal.rewardGrantedAt) {
    return { accepted: false as const, goal, events };
  }
  const result = awardExp(events, { operationId, type: "weekly_goal_completed", sourceId: goal.id }, now);
  return {
    accepted: result.accepted,
    goal: result.accepted ? { ...goal, rewardGrantedAt: now } : goal,
    events: result.events,
  };
}

export function awardBadges(
  awards: BadgeAward[],
  counters: GrowthCounters,
  now = new Date().toISOString(),
) {
  const existing = new Set(awards.map((award) => award.badgeKey));
  const added = BADGE_DEFINITIONS.filter((badge) => counters[badge.metric] >= badge.target && !existing.has(badge.badgeKey))
    .map((badge): BadgeAward => ({
      id: `badge:${badge.badgeKey}`,
      badgeKey: badge.badgeKey,
      category: badge.category,
      tier: badge.tier,
      title: badge.title,
      awardedAt: now,
    }));
  return { awards: [...awards, ...added], added };
}
