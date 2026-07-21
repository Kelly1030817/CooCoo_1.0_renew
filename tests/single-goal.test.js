const test = require("node:test");
const assert = require("node:assert/strict");

const domain = require("../src/dream-space/single-goal.js");

test("calculates the editable 60 percent home-cook suggestion", () => {
    assert.equal(domain.calculateAverageEatingOutCost(1050, 7), 150);
    assert.equal(domain.suggestHomeCookBudget(150), 90);
    assert.equal(domain.calculateEstimatedSaving(150, 90), 60);
});

test("requires a direct baseline when eating-out meal count is zero", () => {
    assert.equal(domain.calculateAverageEatingOutCost(0, 0), null);
});

test("never reports negative savings", () => {
    assert.equal(domain.calculateEstimatedSaving(100, 120), 0);
});

test("projects meals and weeks from current saved amount", () => {
    const projection = domain.calculateGoalProjection({
        targetAmount: 30000,
        currentSavedAmount: 12000,
        estimatedSavingPerMeal: 100,
        weeklyCookingMeals: 5,
        now: new Date("2026-07-19T00:00:00.000Z")
    });

    assert.equal(projection.status, "ready");
    assert.equal(projection.remainingAmount, 18000);
    assert.equal(projection.mealsNeeded, 180);
    assert.equal(projection.estimatedWeeks, 36);
    assert.equal(projection.estimatedDate, "2027-03-28");
});

test("short goals do not wait for a 28-day observation window", () => {
    const projection = domain.calculateGoalProjection({
        targetAmount: 2100,
        currentSavedAmount: 0,
        estimatedSavingPerMeal: 100,
        weeklyCookingMeals: 7,
        targetDate: "2026-08-08",
        now: new Date("2026-07-19T00:00:00.000Z")
    });

    assert.equal(projection.mealsNeeded, 21);
    assert.equal(projection.requiredWeeklyMeals, 8);
    assert.equal(projection.scheduleStatus, "behind");
});

test("returns explicit states instead of invalid numeric projections", () => {
    assert.equal(domain.calculateGoalProjection({ targetAmount: 0 }).status, "invalid_target");
    assert.equal(domain.calculateGoalProjection({ targetAmount: 1000, estimatedSavingPerMeal: 0 }).status, "no_saving");
    assert.equal(domain.calculateGoalProjection({ targetAmount: 1000, estimatedSavingPerMeal: 50, weeklyCookingMeals: 0 }).status, "no_frequency");
    assert.equal(domain.calculateGoalProjection({ targetAmount: 1000, currentSavedAmount: 1200 }).status, "completed");
});

test("creates cumulative short, medium, and long milestones", () => {
    const result = domain.createMilestones(30000);
    assert.deepEqual(result.milestones.map((item) => item.targetAmount), [7500, 18000, 30000]);
    assert.deepEqual(result.milestones.map((item) => item.percent), [25, 60, 100]);
});

test("rejects overlapping milestone thresholds", () => {
    const result = domain.createMilestones(30000, { shortPercent: 70, mediumPercent: 60 });
    assert.equal(result.milestones.length, 0);
    assert.match(result.errors.join(" "), /短期門檻/);
});

test("manual balance editing creates one signed adjustment", () => {
    const events = [
        { amount: 10000 },
        { amount: 2000 }
    ];

    assert.deepEqual(domain.createBalanceAdjustment(events, 10000), {
        amount: -2000,
        currentBalance: 12000,
        nextBalance: 10000
    });
});

test("empty v2 state does not reuse legacy dreams", () => {
    const state = domain.createEmptyState();
    assert.equal(state.version, 2);
    assert.equal(state.activeGoal, null);
    assert.deepEqual(state.archivedGoals, []);
    assert.equal("dreams" in state, false);
});

test("creates one active money goal from the six-step setup", () => {
    const result = domain.createGoalFromDraft({
        purpose: "travel",
        name: "日本旅行",
        targetAmount: 30000,
        currentSavedAmount: 12000,
        targetDate: "2027-04-01",
        eatingOutMeals: 7,
        eatingOutTotal: 1050,
        homeCookBudget: 90,
        weeklyCookingMeals: 5,
        shortPercent: 25,
        mediumPercent: 60,
        shortLabel: "先存機票",
        mediumLabel: "住宿準備",
        longLabel: "日本旅行"
    }, {
        id: "goal_test",
        now: new Date("2026-07-19T00:00:00.000Z")
    });

    assert.equal(result.valid, true);
    assert.equal(result.goal.id, "goal_test");
    assert.equal(result.goal.status, "active");
    assert.equal(result.cookingPlan.eatingOutCost, 150);
    assert.equal(result.cookingPlan.estimatedSavingPerMeal, 60);
    assert.equal(result.openingEvent.amount, 12000);
    assert.equal(result.goal.milestones[2].targetAmount, 30000);
});

test("uses a direct eating-out baseline when the recent week has no meals", () => {
    const result = domain.createGoalFromDraft({
        purpose: "emergency",
        name: "緊急預備金",
        targetAmount: 10000,
        eatingOutMeals: 0,
        eatingOutTotal: 0,
        directEatingOutCost: 140,
        homeCookBudget: 80,
        weeklyCookingMeals: 2,
        shortPercent: 25,
        mediumPercent: 60
    });

    assert.equal(result.valid, true);
    assert.equal(result.cookingPlan.eatingOutCost, 140);
});

test("rejects setup without an explainable eating-out baseline", () => {
    const result = domain.createGoalFromDraft({
        name: "旅行",
        targetAmount: 10000,
        eatingOutMeals: 0,
        directEatingOutCost: 0,
        homeCookBudget: 80,
        weeklyCookingMeals: 2,
        shortPercent: 25,
        mediumPercent: 60
    });

    assert.equal(result.valid, false);
    assert.match(result.errors.join(" "), /外食餐費/);
});

