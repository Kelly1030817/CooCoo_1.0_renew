(function initSingleGoalDomain(globalScope) {
    const STORAGE_KEY = "coocoo.single-goal.v2";
    const VERSION = 2;
    const DAY_MS = 24 * 60 * 60 * 1000;

    function toInteger(value, fallback = 0) {
        const number = Number(value);
        return Number.isFinite(number) ? Math.round(number) : fallback;
    }

    function toNonNegativeInteger(value, fallback = 0) {
        return Math.max(0, toInteger(value, fallback));
    }

    function formatDateOnly(date) {
        if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
        return date.toISOString().slice(0, 10);
    }

    function parseDateOnly(value) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return null;
        const date = new Date(`${value}T00:00:00.000Z`);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    function calculateAverageEatingOutCost(totalAmount, mealCount) {
        const total = toNonNegativeInteger(totalAmount);
        const meals = toNonNegativeInteger(mealCount);
        if (meals === 0) return null;
        return Math.round(total / meals);
    }

    function suggestHomeCookBudget(eatingOutCost, ratio = 0.6) {
        const baseline = toNonNegativeInteger(eatingOutCost);
        const safeRatio = Number.isFinite(Number(ratio)) ? Math.max(0, Number(ratio)) : 0.6;
        return Math.round(baseline * safeRatio);
    }

    function calculateEstimatedSaving(eatingOutCost, homeCookCost) {
        return Math.max(0, toNonNegativeInteger(eatingOutCost) - toNonNegativeInteger(homeCookCost));
    }

    function calculateCurrentSaved(amountEvents = []) {
        if (!Array.isArray(amountEvents)) return 0;
        const total = amountEvents.reduce((sum, event) => sum + toInteger(event?.amount), 0);
        return Math.max(0, total);
    }

    function createBalanceAdjustment(amountEvents, desiredBalance) {
        const currentBalance = calculateCurrentSaved(amountEvents);
        const nextBalance = toNonNegativeInteger(desiredBalance);
        return {
            amount: nextBalance - currentBalance,
            currentBalance,
            nextBalance
        };
    }

    function validateMilestonePercents(shortPercent = 25, mediumPercent = 60) {
        const short = Number(shortPercent);
        const medium = Number(mediumPercent);
        const errors = [];

        if (!Number.isFinite(short) || short <= 0) errors.push("短期門檻必須大於 0%。");
        if (!Number.isFinite(medium) || medium >= 100) errors.push("中期門檻必須小於 100%。");
        if (Number.isFinite(short) && Number.isFinite(medium) && short >= medium) {
            errors.push("短期門檻必須小於中期門檻。");
        }

        return { valid: errors.length === 0, errors, shortPercent: short, mediumPercent: medium };
    }

    function createMilestones(targetAmount, options = {}) {
        const target = toNonNegativeInteger(targetAmount);
        const validation = validateMilestonePercents(options.shortPercent ?? 25, options.mediumPercent ?? 60);
        if (!validation.valid) return { milestones: [], errors: validation.errors };

        return {
            errors: [],
            milestones: [
                {
                    id: "short",
                    label: String(options.shortLabel || "第一段累積"),
                    percent: validation.shortPercent,
                    targetAmount: Math.round(target * validation.shortPercent / 100)
                },
                {
                    id: "medium",
                    label: String(options.mediumLabel || "穩定前進"),
                    percent: validation.mediumPercent,
                    targetAmount: Math.round(target * validation.mediumPercent / 100)
                },
                {
                    id: "long",
                    label: String(options.longLabel || "完成主要目標"),
                    percent: 100,
                    targetAmount: target
                }
            ]
        };
    }

    function getScheduleStatus(plannedWeeklyMeals, requiredWeeklyMeals) {
        if (!Number.isFinite(requiredWeeklyMeals)) return null;
        if (plannedWeeklyMeals > requiredWeeklyMeals) return "ahead";
        if (plannedWeeklyMeals === requiredWeeklyMeals) return "on_track";
        return "behind";
    }

    function calculateGoalProjection(input = {}) {
        const targetAmount = toNonNegativeInteger(input.targetAmount);
        const currentSavedAmount = toNonNegativeInteger(input.currentSavedAmount);
        const estimatedSavingPerMeal = toNonNegativeInteger(input.estimatedSavingPerMeal);
        const weeklyCookingMeals = toNonNegativeInteger(input.weeklyCookingMeals);
        const remainingAmount = Math.max(0, targetAmount - currentSavedAmount);
        const now = input.now instanceof Date && !Number.isNaN(input.now.getTime())
            ? new Date(input.now.getTime())
            : new Date();

        const result = {
            status: "ready",
            targetAmount,
            currentSavedAmount,
            remainingAmount,
            mealsNeeded: null,
            estimatedWeeks: null,
            estimatedDate: null,
            targetDate: input.targetDate || null,
            requiredWeeklyMeals: null,
            scheduleStatus: null
        };

        if (targetAmount <= 0) return { ...result, status: "invalid_target" };
        if (remainingAmount === 0) {
            return { ...result, status: "completed", mealsNeeded: 0, estimatedWeeks: 0 };
        }
        if (estimatedSavingPerMeal <= 0) return { ...result, status: "no_saving" };

        const mealsNeeded = Math.ceil(remainingAmount / estimatedSavingPerMeal);
        result.mealsNeeded = mealsNeeded;

        const targetDate = parseDateOnly(input.targetDate);
        if (targetDate) {
            const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
            const remainingDays = Math.ceil((targetDate.getTime() - today.getTime()) / DAY_MS);
            if (remainingDays < 0) {
                result.scheduleStatus = "overdue";
            } else {
                const remainingWeeks = Math.max(remainingDays / 7, 1 / 7);
                result.requiredWeeklyMeals = Math.ceil(mealsNeeded / remainingWeeks);
                result.scheduleStatus = getScheduleStatus(weeklyCookingMeals, result.requiredWeeklyMeals);
            }
        }

        if (weeklyCookingMeals <= 0) return { ...result, status: "no_frequency" };

        result.estimatedWeeks = mealsNeeded / weeklyCookingMeals;
        const estimatedDays = Math.ceil(result.estimatedWeeks * 7);
        result.estimatedDate = formatDateOnly(new Date(now.getTime() + estimatedDays * DAY_MS));
        return result;
    }

    function createGoalFromDraft(draft = {}, options = {}) {
        const errors = [];
        const name = String(draft.name || "").trim();
        const purpose = String(draft.purpose || "custom");
        const targetAmount = toNonNegativeInteger(draft.targetAmount);
        const currentSavedAmount = toNonNegativeInteger(draft.currentSavedAmount);
        const eatingOutMeals = toNonNegativeInteger(draft.eatingOutMeals);
        const eatingOutTotal = toNonNegativeInteger(draft.eatingOutTotal);
        const calculatedBaseline = calculateAverageEatingOutCost(eatingOutTotal, eatingOutMeals);
        const eatingOutCost = calculatedBaseline ?? toNonNegativeInteger(draft.directEatingOutCost);
        const homeCookBudget = toNonNegativeInteger(draft.homeCookBudget);
        const weeklyCookingMeals = toNonNegativeInteger(draft.weeklyCookingMeals);
        const estimatedSavingPerMeal = calculateEstimatedSaving(eatingOutCost, homeCookBudget);
        const milestoneResult = createMilestones(targetAmount, {
            shortPercent: draft.shortPercent,
            mediumPercent: draft.mediumPercent,
            shortLabel: draft.shortLabel,
            mediumLabel: draft.mediumLabel,
            longLabel: draft.longLabel
        });

        if (!name) errors.push("請輸入目標名稱。");
        if (targetAmount <= 0) errors.push("目標金額必須大於 0 元。");
        if (eatingOutCost <= 0) errors.push("請提供可用的平均外食餐費。");
        if (weeklyCookingMeals < 0) errors.push("每週自煮餐數不能小於 0。");
        errors.push(...milestoneResult.errors);
        if (draft.targetDate && !parseDateOnly(draft.targetDate)) errors.push("目標日期格式不正確。");

        if (errors.length > 0) return { valid: false, errors };

        const now = options.now instanceof Date && !Number.isNaN(options.now.getTime())
            ? options.now
            : new Date();
        const createdAt = now.toISOString();
        const goalId = String(options.id || `goal_${now.getTime()}`);
        const goal = {
            id: goalId,
            purpose,
            name,
            targetAmount,
            targetDate: draft.targetDate || null,
            status: currentSavedAmount >= targetAmount ? "completed" : "active",
            createdAt,
            completedAt: currentSavedAmount >= targetAmount ? createdAt : null,
            milestones: milestoneResult.milestones
        };
        const cookingPlan = {
            eatingOutMeals,
            eatingOutTotal,
            eatingOutCost,
            homeCookBudget,
            weeklyCookingMeals,
            estimatedSavingPerMeal,
            updatedAt: createdAt
        };
        const openingEvent = {
            id: `${goalId}_opening`,
            goalId,
            type: "opening_balance",
            amount: currentSavedAmount,
            createdAt
        };

        return {
            valid: true,
            errors: [],
            goal,
            cookingPlan,
            openingEvent,
            projection: calculateGoalProjection({
                targetAmount,
                currentSavedAmount,
                estimatedSavingPerMeal,
                weeklyCookingMeals,
                targetDate: goal.targetDate,
                now
            })
        };
    }

    function getMilestoneProgress(milestones = [], currentSavedAmount = 0) {
        const saved = toNonNegativeInteger(currentSavedAmount);
        let currentAssigned = false;
        return (Array.isArray(milestones) ? milestones : []).map((milestone) => {
            const targetAmount = toNonNegativeInteger(milestone?.targetAmount);
            let status = "upcoming";
            if (saved >= targetAmount) status = "completed";
            else if (!currentAssigned) {
                status = "current";
                currentAssigned = true;
            }
            return {
                ...milestone,
                targetAmount,
                remainingAmount: Math.max(0, targetAmount - saved),
                status
            };
        });
    }

    function recordCookingOutcome(existingOutcomes = [], input = {}, options = {}) {
        const completionKey = String(input.completionKey || "").trim();
        const goalId = String(input.goalId || "").trim();
        if (!completionKey || !goalId) return { accepted: false, reason: "invalid_identity", outcome: null, amountEvents: [] };
        if ((Array.isArray(existingOutcomes) ? existingOutcomes : []).some((outcome) => outcome.completionKey === completionKey)) {
            return { accepted: false, reason: "duplicate", outcome: null, amountEvents: [] };
        }

        const estimatedSaving = toNonNegativeInteger(input.estimatedSaving);
        const actualDeposit = toNonNegativeInteger(input.actualDeposit);
        const mealDeposit = Math.min(actualDeposit, estimatedSaving);
        const extraDeposit = Math.max(0, actualDeposit - estimatedSaving);
        const now = options.now instanceof Date && !Number.isNaN(options.now.getTime()) ? options.now : new Date();
        const outcomeId = String(options.id || `meal_${now.getTime()}`);
        const createdAt = now.toISOString();
        const outcome = {
            id: outcomeId,
            completionKey,
            goalId,
            mealName: String(input.mealName || "自煮料理"),
            source: String(input.source || "manual"),
            eatingOutCost: toNonNegativeInteger(input.eatingOutCost),
            homeCookCost: toNonNegativeInteger(input.homeCookCost),
            estimatedSaving,
            actualDeposit,
            mealDeposit,
            extraDeposit,
            createdAt
        };
        const amountEvents = [];
        if (mealDeposit > 0) {
            amountEvents.push({ id: `${outcomeId}_meal`, goalId, outcomeId, type: "meal_deposit", amount: mealDeposit, createdAt });
        }
        if (extraDeposit > 0) {
            amountEvents.push({ id: `${outcomeId}_extra`, goalId, outcomeId, type: "extra_deposit", amount: extraDeposit, createdAt });
        }

        return { accepted: true, reason: null, outcome, amountEvents };
    }

    function getWeekStart(dateInput = new Date()) {
        const date = dateInput instanceof Date && !Number.isNaN(dateInput.getTime()) ? dateInput : new Date(dateInput);
        if (Number.isNaN(date.getTime())) return null;
        const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
        const day = utcDate.getUTCDay() || 7;
        utcDate.setUTCDate(utcDate.getUTCDate() - day + 1);
        return formatDateOnly(utcDate);
    }

    function buildHabitProgress(events = []) {
        const safeEvents = Array.isArray(events) ? events : [];
        const weeklyCompletions = safeEvents.reduce((result, event) => {
            if (event.weekKey) result[event.weekKey] = (result[event.weekKey] || 0) + 1;
            return result;
        }, {});
        return { totalMeals: safeEvents.length, weeklyCompletions, events: safeEvents };
    }

    function buildHealthAssets(events = []) {
        const safeEvents = Array.isArray(events) ? events : [];
        return {
            healthyAutonomyMeals: safeEvents.length,
            vegetableMeals: safeEvents.filter((event) => event.vegetables).length,
            lowOilMeals: safeEvents.filter((event) => event.lowOil).length,
            mindfulSeasoningMeals: safeEvents.filter((event) => event.mindfulSeasoning).length,
            events: safeEvents
        };
    }

    function recordMealProgress(habitProgress = {}, healthAssets = {}, input = {}, options = {}) {
        const outcomeId = String(input.outcomeId || "").trim();
        if (!outcomeId) return { accepted: false, reason: "invalid_outcome", habitProgress, healthAssets };
        const existingHabitEvents = Array.isArray(habitProgress.events) ? habitProgress.events : [];
        if (existingHabitEvents.some((event) => event.outcomeId === outcomeId)) {
            return { accepted: false, reason: "duplicate", habitProgress, healthAssets };
        }
        const now = options.now instanceof Date && !Number.isNaN(options.now.getTime()) ? options.now : new Date();
        const createdAt = now.toISOString();
        const nextHabitProgress = buildHabitProgress([...existingHabitEvents, { outcomeId, createdAt, weekKey: getWeekStart(now) }]);
        const vegetables = Boolean(input.vegetables);
        const lowOil = Boolean(input.lowOil);
        const mindfulSeasoning = Boolean(input.mindfulSeasoning);
        const qualifiesForHealth = Boolean(input.foodSafe) && (vegetables || lowOil || mindfulSeasoning);
        const existingHealthEvents = Array.isArray(healthAssets.events) ? healthAssets.events : [];
        const nextHealthEvents = qualifiesForHealth
            ? [...existingHealthEvents, { outcomeId, createdAt, vegetables, lowOil, mindfulSeasoning, source: "self_reported" }]
            : existingHealthEvents;
        return {
            accepted: true,
            reason: null,
            habitProgress: nextHabitProgress,
            healthAssets: buildHealthAssets(nextHealthEvents),
            healthRecorded: qualifiesForHealth
        };
    }

    function calculateHabitSummary(habitProgress = {}, weeklyGoal = 0, now = new Date()) {
        const goal = toNonNegativeInteger(weeklyGoal);
        const currentWeek = getWeekStart(now);
        const weeklyCompletions = habitProgress.weeklyCompletions || {};
        const currentWeekMeals = toNonNegativeInteger(weeklyCompletions[currentWeek]);
        if (goal <= 0) return { currentWeek, currentWeekMeals, weeklyGoal: 0, achieved: null, streakWeeks: 0 };
        let streakWeeks = 0;
        let cursor = parseDateOnly(currentWeek);
        while (cursor) {
            const key = formatDateOnly(cursor);
            if (toNonNegativeInteger(weeklyCompletions[key]) < goal) break;
            streakWeeks += 1;
            cursor = new Date(cursor.getTime() - 7 * DAY_MS);
        }
        return { currentWeek, currentWeekMeals, weeklyGoal: goal, achieved: currentWeekMeals >= goal, streakWeeks };
    }

    function applyGoalProgress(goal, currentSavedAmount, options = {}) {
        if (!goal) return { goal: null, newlyCompleted: false };
        const saved = toNonNegativeInteger(currentSavedAmount);
        const now = options.now instanceof Date && !Number.isNaN(options.now.getTime()) ? options.now : new Date();
        const completedAt = now.toISOString();
        const wasCompleted = goal.status === "completed";
        const isCompleted = saved >= toNonNegativeInteger(goal.targetAmount);
        const milestones = (Array.isArray(goal.milestones) ? goal.milestones : []).map((milestone) => ({
            ...milestone,
            completedAt: saved >= toNonNegativeInteger(milestone.targetAmount)
                ? (milestone.completedAt || completedAt)
                : (milestone.completedAt || null)
        }));
        return {
            newlyCompleted: isCompleted && !wasCompleted,
            goal: {
                ...goal,
                status: isCompleted ? "completed" : "active",
                completedAt: isCompleted ? (goal.completedAt || completedAt) : null,
                completionPromptDismissedAt: isCompleted ? (goal.completionPromptDismissedAt || null) : null,
                milestones
            }
        };
    }

    function createEmptyState() {
        return {
            version: VERSION,
            activeGoal: null,
            archivedGoals: [],
            amountEvents: [],
            cookingPlan: null,
            cookingOutcomes: [],
            habitProgress: {
                totalMeals: 0,
                weeklyCompletions: {},
                events: []
            },
            healthAssets: {
                healthyAutonomyMeals: 0,
                vegetableMeals: 0,
                lowOilMeals: 0,
                mindfulSeasoningMeals: 0,
                events: []
            }
        };
    }

    const api = {
        STORAGE_KEY,
        VERSION,
        calculateAverageEatingOutCost,
        suggestHomeCookBudget,
        calculateEstimatedSaving,
        calculateCurrentSaved,
        createBalanceAdjustment,
        validateMilestonePercents,
        createMilestones,
        calculateGoalProjection,
        createGoalFromDraft,
        getMilestoneProgress,
        recordCookingOutcome,
        getWeekStart,
        recordMealProgress,
        calculateHabitSummary,
        applyGoalProgress,
        createEmptyState,
        parseDateOnly,
        formatDateOnly
    };

    if (typeof module !== "undefined" && module.exports) module.exports = api;
    if (globalScope) globalScope.SingleGoalDomain = api;
})(typeof window !== "undefined" ? window : globalThis);
