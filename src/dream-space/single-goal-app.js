(function initSingleGoalApp(globalScope) {
    const domain = globalScope.SingleGoalDomain;
    if (!domain) return;
    const LEGACY_BACKUP_KEY = "coocoo.dreams.legacy-backup.v1";

    const PURPOSES = {
        travel: { label: "旅遊基金", icon: "flight", example: "日本旅行" },
        emergency: { label: "緊急預備金", icon: "shield", example: "三個月緊急預備金" },
        savings: { label: "一般儲蓄", icon: "savings", example: "年度儲蓄計畫" },
        custom: { label: "其他目標", icon: "flag", example: "我的存錢目標" }
    };

    ensureLegacyBackup();
    let state = loadState();
    let draft = null;
    let step = 0;
    let activeContainer = null;
    let errorMessage = "";
    let pendingMeal = null;

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function formatMoney(value) {
        return `NT$ ${Math.max(0, Math.round(Number(value) || 0)).toLocaleString("zh-TW")}`;
    }

    function loadState() {
        try {
            const parsed = JSON.parse(localStorage.getItem(domain.STORAGE_KEY) || "null");
            if (parsed?.version === domain.VERSION) return normalizeState(parsed);
        } catch (error) {
            console.warn("單一目標資料無法讀取，改用空白新版狀態。", error);
        }
        return domain.createEmptyState();
    }

    function normalizeState(input) {
        const empty = domain.createEmptyState();
        return {
            ...empty,
            ...input,
            archivedGoals: Array.isArray(input.archivedGoals) ? input.archivedGoals : [],
            amountEvents: Array.isArray(input.amountEvents) ? input.amountEvents : [],
            cookingOutcomes: Array.isArray(input.cookingOutcomes) ? input.cookingOutcomes : [],
            habitProgress: {
                ...empty.habitProgress,
                ...(input.habitProgress || {}),
                events: Array.isArray(input.habitProgress?.events) ? input.habitProgress.events : []
            },
            healthAssets: {
                ...empty.healthAssets,
                ...(input.healthAssets || {}),
                events: Array.isArray(input.healthAssets?.events) ? input.healthAssets.events : []
            }
        };
    }

    function ensureLegacyBackup() {
        if (localStorage.getItem(LEGACY_BACKUP_KEY)) return;
        try {
            const legacy = JSON.parse(localStorage.getItem("coocoo_state") || "null");
            if (!legacy || (!Array.isArray(legacy.dreams) && !legacy.dreamSpace)) return;
            const backup = {
                version: 1,
                exportedAt: new Date().toISOString(),
                source: "coocoo_state",
                dreams: Array.isArray(legacy.dreams) ? legacy.dreams : [],
                activeDreamId: legacy.activeDreamId || null,
                dreamSpace: legacy.dreamSpace || null,
                savingsGoal: legacy.savingsGoal || null
            };
            localStorage.setItem(LEGACY_BACKUP_KEY, JSON.stringify(backup));
        } catch (error) {
            console.warn("舊圓夢資料備份失敗，未影響新版資料。", error);
        }
    }

    function persistState() {
        localStorage.setItem(domain.STORAGE_KEY, JSON.stringify(state));
    }

    function createDraft() {
        return {
            purpose: "travel",
            name: "日本旅行",
            targetAmount: 30000,
            currentSavedAmount: 0,
            targetDate: "",
            eatingOutMeals: 7,
            eatingOutTotal: 1050,
            directEatingOutCost: 150,
            homeCookBudget: 90,
            weeklyCookingMeals: 3,
            shortPercent: 25,
            mediumPercent: 60,
            shortLabel: "先完成第一筆累積",
            mediumLabel: "穩定存到一半以上",
            longLabel: "完成日本旅行基金"
        };
    }

    function startOnboarding() {
        draft = createDraft();
        step = 1;
        errorMessage = "";
        renderActive();
    }

    function cancelOnboarding() {
        draft = null;
        step = 0;
        errorMessage = "";
        renderActive();
    }

    function render(container) {
        activeContainer = container;
        renderActive();
        return true;
    }

    function renderActive() {
        if (!activeContainer) return;
        if (draft && step > 0) {
            renderOnboarding();
            return;
        }
        if (!state.activeGoal) {
            renderEmptyState();
            return;
        }
        const completion = syncGoalStatus();
        renderSetupComplete();
        if (completion.newlyCompleted || (state.activeGoal.status === "completed" && !state.activeGoal.completionPromptDismissedAt)) {
            setTimeout(openCompletionPrompt, 0);
        }
    }

    function syncGoalStatus() {
        if (!state.activeGoal) return { newlyCompleted: false };
        const saved = domain.calculateCurrentSaved(state.amountEvents.filter((event) => event.goalId === state.activeGoal.id));
        const previousGoal = JSON.stringify(state.activeGoal);
        const result = domain.applyGoalProgress(state.activeGoal, saved);
        state.activeGoal = result.goal;
        if (previousGoal !== JSON.stringify(result.goal)) persistState();
        return result;
    }

    function renderEmptyState() {
        activeContainer.innerHTML = `
            <div class="single-goal-shell max-w-[760px] mx-auto space-y-md">
                <section class="bg-white rounded-3xl border border-primary/15 shadow-sm overflow-hidden">
                    <div class="h-2 bg-gradient-to-r from-primary via-terracotta to-ochre-gold"></div>
                    <div class="p-lg md:p-xl text-center">
                        <span class="material-symbols-outlined text-primary text-5xl" aria-hidden="true">park</span>
                        <p class="mt-md text-xs font-extrabold tracking-[0.18em] text-secondary">一個目標，一條清楚的路</p>
                        <h2 class="mt-sm text-2xl md:text-3xl font-extrabold text-slate-blue">用每一次自煮，靠近真正想完成的事</h2>
                        <p class="mt-sm text-sm leading-6 text-on-surface-variant max-w-[520px] mx-auto">先設定目前已存金額與飲食支出，系統會建議每餐自煮預算，算出還差多少、約要煮多久。所有建議都能調整。</p>
                        <button type="button" onclick="SingleGoalApp.startOnboarding()" class="cursor-pointer mt-lg inline-flex items-center justify-center gap-sm rounded-full bg-primary px-lg py-3 text-sm font-extrabold text-white shadow-sm transition-colors duration-200 hover:bg-on-primary-container focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25">
                            <span class="material-symbols-outlined" aria-hidden="true">add_circle</span>
                            設定主要目標
                        </button>
                        <p class="mt-md text-[11px] text-outline">舊版多夢想資料不會被刪除，也不會自動加入新版進度。</p>
                    </div>
                </section>
                ${renderGoalHistory()}
            </div>`;
    }

    function renderSetupComplete() {
        const saved = domain.calculateCurrentSaved(state.amountEvents.filter((event) => event.goalId === state.activeGoal.id));
        const projection = domain.calculateGoalProjection({
            targetAmount: state.activeGoal.targetAmount,
            currentSavedAmount: saved,
            estimatedSavingPerMeal: state.cookingPlan.estimatedSavingPerMeal,
            weeklyCookingMeals: state.cookingPlan.weeklyCookingMeals,
            targetDate: state.activeGoal.targetDate
        });
        const progressPercent = Math.min(100, Math.round(saved / Math.max(1, state.activeGoal.targetAmount) * 100));
        const milestones = domain.getMilestoneProgress(state.activeGoal.milestones, saved);
        const purpose = PURPOSES[state.activeGoal.purpose] || PURPOSES.custom;
        const habitSummary = domain.calculateHabitSummary(state.habitProgress, state.cookingPlan.weeklyCookingMeals);
        activeContainer.innerHTML = `
            <div class="single-goal-shell max-w-[860px] mx-auto space-y-md">
                <header class="flex items-start justify-between gap-md">
                    <div>
                        <p class="text-[11px] font-extrabold tracking-[0.16em] text-secondary">圓夢看板</p>
                        <h2 class="mt-1 text-2xl md:text-3xl font-extrabold text-slate-blue">一個目標，一條清楚的路</h2>
                    </div>
                    <button type="button" onclick="SingleGoalApp.openSettings()" class="cursor-pointer inline-flex shrink-0 items-center gap-xs rounded-full border border-primary/25 bg-white px-md py-2 text-xs font-extrabold text-primary transition-colors duration-200 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20">
                        <span class="material-symbols-outlined text-base" aria-hidden="true">tune</span>調整
                    </button>
                </header>

                <section class="overflow-hidden rounded-3xl border border-primary/15 bg-white shadow-sm">
                    <div class="h-2 bg-gradient-to-r from-primary via-terracotta to-ochre-gold"></div>
                    <div class="p-lg md:p-xl">
                        <div class="flex items-start justify-between gap-md">
                            <div class="min-w-0">
                                <span class="inline-flex items-center gap-xs rounded-full bg-primary/10 px-3 py-1 text-[10px] font-extrabold text-primary"><span class="material-symbols-outlined text-sm" aria-hidden="true">${purpose.icon}</span>${escapeHtml(purpose.label)}</span>
                                <h3 class="mt-sm break-words text-2xl font-extrabold text-slate-blue">${escapeHtml(state.activeGoal.name)}</h3>
                            </div>
                            <div class="shrink-0 text-right"><strong class="block text-2xl text-primary">${progressPercent}%</strong><span class="text-[10px] text-outline">主要進度</span></div>
                        </div>

                        <div class="mt-lg h-3 overflow-hidden rounded-full bg-surface-container" role="progressbar" aria-label="${escapeHtml(state.activeGoal.name)}存錢進度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progressPercent}">
                            <div class="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none" style="width:${progressPercent}%"></div>
                        </div>

                        <div class="mt-md grid grid-cols-2 gap-sm">
                            <div class="rounded-2xl bg-surface-container-low p-md"><span class="text-[11px] text-on-surface-variant">目前已存</span><strong class="mt-1 block text-xl text-slate-blue">${formatMoney(saved)}</strong></div>
                            <div class="rounded-2xl bg-primary/5 p-md"><span class="text-[11px] text-on-surface-variant">距離目標</span><strong class="mt-1 block text-xl text-primary">${formatMoney(projection.remainingAmount)}</strong></div>
                        </div>

                        <div class="mt-md rounded-2xl border border-secondary/25 bg-secondary/5 p-md">
                            <div class="flex items-start gap-sm"><span class="material-symbols-outlined text-secondary" aria-hidden="true">route</span><div><strong class="block text-sm text-slate-blue">${escapeHtml(projectionMessage(projection))}</strong><p class="mt-1 text-[10px] leading-4 text-outline">依每餐估算節省 ${formatMoney(state.cookingPlan.estimatedSavingPerMeal)} 與每週 ${state.cookingPlan.weeklyCookingMeals} 餐計算，會隨設定更新。</p></div></div>
                        </div>
                    </div>
                </section>

                ${state.activeGoal.status === "completed" ? `<section class="rounded-3xl border border-secondary/30 bg-secondary/10 p-lg shadow-sm"><div class="flex flex-col sm:flex-row sm:items-center justify-between gap-md"><div class="flex items-start gap-sm"><span class="material-symbols-outlined text-secondary text-4xl" aria-hidden="true">celebration</span><div><p class="text-[10px] font-extrabold text-secondary">目標已完成</p><h3 class="mt-1 text-lg font-extrabold text-slate-blue">你已完成「${escapeHtml(state.activeGoal.name)}」</h3><p class="mt-1 text-xs text-on-surface-variant">完成於 ${escapeHtml((state.activeGoal.completedAt || "").slice(0, 10))}，健康資產與自煮累積會繼續保留。</p></div></div><button type="button" onclick="SingleGoalApp.startNextGoal()" class="cursor-pointer shrink-0 rounded-full bg-secondary px-lg py-3 text-xs font-extrabold text-white hover:bg-on-secondary-container focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary/25">設定下一個目標</button></div></section>` : ""}

                <div class="grid grid-cols-1 md:grid-cols-[1.15fr_.85fr] gap-md">
                    <section class="rounded-3xl border border-secondary/20 bg-white p-lg shadow-sm" aria-labelledby="single-goal-path-title">
                        <div class="flex items-center justify-between gap-sm"><div><p class="text-[10px] font-extrabold text-secondary">同一個終極目標</p><h3 id="single-goal-path-title" class="mt-1 text-lg font-extrabold text-slate-blue">短、中、長期路徑</h3></div><span class="material-symbols-outlined text-secondary text-3xl" aria-hidden="true">park</span></div>
                        <ol class="mt-md space-y-0">
                            ${milestones.map((item, index) => renderMilestonePathItem(item, index === milestones.length - 1)).join("")}
                        </ol>
                    </section>

                    <div class="space-y-md">
                        <section class="rounded-3xl border border-primary/15 bg-white p-lg shadow-sm">
                            <div class="flex items-start justify-between gap-sm"><div><p class="text-[10px] font-extrabold text-primary">本週自煮計畫</p><h3 class="mt-1 text-lg font-extrabold text-slate-blue">每週 ${state.cookingPlan.weeklyCookingMeals} 餐</h3></div><span class="material-symbols-outlined text-primary text-3xl" aria-hidden="true">skillet</span></div>
                            <div class="mt-md grid grid-cols-2 gap-sm text-center"><div class="rounded-2xl bg-surface-container-low p-sm"><span class="block text-[10px] text-outline">每餐預算</span><strong class="text-sm text-slate-blue">${formatMoney(state.cookingPlan.homeCookBudget)}</strong></div><div class="rounded-2xl bg-surface-container-low p-sm"><span class="block text-[10px] text-outline">每餐估算節省</span><strong class="text-sm text-secondary">${formatMoney(state.cookingPlan.estimatedSavingPerMeal)}</strong></div></div>
                        </section>

                        <section class="rounded-3xl border border-secondary/20 bg-white p-lg shadow-sm">
                            <p class="text-[10px] font-extrabold text-secondary">輔助成果</p>
                            <div class="mt-sm grid grid-cols-2 gap-sm"><div class="rounded-2xl bg-secondary/5 p-sm"><span class="material-symbols-outlined text-secondary" aria-hidden="true">restaurant</span><strong class="mt-1 block text-sm text-slate-blue">${state.habitProgress.totalMeals || 0} 餐</strong><span class="text-[10px] text-outline">累積自煮</span><p class="mt-1 text-[10px] text-on-surface-variant">本週 ${habitSummary.currentWeekMeals}/${habitSummary.weeklyGoal || "未設定"}</p></div><div class="rounded-2xl bg-secondary/5 p-sm"><span class="material-symbols-outlined text-secondary" aria-hidden="true">health_and_safety</span><strong class="mt-1 block text-sm text-slate-blue">${state.healthAssets.healthyAutonomyMeals || 0} 餐</strong><span class="text-[10px] text-outline">健康自主餐</span><p class="mt-1 text-[10px] text-on-surface-variant">連續達成 ${habitSummary.streakWeeks} 週</p></div></div>
                            <div class="mt-sm grid grid-cols-3 gap-xs text-center"><div class="rounded-xl bg-surface-container-low p-xs"><strong class="block text-xs text-slate-blue">${state.healthAssets.vegetableMeals || 0}</strong><span class="text-[9px] text-outline">有蔬菜</span></div><div class="rounded-xl bg-surface-container-low p-xs"><strong class="block text-xs text-slate-blue">${state.healthAssets.lowOilMeals || 0}</strong><span class="text-[9px] text-outline">少油料理</span></div><div class="rounded-xl bg-surface-container-low p-xs"><strong class="block text-xs text-slate-blue">${state.healthAssets.mindfulSeasoningMeals || 0}</strong><span class="text-[9px] text-outline">控制調味</span></div></div>
                            <p class="mt-sm text-[10px] leading-4 text-outline">自煮與健康成果獨立累積，不會被當成實際存款。</p>
                        </section>
                    </div>
                </div>
                ${renderGoalHistory()}
            </div>`;
    }

    function renderGoalHistory() {
        if (!state.archivedGoals.length) return "";
        return `<section class="rounded-3xl border border-outline-variant/30 bg-white p-lg shadow-sm"><p class="text-[10px] font-extrabold text-secondary">完成紀錄</p><h3 class="mt-1 text-lg font-extrabold text-slate-blue">走過的目標</h3><div class="mt-md space-y-sm">${state.archivedGoals.slice(0, 5).map((goal) => `<div class="flex items-center justify-between gap-md rounded-2xl bg-surface-container-low p-md"><div class="min-w-0"><strong class="block truncate text-sm text-slate-blue">${escapeHtml(goal.name)}</strong><span class="text-[10px] text-outline">完成於 ${escapeHtml((goal.completedAt || "").slice(0, 10))}</span></div><span class="shrink-0 text-xs font-bold text-secondary">${formatMoney(goal.finalSavedAmount || goal.targetAmount)}</span></div>`).join("")}</div></section>`;
    }

    const BASELINE_KEY = "coocoo.single-goal.baseline-plan.v1";

    function getSavedBaselinePlan() {
        try {
            const saved = JSON.parse(localStorage.getItem(BASELINE_KEY) || "null");
            if (saved && saved.targetAmount > 0) return saved;
        } catch (e) {
            console.warn("無法讀取基準計畫，使用標準預設值", e);
        }
        return {
            purpose: "travel",
            name: "日本旅行",
            targetAmount: 30000,
            currentSavedAmount: 7500,
            targetDate: "2026-12-31",
            homeCookBudget: 90,
            weeklyCookingMeals: 3,
            eatingOutMeals: 7,
            eatingOutTotal: 1050,
            directEatingOutCost: 150,
            shortPercent: 25,
            mediumPercent: 60,
            shortLabel: "啟動準備",
            mediumLabel: "機票半數",
            longLabel: "完成日本旅行"
        };
    }

    function persistBaselinePlan(goal, cookingPlan, savedAmount) {
        if (!goal || !cookingPlan) return;
        const baseline = {
            purpose: goal.purpose || "travel",
            name: goal.name || "日本旅行",
            targetAmount: Number(goal.targetAmount) || 30000,
            currentSavedAmount: Number.isFinite(savedAmount) ? savedAmount : 7500,
            targetDate: goal.targetDate || "2026-12-31",
            homeCookBudget: Number(cookingPlan.homeCookBudget) || 90,
            weeklyCookingMeals: Number(cookingPlan.weeklyCookingMeals) || 3,
            eatingOutMeals: Number(cookingPlan.eatingOutMeals) || 7,
            eatingOutTotal: Number(cookingPlan.eatingOutTotal) || 1050,
            directEatingOutCost: Number(cookingPlan.eatingOutCost) || 150,
            shortPercent: goal.milestones?.[0]?.percent || 25,
            mediumPercent: goal.milestones?.[1]?.percent || 60,
            shortLabel: goal.milestones?.[0]?.label || "啟動準備",
            mediumLabel: goal.milestones?.[1]?.label || "機票半數",
            longLabel: goal.milestones?.[2]?.label || "完成日本旅行"
        };
        try {
            localStorage.setItem(BASELINE_KEY, JSON.stringify(baseline));
        } catch (e) {
            console.warn("無法寫入基準計畫", e);
        }
    }

    function ensureTestActiveGoal(completed = false) {
        if (!state.activeGoal) {
            const baselineDraft = getSavedBaselinePlan();
            if (completed) {
                baselineDraft.currentSavedAmount = baselineDraft.targetAmount;
            }
            const result = domain.createGoalFromDraft(baselineDraft, {
                id: globalScope.crypto?.randomUUID?.() || `goal_${Date.now()}`
            });
            state.activeGoal = result.goal;
            state.cookingPlan = result.cookingPlan;
            state.amountEvents.push(result.openingEvent);
        }
        if (completed && state.activeGoal) {
            state.activeGoal.status = "completed";
            state.activeGoal.completedAt = state.activeGoal.completedAt || new Date().toISOString();
        }
        const goalEvents = state.amountEvents.filter((event) => event.goalId === state.activeGoal.id);
        const currentSaved = domain.calculateCurrentSaved(goalEvents);
        persistBaselinePlan(state.activeGoal, state.cookingPlan, currentSaved);
        persistState();
    }

    function openCompletionPrompt() {
        ensureTestActiveGoal(true);
        document.getElementById("single-goal-completed")?.remove();
        const modal = document.createElement("div");
        modal.id = "single-goal-completed";
        modal.className = "fixed inset-0 z-[90] flex items-end justify-center bg-black/55 p-sm backdrop-blur-sm sm:items-center";
        modal.setAttribute("role", "dialog");
        modal.setAttribute("aria-modal", "true");
        modal.setAttribute("aria-labelledby", "single-goal-completed-title");
        modal.innerHTML = `<div class="w-full max-w-[460px] rounded-t-3xl bg-white p-lg text-center shadow-2xl sm:rounded-3xl"><span class="material-symbols-outlined text-5xl text-secondary motion-safe:animate-pulse" aria-hidden="true">celebration</span><p class="mt-sm text-[10px] font-extrabold tracking-[0.16em] text-secondary">主要目標完成</p><h2 id="single-goal-completed-title" class="mt-1 text-2xl font-extrabold text-slate-blue">恭喜完成「${escapeHtml(state.activeGoal.name)}」</h2><p class="mt-sm text-sm leading-6 text-on-surface-variant">這個成果會保留在完成紀錄。要接著設定下一個存錢目標嗎？</p><div class="mt-lg flex flex-col-reverse sm:flex-row gap-sm"><button type="button" onclick="SingleGoalApp.dismissCompletionPrompt()" class="cursor-pointer flex-1 rounded-full border border-secondary/30 py-3 text-xs font-extrabold text-secondary hover:bg-secondary/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary/20">稍後再說</button><button type="button" onclick="SingleGoalApp.startNextGoal()" class="cursor-pointer flex-1 rounded-full bg-secondary py-3 text-xs font-extrabold text-white hover:bg-on-secondary-container focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary/25">設定新目標</button></div></div>`;
        document.body.appendChild(modal);
        modal.querySelector("button")?.focus();
    }

    function dismissCompletionPrompt() {
        if (state.activeGoal?.status === "completed") {
            state.activeGoal.completionPromptDismissedAt = new Date().toISOString();
            persistState();
        }
        document.getElementById("single-goal-completed")?.remove();
    }

    function startNextGoal() {
        if (!state.activeGoal || state.activeGoal.status !== "completed") return;
        const saved = domain.calculateCurrentSaved(state.amountEvents.filter((event) => event.goalId === state.activeGoal.id));
        state.archivedGoals.unshift({
            ...state.activeGoal,
            finalSavedAmount: saved,
            cookingPlan: state.cookingPlan,
            archivedAt: new Date().toISOString()
        });
        state.activeGoal = null;
        state.cookingPlan = null;
        persistState();
        document.getElementById("single-goal-completed")?.remove();
        startOnboarding();
    }

    function renderMilestonePathItem(item, isLast) {
        const statusMeta = item.status === "completed"
            ? { icon: "check", circle: "bg-secondary text-white", title: "已完成", detail: item.completedAt ? `完成於 ${item.completedAt.slice(0, 10)}` : "已跨過這個累積門檻" }
            : item.status === "current"
                ? { icon: "trending_up", circle: "bg-primary text-white", title: "目前進行中", detail: `再 ${formatMoney(item.remainingAmount)} 到這一階段` }
                : { icon: "lock_open", circle: "bg-surface-container-high text-on-surface-variant", title: "下一階段", detail: `累積到 ${formatMoney(item.targetAmount)}` };
        return `<li class="grid grid-cols-[40px_1fr] gap-sm"><div class="flex flex-col items-center"><span class="flex h-9 w-9 items-center justify-center rounded-full ${statusMeta.circle}"><span class="material-symbols-outlined text-lg" aria-hidden="true">${statusMeta.icon}</span></span>${isLast ? "" : `<span class="min-h-10 w-0.5 flex-1 bg-outline-variant/50" aria-hidden="true"></span>`}</div><div class="pb-md"><div class="flex items-center justify-between gap-sm"><strong class="text-sm text-slate-blue">${escapeHtml(item.label)}</strong><span class="text-[10px] font-bold text-on-surface-variant">${item.percent}%</span></div><p class="mt-1 text-[11px] text-on-surface-variant">${statusMeta.title} · ${statusMeta.detail}</p></div></li>`;
    }

    function openSettings() {
        closeSettings();
        ensureTestActiveGoal(false);
        if (!state.activeGoal || !state.cookingPlan) return;
        const goalEvents = state.amountEvents.filter((event) => event.goalId === state.activeGoal.id);
        const saved = domain.calculateCurrentSaved(goalEvents);
        const modal = document.createElement("div");
        modal.id = "single-goal-settings";
        modal.className = "fixed inset-0 z-[70] flex items-end justify-center bg-black/55 p-sm backdrop-blur-sm sm:items-center";
        modal.setAttribute("role", "dialog");
        modal.setAttribute("aria-modal", "true");
        modal.setAttribute("aria-labelledby", "single-goal-settings-title");
        modal.innerHTML = `<div class="max-h-[88vh] w-full max-w-[520px] overflow-y-auto rounded-t-3xl bg-white p-lg shadow-2xl sm:rounded-3xl"><div class="flex items-start justify-between gap-md"><div><p class="text-[10px] font-extrabold text-secondary">隨生活調整</p><h2 id="single-goal-settings-title" class="mt-1 text-xl font-extrabold text-slate-blue">主要目標與自煮計畫</h2></div><button type="button" onclick="SingleGoalApp.closeSettings()" aria-label="關閉調整視窗" class="cursor-pointer rounded-full p-2 text-on-surface-variant hover:bg-surface-container focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"><span class="material-symbols-outlined" aria-hidden="true">close</span></button></div><div class="mt-md grid grid-cols-1 sm:grid-cols-2 gap-md"><label class="text-xs font-bold text-on-surface-variant">目標金額<input id="sg-settings-target" class="${fieldClass()}" type="number" inputmode="numeric" min="1" value="${state.activeGoal.targetAmount}"></label><label class="text-xs font-bold text-on-surface-variant">目前已存<input id="sg-settings-saved" class="${fieldClass()}" type="number" inputmode="numeric" min="0" value="${saved}"><span class="mt-1 block text-[10px] font-normal text-outline">修正會保存成一筆差額紀錄。</span></label><label class="text-xs font-bold text-on-surface-variant">目標日期（選填）<input id="sg-settings-date" class="${fieldClass()}" type="date" value="${escapeHtml(state.activeGoal.targetDate || "")}"></label><label class="text-xs font-bold text-on-surface-variant">每餐自煮預算<input id="sg-settings-budget" class="${fieldClass()}" type="number" inputmode="numeric" min="0" value="${state.cookingPlan.homeCookBudget}"></label><label class="text-xs font-bold text-on-surface-variant sm:col-span-2">每週預計自煮餐數<input id="sg-settings-weekly" class="${fieldClass()}" type="number" inputmode="numeric" min="0" max="21" value="${state.cookingPlan.weeklyCookingMeals}"></label></div><p id="sg-settings-error" role="alert" class="hidden mt-md rounded-xl bg-error-container px-md py-sm text-xs font-bold text-on-error-container"></p><div class="mt-lg flex gap-sm"><button type="button" onclick="SingleGoalApp.closeSettings()" class="cursor-pointer flex-1 rounded-full border border-primary/25 py-3 text-xs font-extrabold text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20">取消</button><button type="button" onclick="SingleGoalApp.saveSettings()" class="cursor-pointer flex-1 rounded-full bg-primary py-3 text-xs font-extrabold text-white hover:bg-on-primary-container focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25">儲存調整</button></div></div>`;
        if (localStorage.getItem(LEGACY_BACKUP_KEY)) {
            modal.querySelector("#sg-settings-error")?.insertAdjacentHTML("beforebegin", `<button type="button" onclick="SingleGoalApp.exportLegacyDreams()" class="mt-md inline-flex cursor-pointer items-center gap-xs text-[11px] font-bold text-on-surface-variant underline decoration-outline-variant underline-offset-4 hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"><span class="material-symbols-outlined text-base" aria-hidden="true">download</span>匯出舊版圓夢資料</button>`);
        }
        document.body.appendChild(modal);
        document.getElementById("sg-settings-target")?.focus();
    }

    function closeSettings() {
        document.getElementById("single-goal-settings")?.remove();
    }

    function exportLegacyDreams() {
        const raw = localStorage.getItem(LEGACY_BACKUP_KEY);
        if (!raw) return;
        const blob = new Blob([raw], { type: "application/json;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `coocoo-legacy-dreams-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }

    function reset() {
        state = domain.createEmptyState();
        persistState();
        draft = null;
        step = 0;
        pendingMeal = null;
        document.getElementById("single-goal-settings")?.remove();
        document.getElementById("single-goal-meal-completion")?.remove();
        document.getElementById("single-goal-completed")?.remove();
        if (activeContainer) renderActive();
    }

    function showSettingsError(message) {
        const element = document.getElementById("sg-settings-error");
        if (!element) return;
        element.textContent = message;
        element.classList.remove("hidden");
    }

    function saveSettings() {
        const targetAmount = Number(document.getElementById("sg-settings-target")?.value);
        const desiredSaved = Number(document.getElementById("sg-settings-saved")?.value);
        const targetDate = document.getElementById("sg-settings-date")?.value || "";
        const homeCookBudget = Number(document.getElementById("sg-settings-budget")?.value);
        const weeklyCookingMeals = Number(document.getElementById("sg-settings-weekly")?.value);
        if (!Number.isFinite(targetAmount) || targetAmount <= 0) return showSettingsError("目標金額必須大於 0 元。");
        if (!Number.isFinite(desiredSaved) || desiredSaved < 0) return showSettingsError("目前已存金額不能小於 0 元。");
        if (targetDate && !domain.parseDateOnly(targetDate)) return showSettingsError("目標日期格式不正確。");
        if (!Number.isFinite(homeCookBudget) || homeCookBudget < 0) return showSettingsError("每餐自煮預算不能小於 0 元。");
        if (!Number.isInteger(weeklyCookingMeals) || weeklyCookingMeals < 0 || weeklyCookingMeals > 21) return showSettingsError("每週自煮餐數請填 0 到 21 的整數。");

        const goalEvents = state.amountEvents.filter((event) => event.goalId === state.activeGoal.id);
        const adjustment = domain.createBalanceAdjustment(goalEvents, desiredSaved);
        if (adjustment.amount !== 0) {
            state.amountEvents.push({ id: globalScope.crypto?.randomUUID?.() || `adjust_${Date.now()}`, goalId: state.activeGoal.id, type: "manual_adjustment", amount: adjustment.amount, createdAt: new Date().toISOString() });
        }
        const oldMilestones = state.activeGoal.milestones;
        const rebuilt = domain.createMilestones(targetAmount, {
            shortPercent: oldMilestones[0].percent,
            mediumPercent: oldMilestones[1].percent,
            shortLabel: oldMilestones[0].label,
            mediumLabel: oldMilestones[1].label,
            longLabel: oldMilestones[2].label
        });
        state.activeGoal.targetAmount = Math.round(targetAmount);
        state.activeGoal.targetDate = targetDate || null;
        state.activeGoal.milestones = rebuilt.milestones;
        state.cookingPlan.homeCookBudget = Math.round(homeCookBudget);
        state.cookingPlan.weeklyCookingMeals = weeklyCookingMeals;
        state.cookingPlan.estimatedSavingPerMeal = domain.calculateEstimatedSaving(state.cookingPlan.eatingOutCost, homeCookBudget);
        state.cookingPlan.updatedAt = new Date().toISOString();
        persistBaselinePlan(state.activeGoal, state.cookingPlan, desiredSaved);
        persistState();
        closeSettings();
        renderActive();
    }

    function promptMealCompletion(input = {}) {
        if (!state.activeGoal || !state.cookingPlan) return false;
        const completionKey = String(input.completionKey || globalScope.crypto?.randomUUID?.() || `meal_${Date.now()}`);
        if (state.cookingOutcomes.some((outcome) => outcome.completionKey === completionKey)) return false;
        const homeCookCost = Number.isFinite(Number(input.homeCookCost))
            ? Math.max(0, Math.round(Number(input.homeCookCost)))
            : state.cookingPlan.homeCookBudget;
        pendingMeal = {
            completionKey,
            mealName: String(input.mealName || "自煮料理"),
            source: String(input.source || "manual"),
            eatingOutCost: state.cookingPlan.eatingOutCost,
            homeCookCost,
            estimatedSaving: domain.calculateEstimatedSaving(state.cookingPlan.eatingOutCost, homeCookCost)
        };
        renderMealCompletionModal();
        return true;
    }

    function renderMealCompletionModal() {
        closeMealCompletion(false);
        if (!pendingMeal) return;
        const modal = document.createElement("div");
        modal.id = "single-goal-meal-completion";
        modal.className = "fixed inset-0 z-[80] flex items-end justify-center bg-black/55 p-sm backdrop-blur-sm sm:items-center";
        modal.setAttribute("role", "dialog");
        modal.setAttribute("aria-modal", "true");
        modal.setAttribute("aria-labelledby", "single-goal-meal-title");
        modal.innerHTML = `<div class="max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-t-3xl bg-white p-lg shadow-2xl sm:rounded-3xl"><div class="flex items-start justify-between gap-md"><div><p class="text-[10px] font-extrabold text-secondary">料理已完成</p><h2 id="single-goal-meal-title" class="mt-1 text-xl font-extrabold text-slate-blue">${escapeHtml(pendingMeal.mealName)}</h2></div><button type="button" onclick="SingleGoalApp.closeMealCompletion()" aria-label="稍後再決定" class="cursor-pointer rounded-full p-2 text-on-surface-variant hover:bg-surface-container focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"><span class="material-symbols-outlined" aria-hidden="true">close</span></button></div><div class="mt-md grid grid-cols-2 gap-sm"><div class="rounded-2xl bg-surface-container-low p-md"><span class="text-[10px] text-outline">原本平均外食</span><strong class="mt-1 block text-lg text-slate-blue">${formatMoney(pendingMeal.eatingOutCost)}</strong></div><label class="rounded-2xl bg-surface-container-low p-md text-[10px] text-outline">本餐自煮成本<input id="sg-meal-cost" type="number" inputmode="numeric" min="0" value="${pendingMeal.homeCookCost}" oninput="SingleGoalApp.updateMealEstimate()" class="mt-1 w-full rounded-lg border border-outline-variant bg-white px-sm py-2 text-base font-bold text-slate-blue focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"></label></div><div class="mt-sm rounded-2xl bg-secondary/10 p-md"><span class="text-[10px] text-on-surface-variant">本餐估算節省</span><strong id="sg-meal-saving" class="mt-1 block text-2xl text-secondary">${formatMoney(pendingMeal.estimatedSaving)}</strong><p class="mt-1 text-[10px] text-outline">這是估算，不會自動加入主要目標。</p></div><label class="mt-md block text-xs font-bold text-on-surface-variant">這次實際計入目標多少<input id="sg-meal-deposit" type="number" inputmode="numeric" min="0" value="${pendingMeal.estimatedSaving}" oninput="SingleGoalApp.updateMealEstimate(false)" class="${fieldClass()}"></label><div class="mt-sm flex flex-wrap gap-xs"><button type="button" onclick="SingleGoalApp.setMealDeposit(0)" class="cursor-pointer rounded-full border border-outline-variant px-3 py-2 text-[11px] font-bold text-on-surface-variant hover:bg-surface-container focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15">0 元</button><button id="sg-suggested-deposit" type="button" onclick="SingleGoalApp.setMealDeposit(${pendingMeal.estimatedSaving})" class="cursor-pointer rounded-full border border-secondary/30 bg-secondary/5 px-3 py-2 text-[11px] font-bold text-secondary hover:bg-secondary/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary/20">建議 ${formatMoney(pendingMeal.estimatedSaving)}</button></div><p id="sg-meal-deposit-note" class="mt-sm text-[10px] leading-4 text-outline"></p><p id="sg-meal-error" role="alert" class="hidden mt-sm rounded-xl bg-error-container px-md py-sm text-xs font-bold text-on-error-container"></p><div class="mt-lg flex flex-col-reverse sm:flex-row gap-sm"><button type="button" onclick="SingleGoalApp.confirmMealDeposit(0)" class="cursor-pointer flex-1 rounded-full border border-primary/25 py-3 text-xs font-extrabold text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20">這次不計入</button><button type="button" onclick="SingleGoalApp.confirmMealDeposit()" class="cursor-pointer flex-1 rounded-full bg-primary py-3 text-xs font-extrabold text-white hover:bg-on-primary-container focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25">確認計入目標</button></div></div>`;
        const mealError = modal.querySelector("#sg-meal-error");
        mealError?.insertAdjacentHTML("beforebegin", `<fieldset class="mt-md rounded-2xl border border-secondary/20 bg-secondary/5 p-md"><legend class="px-xs text-xs font-extrabold text-slate-blue">這餐的健康自主紀錄</legend><label class="mt-xs flex cursor-pointer items-start gap-sm rounded-xl bg-white p-sm text-xs font-bold text-on-surface-variant"><input id="sg-food-safe" type="checkbox" class="mt-0.5 rounded border-outline-variant text-secondary focus:ring-secondary"><span>我已確認食材狀態適合食用<span class="block text-[10px] font-normal text-outline">這是健康資產的必要前提，不另外加分。</span></span></label><div class="mt-sm grid grid-cols-1 sm:grid-cols-3 gap-xs"><label class="flex cursor-pointer items-center gap-xs rounded-xl bg-white p-sm text-[11px] font-bold text-on-surface-variant"><input id="sg-health-vegetables" type="checkbox" class="rounded border-outline-variant text-secondary focus:ring-secondary">有吃到蔬菜</label><label class="flex cursor-pointer items-center gap-xs rounded-xl bg-white p-sm text-[11px] font-bold text-on-surface-variant"><input id="sg-health-low-oil" type="checkbox" class="rounded border-outline-variant text-secondary focus:ring-secondary">少油料理</label><label class="flex cursor-pointer items-center gap-xs rounded-xl bg-white p-sm text-[11px] font-bold text-on-surface-variant"><input id="sg-health-seasoning" type="checkbox" class="rounded border-outline-variant text-secondary focus:ring-secondary">控制調味</label></div><p class="mt-sm text-[10px] text-outline">至少一項健康行動且確認食安，才累積一餐健康自主餐；未勾選仍會累積自煮餐數。</p></fieldset>`);
        document.body.appendChild(modal);
        updateMealEstimate(false);
        document.getElementById("sg-meal-cost")?.focus();
    }

    function closeMealCompletion(clearPending = true) {
        document.getElementById("single-goal-meal-completion")?.remove();
        if (clearPending) pendingMeal = null;
    }

    function setMealDeposit(amount) {
        const input = document.getElementById("sg-meal-deposit");
        if (!input) return;
        input.value = String(Math.max(0, Math.round(Number(amount) || 0)));
        updateMealEstimate(false);
    }

    function updateMealEstimate(updateSuggestedDeposit = true) {
        if (!pendingMeal) return;
        const costInput = document.getElementById("sg-meal-cost");
        const depositInput = document.getElementById("sg-meal-deposit");
        const cost = Number(costInput?.value);
        if (Number.isFinite(cost) && cost >= 0) {
            pendingMeal.homeCookCost = Math.round(cost);
            pendingMeal.estimatedSaving = domain.calculateEstimatedSaving(pendingMeal.eatingOutCost, pendingMeal.homeCookCost);
            const savingElement = document.getElementById("sg-meal-saving");
            if (savingElement) savingElement.textContent = formatMoney(pendingMeal.estimatedSaving);
            const suggestedButton = document.getElementById("sg-suggested-deposit");
            if (suggestedButton) {
                suggestedButton.textContent = `建議 ${formatMoney(pendingMeal.estimatedSaving)}`;
                suggestedButton.setAttribute("onclick", `SingleGoalApp.setMealDeposit(${pendingMeal.estimatedSaving})`);
            }
            if (updateSuggestedDeposit && depositInput) depositInput.value = String(pendingMeal.estimatedSaving);
        }
        const deposit = Number(depositInput?.value);
        const note = document.getElementById("sg-meal-deposit-note");
        if (!note || !Number.isFinite(deposit) || deposit < 0) return;
        const extra = Math.max(0, Math.round(deposit) - pendingMeal.estimatedSaving);
        note.textContent = extra > 0
            ? `其中 ${formatMoney(pendingMeal.estimatedSaving)} 為自煮相關存入，另有 ${formatMoney(extra)} 會標示為額外存入。`
            : "只有確認後，這個金額才會增加主要目標進度。";
    }

    function showMealError(message) {
        const element = document.getElementById("sg-meal-error");
        if (!element) return;
        element.textContent = message;
        element.classList.remove("hidden");
    }

    function confirmMealDeposit(forcedAmount) {
        if (!pendingMeal) return;
        const cost = Number(document.getElementById("sg-meal-cost")?.value);
        const enteredDeposit = forcedAmount === 0 ? 0 : Number(document.getElementById("sg-meal-deposit")?.value);
        if (!Number.isFinite(cost) || cost < 0) return showMealError("本餐自煮成本不能小於 0 元。");
        if (!Number.isFinite(enteredDeposit) || enteredDeposit < 0) return showMealError("實際計入金額不能小於 0 元。");
        const result = domain.recordCookingOutcome(state.cookingOutcomes, {
            ...pendingMeal,
            goalId: state.activeGoal.id,
            homeCookCost: Math.round(cost),
            estimatedSaving: domain.calculateEstimatedSaving(pendingMeal.eatingOutCost, cost),
            actualDeposit: Math.round(enteredDeposit)
        }, {
            id: globalScope.crypto?.randomUUID?.() || `outcome_${Date.now()}`
        });
        if (!result.accepted) {
            if (result.reason === "duplicate") closeMealCompletion();
            return;
        }
        state.cookingOutcomes.push(result.outcome);
        state.amountEvents.push(...result.amountEvents);
        const progressResult = domain.recordMealProgress(state.habitProgress, state.healthAssets, {
            outcomeId: result.outcome.id,
            foodSafe: Boolean(document.getElementById("sg-food-safe")?.checked),
            vegetables: Boolean(document.getElementById("sg-health-vegetables")?.checked),
            lowOil: Boolean(document.getElementById("sg-health-low-oil")?.checked),
            mindfulSeasoning: Boolean(document.getElementById("sg-health-seasoning")?.checked)
        });
        if (progressResult.accepted) {
            state.habitProgress = progressResult.habitProgress;
            state.healthAssets = progressResult.healthAssets;
        }
        persistState();
        const deposited = result.outcome.actualDeposit;
        closeMealCompletion();
        if (activeContainer?.querySelector(".single-goal-shell")) renderActive();
        globalScope.showToast?.(deposited > 0 ? `已將 ${formatMoney(deposited)} 計入主要目標` : "這餐未計入存款，目標金額維持不變", "success");
    }

    function renderOnboarding() {
        const progress = Math.round(step / 6 * 100);
        activeContainer.innerHTML = `
            <div class="single-goal-shell max-w-[760px] mx-auto">
                <section class="bg-white rounded-3xl border border-primary/15 shadow-sm overflow-hidden">
                    <div class="p-md md:p-lg border-b border-outline-variant/30 bg-surface-container-low">
                        <div class="flex items-center justify-between gap-md">
                            <div>
                                <p class="text-[11px] font-extrabold text-secondary">設定主要目標</p>
                                <h2 class="mt-1 text-xl font-extrabold text-slate-blue">第 ${step} 步，共 6 步</h2>
                            </div>
                            <button type="button" onclick="SingleGoalApp.cancelOnboarding()" aria-label="取消設定" class="cursor-pointer rounded-full p-2 text-on-surface-variant transition-colors duration-200 hover:bg-white hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25">
                                <span class="material-symbols-outlined" aria-hidden="true">close</span>
                            </button>
                        </div>
                        <div class="mt-md h-2 overflow-hidden rounded-full bg-surface-container-high" role="progressbar" aria-label="設定進度" aria-valuemin="1" aria-valuemax="6" aria-valuenow="${step}">
                            <div class="h-full rounded-full bg-primary transition-[width] duration-200 motion-reduce:transition-none" style="width:${progress}%"></div>
                        </div>
                    </div>
                    <div class="p-md md:p-lg">
                        ${renderStep()}
                        <p id="single-goal-error" role="alert" class="${errorMessage ? "mt-md" : "hidden"} rounded-xl bg-error-container px-md py-sm text-xs font-bold text-on-error-container">${escapeHtml(errorMessage)}</p>
                        <div class="mt-lg flex flex-col-reverse sm:flex-row sm:justify-between gap-sm">
                            ${step > 1 ? `<button type="button" onclick="SingleGoalApp.previous()" class="cursor-pointer rounded-full border border-primary/30 px-lg py-3 text-xs font-extrabold text-primary transition-colors duration-200 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20">上一步</button>` : `<span></span>`}
                            <button type="button" onclick="SingleGoalApp.${step === 6 ? "confirm" : "next"}()" class="cursor-pointer rounded-full bg-primary px-lg py-3 text-sm font-extrabold text-white shadow-sm transition-colors duration-200 hover:bg-on-primary-container focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25">
                                ${step === 6 ? "確認建立目標" : "下一步"}
                            </button>
                        </div>
                    </div>
                </section>
            </div>`;
    }

    function fieldClass() {
        return "mt-1 w-full rounded-xl border border-outline-variant bg-white px-md py-3 text-base text-on-surface focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15";
    }

    function renderStep() {
        if (step === 1) return renderGoalStep();
        if (step === 2) return renderSpendingStep();
        if (step === 3) return renderCookingPlanStep();
        if (step === 4) return renderProjectionStep();
        if (step === 5) return renderMilestoneStep();
        return renderConfirmationStep();
    }

    function renderGoalStep() {
        return `
            <div>
                <p class="text-xs font-extrabold text-secondary">你想為什麼存錢？</p>
                <h3 class="mt-1 text-xl font-extrabold text-slate-blue">先決定這棵樹要長向哪裡</h3>
                <div class="mt-md grid grid-cols-2 gap-sm">
                    ${Object.entries(PURPOSES).map(([key, purpose]) => `
                        <label class="cursor-pointer rounded-2xl border-2 p-md transition-colors duration-200 ${draft.purpose === key ? "border-primary bg-primary/5" : "border-outline-variant/40 bg-white hover:border-primary/40"}">
                            <input class="sr-only" type="radio" name="goal-purpose" value="${key}" ${draft.purpose === key ? "checked" : ""} onchange="SingleGoalApp.selectPurpose('${key}')">
                            <span class="material-symbols-outlined text-primary" aria-hidden="true">${purpose.icon}</span>
                            <strong class="mt-1 block text-sm text-slate-blue">${purpose.label}</strong>
                        </label>`).join("")}
                </div>
                <div class="mt-md grid grid-cols-1 sm:grid-cols-2 gap-md">
                    <label class="text-xs font-bold text-on-surface-variant">目標名稱<input id="sg-name" class="${fieldClass()}" value="${escapeHtml(draft.name)}" placeholder="例如：日本旅行"></label>
                    <label class="text-xs font-bold text-on-surface-variant">目標金額<input id="sg-target" class="${fieldClass()}" type="number" inputmode="numeric" min="1" value="${draft.targetAmount}"></label>
                    <label class="text-xs font-bold text-on-surface-variant">此目標目前已存<input id="sg-current" class="${fieldClass()}" type="number" inputmode="numeric" min="0" value="${draft.currentSavedAmount}"><span class="mt-1 block text-[10px] font-normal text-outline">只填為這個目標保留的金額，不是帳戶總餘額。</span></label>
                    <label class="text-xs font-bold text-on-surface-variant">希望完成日期（選填）<input id="sg-date" class="${fieldClass()}" type="date" value="${escapeHtml(draft.targetDate)}"></label>
                </div>
            </div>`;
    }

    function renderSpendingStep() {
        return `
            <div>
                <p class="text-xs font-extrabold text-secondary">最近一週的真實狀況</p>
                <h3 class="mt-1 text-xl font-extrabold text-slate-blue">先算出一餐外食通常花多少</h3>
                <p class="mt-xs text-sm text-on-surface-variant">只需要餐數與總額，不必回想每一筆消費。</p>
                <div class="mt-md grid grid-cols-1 sm:grid-cols-2 gap-md">
                    <label class="text-xs font-bold text-on-surface-variant">最近一週外食餐數<input id="sg-eating-meals" class="${fieldClass()}" type="number" inputmode="numeric" min="0" value="${draft.eatingOutMeals}"></label>
                    <label class="text-xs font-bold text-on-surface-variant">最近一週外食總金額<input id="sg-eating-total" class="${fieldClass()}" type="number" inputmode="numeric" min="0" value="${draft.eatingOutTotal}"></label>
                    <label class="text-xs font-bold text-on-surface-variant sm:col-span-2">若上週沒有外食，一餐通常會花多少<input id="sg-direct-cost" class="${fieldClass()}" type="number" inputmode="numeric" min="0" value="${draft.directEatingOutCost}"><span class="mt-1 block text-[10px] font-normal text-outline">只有外食餐數為 0 時才使用這個數字。</span></label>
                </div>
            </div>`;
    }

    function renderCookingPlanStep() {
        const average = domain.calculateAverageEatingOutCost(draft.eatingOutTotal, draft.eatingOutMeals) ?? draft.directEatingOutCost;
        const suggestion = domain.suggestHomeCookBudget(average);
        return `
            <div>
                <p class="text-xs font-extrabold text-secondary">系統建議，可自行調整</p>
                <h3 class="mt-1 text-xl font-extrabold text-slate-blue">設定做得到的自煮預算</h3>
                <div class="mt-md rounded-2xl bg-secondary/10 p-md">
                    <span class="text-xs text-on-surface-variant">平均外食一餐</span>
                    <strong class="ml-2 text-lg text-secondary">${formatMoney(average)}</strong>
                    <p class="mt-1 text-[11px] text-on-surface-variant">60% 起始建議為 ${formatMoney(suggestion)}，你可以依生活情況修改。</p>
                </div>
                <div class="mt-md grid grid-cols-1 sm:grid-cols-2 gap-md">
                    <label class="text-xs font-bold text-on-surface-variant">每餐自煮預算<input id="sg-home-budget" class="${fieldClass()}" type="number" inputmode="numeric" min="0" value="${draft.homeCookBudget}"></label>
                    <label class="text-xs font-bold text-on-surface-variant">每週預計自煮幾餐<input id="sg-weekly-meals" class="${fieldClass()}" type="number" inputmode="numeric" min="0" max="21" value="${draft.weeklyCookingMeals}"></label>
                </div>
            </div>`;
    }

    function getDraftProjection() {
        const eatingOutCost = domain.calculateAverageEatingOutCost(draft.eatingOutTotal, draft.eatingOutMeals) ?? Number(draft.directEatingOutCost);
        const saving = domain.calculateEstimatedSaving(eatingOutCost, draft.homeCookBudget);
        return {
            eatingOutCost,
            saving,
            projection: domain.calculateGoalProjection({
                targetAmount: draft.targetAmount,
                currentSavedAmount: draft.currentSavedAmount,
                estimatedSavingPerMeal: saving,
                weeklyCookingMeals: draft.weeklyCookingMeals,
                targetDate: draft.targetDate
            })
        };
    }

    function projectionMessage(projection) {
        if (projection.status === "completed") return "目前已存金額已達到目標，建立後會直接標示完成。";
        if (projection.status === "no_saving") return "依目前預算，自煮尚未產生可估算的存錢進度；仍可累積自煮與健康成果。";
        if (projection.status === "no_frequency") return "目前尚未設定每週自煮頻率，因此無法推算達標時間。";
        if (projection.status !== "ready") return "目前資料不足，請返回檢查目標金額。";
        return `依目前計畫，約還需 ${projection.mealsNeeded} 餐、${Math.ceil(projection.estimatedWeeks)} 週，預估 ${projection.estimatedDate} 左右完成。`;
    }

    function renderProjectionStep() {
        const { eatingOutCost, saving, projection } = getDraftProjection();
        const targetDateNote = draft.targetDate && projection.requiredWeeklyMeals !== null
            ? `若要在 ${draft.targetDate} 前達成，每週約需自煮 ${projection.requiredWeeklyMeals} 餐。`
            : draft.targetDate && projection.scheduleStatus === "overdue"
                ? "目標日期已過，請返回調整日期或計畫。"
                : "";
        return `
            <div>
                <p class="text-xs font-extrabold text-secondary">計畫預覽</p>
                <h3 class="mt-1 text-xl font-extrabold text-slate-blue">從現在到目標，路徑有多長？</h3>
                <div class="mt-md grid grid-cols-2 gap-sm">
                    <div class="rounded-2xl bg-surface-container-low p-md"><span class="text-[11px] text-on-surface-variant">距離目標</span><strong class="mt-1 block text-lg text-primary">${formatMoney(projection.remainingAmount)}</strong></div>
                    <div class="rounded-2xl bg-surface-container-low p-md"><span class="text-[11px] text-on-surface-variant">每餐估算節省</span><strong class="mt-1 block text-lg text-secondary">${formatMoney(saving)}</strong></div>
                    <div class="rounded-2xl bg-surface-container-low p-md"><span class="text-[11px] text-on-surface-variant">平均外食</span><strong class="mt-1 block text-lg text-slate-blue">${formatMoney(eatingOutCost)}</strong></div>
                    <div class="rounded-2xl bg-surface-container-low p-md"><span class="text-[11px] text-on-surface-variant">每週自煮</span><strong class="mt-1 block text-lg text-slate-blue">${draft.weeklyCookingMeals} 餐</strong></div>
                </div>
                <div class="mt-md rounded-2xl border border-secondary/30 bg-secondary/5 p-md">
                    <p class="text-sm font-bold text-slate-blue">${escapeHtml(projectionMessage(projection))}</p>
                    ${targetDateNote ? `<p class="mt-1 text-xs text-on-surface-variant">${escapeHtml(targetDateNote)}</p>` : ""}
                    <p class="mt-2 text-[10px] text-outline">日期會隨目前已存金額、自煮預算與頻率重新計算，不代表保證達成。</p>
                </div>
            </div>`;
    }

    function renderMilestoneStep() {
        if (draft && draft.name) {
            draft.longLabel = draft.name.startsWith("完成") ? draft.name : `完成${draft.name}`;
        }
        draft.shortPercent = 25;
        draft.mediumPercent = 60;
        draft.shortLabel = draft.shortLabel || "先完成第一筆累積";
        draft.mediumLabel = draft.mediumLabel || "穩定存到一半以上";

        const shortAmount = Math.round((draft.targetAmount || 0) * 0.25);
        const mediumAmount = Math.round((draft.targetAmount || 0) * 0.60);

        return `
            <div class="select-none cursor-default">
                <div class="flex items-center justify-between gap-sm">
                    <div>
                        <p class="text-xs font-extrabold text-secondary">同一個終極夢想的三個階段</p>
                        <h3 class="mt-1 text-xl font-extrabold text-slate-blue">系統預設分段與累積門檻</h3>
                    </div>
                    <span class="inline-flex items-center gap-xs rounded-full bg-surface-container-high px-3 py-1 text-[10px] font-bold text-on-surface-variant shrink-0">
                        <span class="material-symbols-outlined text-sm text-outline" aria-hidden="true">info</span>純示意的階段預覽
                    </span>
                </div>

                <div class="mt-md relative pl-6 space-y-md before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-outline-variant/40">
                    <!-- 短期 25% -->
                    <div class="relative flex items-start justify-between gap-md rounded-2xl bg-surface-container-low/70 p-md border border-outline-variant/20">
                        <span class="absolute -left-6 top-3 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full bg-secondary/15 border-2 border-white text-[10px] font-black text-secondary">1</span>
                        <div>
                            <div class="flex items-center gap-xs">
                                <span class="rounded-md bg-secondary/10 px-2 py-0.5 text-[10px] font-extrabold text-secondary">短期 25%</span>
                            </div>
                            <strong class="mt-1 block text-sm text-slate-blue">${escapeHtml(draft.shortLabel)}</strong>
                        </div>
                        <span class="text-xs font-extrabold text-slate-blue shrink-0">${formatMoney(shortAmount)}</span>
                    </div>

                    <!-- 中期 60% -->
                    <div class="relative flex items-start justify-between gap-md rounded-2xl bg-surface-container-low/70 p-md border border-outline-variant/20">
                        <span class="absolute -left-6 top-3 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full bg-secondary/15 border-2 border-white text-[10px] font-black text-secondary">2</span>
                        <div>
                            <div class="flex items-center gap-xs">
                                <span class="rounded-md bg-secondary/10 px-2 py-0.5 text-[10px] font-extrabold text-secondary">中期 60%</span>
                            </div>
                            <strong class="mt-1 block text-sm text-slate-blue">${escapeHtml(draft.mediumLabel)}</strong>
                        </div>
                        <span class="text-xs font-extrabold text-slate-blue shrink-0">${formatMoney(mediumAmount)}</span>
                    </div>

                    <!-- 長期 100% -->
                    <div class="relative flex items-start justify-between gap-md rounded-2xl bg-primary/5 p-md border-l-4 border-primary border-t border-r border-b border-primary/20">
                        <span class="absolute -left-6 top-3 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-white text-[11px] font-black shadow-xs">
                            <span class="material-symbols-outlined text-xs" aria-hidden="true">flag</span>
                        </span>
                        <div>
                            <div class="flex items-center gap-xs">
                                <span class="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-extrabold text-primary">長期 100% · 終極目標</span>
                            </div>
                            <strong class="mt-1 block text-base font-extrabold text-slate-blue">${escapeHtml(draft.longLabel)}</strong>
                        </div>
                        <span class="text-sm font-black text-primary shrink-0">${formatMoney(draft.targetAmount)}</span>
                    </div>
                </div>

                <p class="mt-md text-[11px] text-outline text-center">此頁面為系統內建試算階段，無須調整；三個數字為階段累積門檻，不會相加。</p>
            </div>`;
    }

    function renderConfirmationStep() {
        const { eatingOutCost, saving, projection } = getDraftProjection();
        const milestones = domain.createMilestones(draft.targetAmount, draft).milestones;
        return `
            <div>
                <p class="text-xs font-extrabold text-secondary">最後確認</p>
                <h3 class="mt-1 text-xl font-extrabold text-slate-blue">這就是你的單一主要目標</h3>
                <div class="mt-md rounded-3xl bg-slate-blue p-lg text-white">
                    <span class="text-[11px] font-bold text-white/75">${escapeHtml(PURPOSES[draft.purpose]?.label || PURPOSES.custom.label)}</span>
                    <strong class="mt-1 block text-2xl">${escapeHtml(draft.name)}</strong>
                    <div class="mt-md grid grid-cols-2 gap-sm text-sm"><span>目標 ${formatMoney(draft.targetAmount)}</span><span>已存 ${formatMoney(draft.currentSavedAmount)}</span><span>每餐約省 ${formatMoney(saving)}</span><span>每週 ${draft.weeklyCookingMeals} 餐</span></div>
                </div>
                <div class="mt-md space-y-xs">
                    ${milestones.map((item) => `<div class="flex items-center justify-between rounded-xl bg-surface-container-low px-md py-sm"><span class="text-xs font-bold text-slate-blue">${escapeHtml(item.label)} · ${item.percent}%</span><span class="text-xs text-on-surface-variant">${formatMoney(item.targetAmount)}</span></div>`).join("")}
                </div>
                <div class="mt-md rounded-2xl border border-primary/20 p-md"><p class="text-sm font-bold text-slate-blue">${escapeHtml(projectionMessage(projection))}</p><p class="mt-1 text-[10px] text-outline">平均外食 ${formatMoney(eatingOutCost)}；所有節省與日期均為估算。確認後才建立目標。</p></div>
            </div>`;
    }

    function collectStep() {
        errorMessage = "";
        if (step === 1) {
            draft.name = document.getElementById("sg-name")?.value.trim() || "";
            draft.targetAmount = Number(document.getElementById("sg-target")?.value);
            draft.currentSavedAmount = Number(document.getElementById("sg-current")?.value);
            draft.targetDate = document.getElementById("sg-date")?.value || "";
            if (!draft.name) errorMessage = "請輸入目標名稱。";
            else if (!Number.isFinite(draft.targetAmount) || draft.targetAmount <= 0) errorMessage = "目標金額必須大於 0 元。";
            else if (!Number.isFinite(draft.currentSavedAmount) || draft.currentSavedAmount < 0) errorMessage = "目前已存金額不能小於 0 元。";
            if (!errorMessage) {
                draft.longLabel = draft.name.startsWith("完成") ? draft.name : `完成${draft.name}`;
            }
        } else if (step === 2) {
            draft.eatingOutMeals = Number(document.getElementById("sg-eating-meals")?.value);
            draft.eatingOutTotal = Number(document.getElementById("sg-eating-total")?.value);
            draft.directEatingOutCost = Number(document.getElementById("sg-direct-cost")?.value);
            if (![draft.eatingOutMeals, draft.eatingOutTotal, draft.directEatingOutCost].every((value) => Number.isFinite(value) && value >= 0)) errorMessage = "餐數與金額不能小於 0。";
            else if (draft.eatingOutMeals === 0 && draft.directEatingOutCost <= 0) errorMessage = "上週沒有外食時，請填寫一餐通常會花多少。";
            else if (draft.eatingOutMeals > 0 && draft.eatingOutTotal <= 0) errorMessage = "有外食餐數時，請填寫最近一週外食總金額。";
            if (!errorMessage) {
                const average = domain.calculateAverageEatingOutCost(draft.eatingOutTotal, draft.eatingOutMeals) ?? draft.directEatingOutCost;
                draft.homeCookBudget = domain.suggestHomeCookBudget(average);
            }
        } else if (step === 3) {
            draft.homeCookBudget = Number(document.getElementById("sg-home-budget")?.value);
            draft.weeklyCookingMeals = Number(document.getElementById("sg-weekly-meals")?.value);
            if (!Number.isFinite(draft.homeCookBudget) || draft.homeCookBudget < 0) errorMessage = "每餐自煮預算不能小於 0。";
            else if (!Number.isInteger(draft.weeklyCookingMeals) || draft.weeklyCookingMeals < 0 || draft.weeklyCookingMeals > 21) errorMessage = "每週自煮餐數請填 0 到 21 的整數。";
        } else if (step === 5) {
            draft.shortPercent = 25;
            draft.mediumPercent = 60;
            draft.shortLabel = draft.shortLabel || "先完成第一筆累積";
            draft.mediumLabel = draft.mediumLabel || "穩定存到一半以上";
            if (draft.name) {
                draft.longLabel = draft.name.startsWith("完成") ? draft.name : `完成${draft.name}`;
            }
        }
        return !errorMessage;
    }

    function next() {
        if (!collectStep()) {
            renderActive();
            return;
        }
        step = Math.min(6, step + 1);
        renderActive();
    }

    function previous() {
        step = Math.max(1, step - 1);
        errorMessage = "";
        renderActive();
    }

    function selectPurpose(purpose) {
        if (!PURPOSES[purpose]) return;
        draft.purpose = purpose;
        if (!draft.name || Object.values(PURPOSES).some((item) => item.example === draft.name)) {
            draft.name = PURPOSES[purpose].example;
        }
        draft.longLabel = `完成${draft.name}`;
        renderActive();
    }

    function confirm() {
        const result = domain.createGoalFromDraft(draft, {
            id: globalScope.crypto?.randomUUID?.() || `goal_${Date.now()}`
        });
        if (!result.valid) {
            errorMessage = result.errors.join(" ");
            renderActive();
            return;
        }
        state.activeGoal = result.goal;
        state.cookingPlan = result.cookingPlan;
        state.amountEvents.push(result.openingEvent);
        persistState();
        draft = null;
        step = 0;
        errorMessage = "";
        renderActive();
    }

    globalScope.SingleGoalApp = {
        render,
        startOnboarding,
        cancelOnboarding,
        next,
        previous,
        selectPurpose,
        confirm,
        openSettings,
        closeSettings,
        saveSettings,
        promptMealCompletion,
        closeMealCompletion,
        setMealDeposit,
        updateMealEstimate,
        confirmMealDeposit,
        openCompletionPrompt,
        dismissCompletionPrompt,
        startNextGoal,
        exportLegacyDreams,
        reset,
        getState: () => state
    };
})(window);