test("marks exactly one unfinished milestone as current", () => {
    const milestones = domain.createMilestones(30000).milestones;
    const progress = domain.getMilestoneProgress(milestones, 12000);

    assert.deepEqual(progress.map((item) => item.status), ["completed", "current", "upcoming"]);
    assert.equal(progress[1].remainingAmount, 6000);
});

test("marks every milestone complete after the goal amount is reached", () => {
    const milestones = domain.createMilestones(30000).milestones;
    const progress = domain.getMilestoneProgress(milestones, 32000);
    assert.deepEqual(progress.map((item) => item.status), ["completed", "completed", "completed"]);
});

test("splits an amount above estimated meal savings into an extra deposit", () => {
    const result = domain.recordCookingOutcome([], {
        completionKey: "meal-key-1",
        goalId: "goal-1",
        mealName: "番茄蛋",
        eatingOutCost: 150,
        homeCookCost: 90,
        estimatedSaving: 60,
        actualDeposit: 100
    }, {
        id: "outcome-1",
        now: new Date("2026-07-19T12:00:00.000Z")
    });

    assert.equal(result.accepted, true);
    assert.equal(result.outcome.mealDeposit, 60);
    assert.equal(result.outcome.extraDeposit, 40);
    assert.deepEqual(result.amountEvents.map((event) => [event.type, event.amount]), [
        ["meal_deposit", 60],
        ["extra_deposit", 40]
    ]);
});

test("accepts a completed meal with zero deposit", () => {
    const result = domain.recordCookingOutcome([], {
        completionKey: "meal-key-2",
        goalId: "goal-1",
        estimatedSaving: 60,
        actualDeposit: 0
    });

    assert.equal(result.accepted, true);
    assert.equal(result.outcome.actualDeposit, 0);
    assert.deepEqual(result.amountEvents, []);
});

test("rejects a repeated cooking completion key", () => {
    const result = domain.recordCookingOutcome([{ completionKey: "same-meal" }], {
        completionKey: "same-meal",
        goalId: "goal-1",
        estimatedSaving: 60,
        actualDeposit: 60
    });

    assert.equal(result.accepted, false);
    assert.equal(result.reason, "duplicate");
});

test("records cooking habit even when no health action qualifies", () => {
    const result = domain.recordMealProgress({}, {}, {
        outcomeId: "outcome-1",
        foodSafe: false,
        vegetables: true
    }, {
        now: new Date("2026-07-20T12:00:00.000Z")
    });

    assert.equal(result.habitProgress.totalMeals, 1);
    assert.equal(result.healthAssets.healthyAutonomyMeals, 0);
    assert.equal(result.healthRecorded, false);
});

test("records one healthy autonomy meal with traceable actions", () => {
    const result = domain.recordMealProgress({}, {}, {
        outcomeId: "outcome-2",
        foodSafe: true,
        vegetables: true,
        lowOil: true,
        mindfulSeasoning: false
    }, {
        now: new Date("2026-07-20T12:00:00.000Z")
    });

    assert.equal(result.healthAssets.healthyAutonomyMeals, 1);
    assert.equal(result.healthAssets.vegetableMeals, 1);
    assert.equal(result.healthAssets.lowOilMeals, 1);
    assert.equal(result.healthAssets.mindfulSeasoningMeals, 0);
    assert.equal(result.healthAssets.events[0].source, "self_reported");
});

test("does not record habit or health twice for one outcome", () => {
    const first = domain.recordMealProgress({}, {}, { outcomeId: "outcome-3", foodSafe: true, lowOil: true });
    const duplicate = domain.recordMealProgress(first.habitProgress, first.healthAssets, { outcomeId: "outcome-3", foodSafe: true, lowOil: true });
    assert.equal(duplicate.accepted, false);
    assert.equal(duplicate.reason, "duplicate");
    assert.equal(duplicate.habitProgress.totalMeals, 1);
    assert.equal(duplicate.healthAssets.healthyAutonomyMeals, 1);
});

test("summarizes the current weekly cooking goal and streak", () => {
    const habit = { weeklyCompletions: { "2026-07-13": 3, "2026-07-06": 4 } };
    const summary = domain.calculateHabitSummary(habit, 3, new Date("2026-07-19T00:00:00.000Z"));
    assert.equal(summary.currentWeekMeals, 3);
    assert.equal(summary.achieved, true);
    assert.equal(summary.streakWeeks, 2);
});

test("marks milestones and goal complete when saved amount reaches target", () => {
    const goal = {
        id: "goal-1",
        targetAmount: 30000,
        status: "active",
        milestones: domain.createMilestones(30000).milestones
    };
    const result = domain.applyGoalProgress(goal, 30000, { now: new Date("2026-07-19T12:00:00.000Z") });
    assert.equal(result.newlyCompleted, true);
    assert.equal(result.goal.status, "completed");
    assert.equal(result.goal.completedAt, "2026-07-19T12:00:00.000Z");
    assert.ok(result.goal.milestones.every((milestone) => milestone.completedAt));
});

test("reactivates an unarchived goal when saved amount drops below target", () => {
    const goal = {
        id: "goal-1",
        targetAmount: 30000,
        status: "completed",
        completedAt: "2026-07-19T12:00:00.000Z",
        milestones: domain.createMilestones(30000).milestones
    };
    const result = domain.applyGoalProgress(goal, 29000);
    assert.equal(result.newlyCompleted, false);
    assert.equal(result.goal.status, "active");
    assert.equal(result.goal.completedAt, null);
});
