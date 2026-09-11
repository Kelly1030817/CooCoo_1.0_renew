import { describe, expect, test } from "bun:test";
import { awardBadges, awardExp, chefRankForExp, deriveGrowthProfile, grantWeeklyGoalReward } from "./growth";
import type { WeeklyGoal } from "@coocoo/contracts";

const weeklyGoal = (progress: number, rewardGrantedAt: string | null = null): WeeklyGoal => ({
  id: "week:2026-09-07", weekStart: "2026-09-07", metric: "cooking_sessions", target: 2,
  progress, rewardGrantedAt, updatedAt: "2026-09-11T00:00:00.000Z",
});

describe("CooCoo growth", () => {
  test("uses the confirmed five rank thresholds", () => {
    expect([0, 100, 250, 500, 900].map((exp) => chefRankForExp(exp).name)).toEqual([
      "初火學徒", "赤銅助廚", "銀焰掌勺官", "星鑽副主廚", "傳奇總主廚",
    ]);
  });

  test("does not award the same EXP event twice", () => {
    const first = awardExp([], { operationId: "cook-1", type: "cooking_completed", sourceId: "session-1" });
    const replay = awardExp(first.events, { operationId: "cook-1", type: "cooking_completed", sourceId: "session-1" });
    expect(first.event?.points).toBe(30);
    expect(replay.accepted).toBeFalse();
    expect(replay.events).toHaveLength(1);
  });

  test("grants a weekly reward only once and never penalizes an incomplete week", () => {
    expect(grantWeeklyGoalReward(weeklyGoal(1), [], "week-1").events).toHaveLength(0);
    const rewarded = grantWeeklyGoalReward(weeklyGoal(2), [], "week-1", "2026-09-11T00:00:00.000Z");
    expect(rewarded.events[0]?.points).toBe(40);
    expect(grantWeeklyGoalReward(rewarded.goal, rewarded.events, "week-2").accepted).toBeFalse();
  });

  test("awards all twelve badges at the confirmed thresholds", () => {
    const result = awardBadges([], { cooking: 30, rhythm: 12, wasteLess: 15, exploration: 25 });
    expect(result.added).toHaveLength(12);
    expect(awardBadges(result.awards, { cooking: 30, rhythm: 12, wasteLess: 15, exploration: 25 }).added).toHaveLength(0);
  });

  test("derives total EXP and the next badge", () => {
    const result = awardExp([], { operationId: "cook-1", type: "cooking_completed", sourceId: "session-1" });
    expect(deriveGrowthProfile(result.events, [], { cooking: 1, rhythm: 0, wasteLess: 0, exploration: 1 })).toMatchObject({
      totalExp: 30, rank: { name: "初火學徒" }, nextBadge: { badgeKey: "cooking-1", current: 1, target: 1 },
    });
  });
});
