import { useContext, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Recipe, RecipeGeneration, RecipePackage } from "@coocoo/contracts";
import { api, json, ApiError } from "@/shared/api/client";
import { Modal, ModalHeader } from "@/shared/ui/Modal";
import { UiContext } from "@/app/ui-context";
import { useAppState, stateQueryKey } from "@/entities/app-state/model";
import { enqueueOperation, markRecipePackageCompleted, saveRecipePackage } from "@/shared/offline/recipe-packages";

export function RecipeModal({ ingredientIds, style, onClose, onComplete }: { ingredientIds: string[]; style: string; onClose: () => void; onComplete?: () => void }) {
  const [generation, setGeneration] = useState<RecipeGeneration | null>(null);
  const [cookingPackage, setCookingPackage] = useState<RecipePackage | null>(null);
  const [offlineError, setOfflineError] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { api<RecipeGeneration>("/recipes/generate", json("POST", { operationId:crypto.randomUUID(),ingredientIds, style })).then(setGeneration).catch((reason: Error) => setError(reason.message)); }, [ingredientIds, style]);
  if (cookingPackage) return <CookingMode recipePackage={cookingPackage} ingredientIds={ingredientIds} onClose={onClose} onComplete={onComplete} />;
  if (error) return <Modal label="食譜產生失敗" onClose={onClose}><ModalHeader title="食譜產生失敗" onClose={onClose} /><p className="rounded-xl bg-error-container p-md text-xs text-on-error-container">{error}</p></Modal>;
  if (!generation) return <Modal label="食譜準備中" onClose={onClose}><div className="py-xl text-center"><span className="material-symbols-outlined animate-pulse text-5xl text-secondary">auto_awesome</span><h3 className="mt-md font-extrabold text-slate-blue">正在依設定整理料理</h3></div></Modal>;
  const recipe=generation.recipe;
  const start = async () => {
    setOfflineError("");
    try {
      const saved = await saveRecipePackage(recipe);
      setCookingPackage(saved);
    } catch {
      setOfflineError("核心食譜未能存到這台裝置，尚未進入離線料理。請確認瀏覽器儲存空間後重試。");
    }
  };
  return <Modal label={recipe.title} onClose={onClose} wide><ModalHeader title={recipe.title} kicker={`${recipe.totalMinutes} 分鐘 · ${recipe.servings} 人份 · NT$ ${recipe.estimatedCost}`} onClose={onClose} />{generation.notice&&<p className="rounded-xl bg-secondary/10 p-md text-xs text-on-surface-variant">{generation.notice}</p>}<div className="meal-tags">{recipe.cookwareTypes.map(item=><span key={item}>{item}</span>)}</div><ol className="mt-md space-y-sm">{recipe.steps.map(step => <li key={step.id} className="flex gap-sm rounded-2xl bg-surface-container-low p-md"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-extrabold text-white">{step.order}</span><p className="text-sm leading-6 text-slate-blue">{step.instruction}{step.safetyNote&&<small className="mt-1 block text-error">注意：{step.safetyNote}</small>}</p></li>)}</ol>{offlineError && <p role="alert" className="offline-error">{offlineError}</p>}<div className="mt-lg flex flex-col gap-sm sm:flex-row"><button onClick={async () => setGeneration(await api<RecipeGeneration>("/recipes/generate", json("POST", { operationId:crypto.randomUUID(),ingredientIds, style, excludeTitle: recipe.title })))} className="secondary-btn flex-1">換一道</button><button onClick={start} className="primary-btn flex-1">下載並開始料理</button></div></Modal>;
}

export function RecipePackageModal({ recipePackage, ingredientIds, onClose, onComplete }: { recipePackage: RecipePackage; ingredientIds: string[]; onClose: () => void; onComplete?: () => void }) {
  const [savedPackage,setSavedPackage]=useState<RecipePackage|null>(null);const [error,setError]=useState("");
  if(savedPackage)return <CookingMode recipePackage={savedPackage} ingredientIds={ingredientIds} onClose={onClose} onComplete={onComplete}/>;
  const start=async()=>{setError("");try{setSavedPackage(await saveRecipePackage(recipePackage.catalogVersionId?await api<RecipePackage>(`/recipes/${recipePackage.catalogVersionId}/start`,json("POST",{})):recipePackage))}catch{setError("核心食譜未能存到這台裝置，尚未進入離線料理。");}};
  return <Modal label={recipePackage.title} onClose={onClose} wide><ModalHeader title={recipePackage.title} kicker={`${recipePackage.totalMinutes} 分鐘 · ${recipePackage.servings} 人份 · NT$ ${recipePackage.estimatedCost}`} onClose={onClose}/><div className="meal-tags"><span>{recipePackage.totalMinutes<=15?"快手餐":"低體力可選"}</span>{recipePackage.cookwareTypes.map(item=><span key={item}>{item}</span>)}</div><ol className="mt-md space-y-sm">{recipePackage.steps.map(step=><li key={step.id} className="rounded-2xl bg-surface-container-low p-md text-sm text-slate-blue">{step.order}. {step.instruction}</li>)}</ol>{error&&<p className="offline-error">{error}</p>}<button onClick={start} className="primary-btn mt-lg w-full">下載並開始料理</button></Modal>;
}

function getHeatInfo(instruction: string) {
  if (instruction.includes("大火") || instruction.includes("滾") || instruction.includes("沸")) {
    return { label: "大火滾水", style: "heat-high" };
  }
  if (instruction.includes("中火") || instruction.includes("炒") || instruction.includes("煎")) {
    return { label: "中小火烹調", style: "heat-med" };
  }
  if (instruction.includes("小火") || instruction.includes("慢煮") || instruction.includes("微火") || instruction.includes("悶") || instruction.includes("燜")) {
    return { label: "微火慢煮", style: "heat-low" };
  }
  if (instruction.includes("關火")) {
    return { label: "完全關火", style: "heat-off" };
  }
  return { label: "料理火候", style: "heat-med" };
}

function getChefTip(instruction: string, safetyNote: string | null) {
  if (instruction.includes("烏龍麵")) {
    return "冷凍烏龍麵直接下滾水煮，先不要急著用筷子用力攪散，讓水自然滲透，麵條最 Q 彈且不易斷裂！";
  }
  if (instruction.includes("味噌")) {
    return "味噌絕對不能持續大滾！滾煮會破壞酵母活菌並反酸，務必關火後再利用湯勺與餘溫慢慢化開。";
  }
  if (instruction.includes("蛋") || instruction.includes("雞蛋")) {
    return "炒蛋滑嫩秘訣：熱鍋溫油下蛋液，底層微凝固立刻轉中小火向內推動，離火利用餘溫熟成最嫩。";
  }
  if (instruction.includes("番茄")) {
    return "番茄紅素是脂溶性營養素，熱油翻炒至出汁起紅油，不僅湯底濃郁香甜，也更能釋放營養。";
  }
  if (instruction.includes("肉") || instruction.includes("雞胸")) {
    return "肉類入鍋後先別急著翻炒，讓底層受熱幾秒形成梅納反應鎖住肉汁，口感最鮮嫩不柴。";
  }
  if (safetyNote) {
    return "留意烹煮細節與火候控制，讓食材維持最爽脆鮮甜的口感！";
  }
  return "掌握火候與下鍋順序，能最大程度保留食材鮮甜與爽脆口感！";
}

function playTimerChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // AudioContext might be unavailable
  }
}

function CookingMode({ recipePackage, ingredientIds, onClose, onComplete }: { recipePackage: RecipePackage; ingredientIds: string[]; onClose: () => void; onComplete?: () => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = recipePackage.steps[stepIndex];
  const [secondsLeft, setSecondsLeft] = useState<number | null>(step?.timerSeconds ?? null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerFinished, setTimerFinished] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const wakeLock = useRef<{ release: () => Promise<void> } | null>(null);

  useEffect(() => {
    const nextStep = recipePackage.steps[stepIndex];
    setSecondsLeft(nextStep?.timerSeconds ?? null);
    setTimerRunning(false);
    setTimerFinished(false);
  }, [stepIndex, recipePackage.steps]);

  useEffect(() => {
    const acquire = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLock.current = await (navigator as Navigator & { wakeLock: { request: (type: "screen") => Promise<{ release: () => Promise<void> }> } }).wakeLock.request("screen");
        }
      } catch {
        // wakeLock may not be allowed
      }
    };
    void acquire();
    const resume = () => { if (document.visibilityState === "visible") void acquire(); };
    document.addEventListener("visibilitychange", resume);
    return () => {
      document.removeEventListener("visibilitychange", resume);
      void wakeLock.current?.release();
    };
  }, []);

  useEffect(() => {
    if (!timerRunning || secondsLeft === null || secondsLeft <= 0) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          setTimerRunning(false);
          setTimerFinished(true);
          playTimerChime();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [timerRunning, secondsLeft]);

  const toggleTimer = () => {
    if (secondsLeft === 0) {
      setSecondsLeft(step.timerSeconds ?? 60);
      setTimerFinished(false);
      setTimerRunning(true);
    } else {
      setTimerRunning((prev) => !prev);
    }
  };

  const resetTimer = () => {
    setTimerRunning(false);
    setTimerFinished(false);
    setSecondsLeft(step.timerSeconds ?? null);
  };

  const next = () => setStepIndex((value) => Math.min(recipePackage.steps.length - 1, value + 1));
  const previous = () => setStepIndex((value) => Math.max(0, value - 1));

  const heatInfo = getHeatInfo(step.instruction);
  const chefTip = getChefTip(step.instruction, step.safetyNote);

  const stepIngredients = recipePackage.ingredients.filter((ing) => {
    const normInstr = step.instruction.toLowerCase();
    const normName = ing.name.toLowerCase();
    const normKey = ing.ingredientKey.toLowerCase();
    if (normInstr.includes(normName) || normInstr.includes(normKey)) return true;
    const cleanName = normName.replace(/當季|生鮮|有機|新鮮/g, "");
    return cleanName.length >= 2 && normInstr.includes(cleanName);
  });

  if (finishing) return <CookingCompleteModal recipePackage={recipePackage} ingredientIds={ingredientIds} onClose={onClose} onComplete={onComplete} />;

  return (
    <div className="cooking-mode" role="dialog" aria-modal="true" aria-label={`${recipePackage.title}料理模式`}>
      <header>
        <button onClick={onClose} className="header-icon-btn" aria-label="離開料理模式" title="離開料理模式">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <div className="header-title-wrap">
          <small className="header-recipe-title">{recipePackage.title}</small>
          <span className="header-step-counter">步驟 {stepIndex + 1} / {recipePackage.steps.length}</span>
        </div>
        <div className="header-spacer" aria-hidden="true" />
      </header>

      <div className="cooking-progress-segments" aria-hidden="true">
        {recipePackage.steps.map((_, idx) => (
          <span key={idx} className={`segment ${idx <= stepIndex ? "active" : ""}`} />
        ))}
      </div>

      <main>
        <div className="step-header-row">
          <span className="step-order-tag">STEP {String(step.order).padStart(2, "0")}</span>
          <span className={`heat-badge ${heatInfo.style}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
            </svg>
            <span>{heatInfo.label}</span>
          </span>
        </div>

        <div className="step-main-card">
          <h2 className="step-instruction-text">{step.instruction}</h2>
          {stepIngredients.length > 0 && (
            <div className="step-ingredients-section">
              <span className="step-ingredients-label">本步驟投入食材</span>
              <div className="step-ingredients-pills">
                {stepIngredients.map((ing) => (
                  <span key={ing.ingredientKey} className="step-ingredient-pill">
                    {ing.name} {ing.quantity} {ing.unit}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {secondsLeft !== null && (
          <div className="step-timer-card">
            <div className="timer-info-group">
              <div className="timer-icon-circle">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div className="timer-text-group">
                <small>{timerFinished ? "計時完畢！" : (timerRunning ? "倒數計時中" : "烹煮計時器")}</small>
                <div className="timer-digits">
                  {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
                </div>
              </div>
            </div>
            <div className="timer-actions">
              <button onClick={toggleTimer} className="timer-toggle-btn">
                {secondsLeft === 0 ? "重計" : (timerRunning ? "暫停" : "開始計時")}
              </button>
              <button onClick={resetTimer} className="timer-reset-btn" title="重設計時" aria-label="重設計時">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                  <path d="M3 3v5h5"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="step-tip-card">
          <div className="step-tip-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 18h6"/>
              <path d="M10 22h4"/>
              <path d="M12 2v1"/>
              <path d="M12 7a5 5 0 0 0-5 5c0 1.9 1 3.2 2 4h6c1-.8 2-2.1 2-4a5 5 0 0 0-5-5z"/>
            </svg>
          </div>
          <div className="step-tip-content">
            <strong>主廚私房撇步 · 料理科學</strong>
            <p>{chefTip}</p>
          </div>
        </div>

        {step.safetyNote && (
          <div className="step-safety-card">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>注意：{step.safetyNote}</span>
          </div>
        )}
      </main>

      <footer>
        <button onClick={previous} disabled={stepIndex === 0} className="elbow-btn-secondary" aria-label="回上一步">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          <span>上一步</span>
        </button>
        {stepIndex < recipePackage.steps.length - 1 ? (
          <button className="elbow-btn-primary" onClick={next} aria-label="前進下一步">
            <span>下一步</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        ) : (
          <button className="elbow-btn-primary is-finish" onClick={() => setFinishing(true)} aria-label="完成料理並結算">
            <span>完成料理</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </button>
        )}
      </footer>
      <p className="elbow-hint">
        手沾滿水或油？可用手腕、手背或手肘輕壓大按鈕前進
      </p>
    </div>
  );
}

function CookingCompleteModal({ recipePackage, ingredientIds, onClose, onComplete }: { recipePackage: RecipePackage; ingredientIds: string[]; onClose: () => void; onComplete?: () => void }) {
  const { data } = useAppState();
  const query = useQueryClient();
  const ui = useContext(UiContext);
  const outsideCost = data?.cookingPlan?.eatingOutCost || 0;

  // Raw string states to support backspacing to empty without sticky 0
  const [costInput, setCostInput] = useState(String(data?.cookingPlan?.homeCookBudget ?? 80));
  const [servingsInput, setServingsInput] = useState(String(recipePackage.servings || 1));
  const [eatenInput, setEatenInput] = useState("1");
  const [vegetables, setVegetables] = useState(recipePackage.ingredients.some((item) => item.isVegetable));
  const [submitting, setSubmitting] = useState(false);

  // Derived numeric values
  const servings = Math.max(1, parseInt(servingsInput, 10) || 1);
  const eaten = Math.min(servings, Math.max(0, parseInt(eatenInput, 10) || 0));
  const cost = costInput === "" ? 0 : Math.max(0, parseInt(costInput, 10) || 0);
  const calculatedSaving = Math.max(0, outsideCost * eaten - cost);

  const [depositInput, setDepositInput] = useState(String(calculatedSaving));
  const deposit = depositInput === "" ? 0 : Math.min(calculatedSaving, Math.max(0, parseInt(depositInput, 10) || 0));

  useEffect(() => {
    setDepositInput((prev) => {
      const current = parseInt(prev, 10);
      if (isNaN(current) || current > calculatedSaving) {
        return String(calculatedSaving);
      }
      return prev;
    });
  }, [calculatedSaving]);

  const finish = async () => {
    if (submitting) return;
    setSubmitting(true);
    const operationId = crypto.randomUUID();
    const legacyRecipe: Recipe = {
      catalogVersionId: recipePackage.catalogVersionId,
      source: recipePackage.source ?? (recipePackage.catalogVersionId ? "catalog" : "brand_safe"),
      id: recipePackage.recipeId,
      title: recipePackage.title,
      style: "料理包",
      prepTime: `${recipePackage.totalMinutes} 分鐘`,
      estCost: `NT$ ${cost}`,
      scientificPrinciple: "已下載的離線料理包",
      ingredients: recipePackage.ingredients.map((item) => item.name),
      steps: recipePackage.steps.map((item) => item.instruction),
    };
    const payload = {
      completionKey: operationId,
      recipe: legacyRecipe,
      ingredientIds,
      ingredientRequirements: recipePackage.ingredients.map((i) => ({
        ...i,
        quantity: i.quantity / (recipePackage.servings || 1),
      })),
      homeCookCost: cost,
      actualDeposit: deposit,
      foodSafe: true,
      vegetables,
      lowOil: false,
      mindfulSeasoning: false,
      servingsCooked: servings,
      servingsEaten: eaten,
    };

    if (!navigator.onLine) {
      try {
        await enqueueOperation({
          userId: data?.session.user?.id,
          id: operationId,
          kind: "cooking_complete",
          payload,
          createdAt: new Date().toISOString(),
        });
        await markRecipePackageCompleted(recipePackage.id);
        onComplete?.();
        onClose();
        ui.toast(`已離線暫存：1 次料理、${eaten} 餐；連線後只會同步一次`);
      } catch {
        ui.toast("暫存料理紀錄時發生問題，請確認瀏覽器儲存空間");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    try {
      await api("/cooking/outcomes", json("POST", payload));
      await markRecipePackageCompleted(recipePackage.id);
      await query.invalidateQueries({ queryKey: stateQueryKey });
      onComplete?.();
      onClose();
      ui.toast(`完成 1 次料理、吃了 ${eaten} 餐，圓夢入帳 NT$ ${deposit}`);
    } catch (error) {
      if (error instanceof TypeError) {
        try {
          await enqueueOperation({
            userId: data?.session.user?.id,
            id: operationId,
            kind: "cooking_complete",
            payload,
            createdAt: new Date().toISOString(),
          });
          await markRecipePackageCompleted(recipePackage.id);
          onComplete?.();
          onClose();
          ui.toast("網路中斷，料理結果已安全暫存");
          return;
        } catch {
          // fallback
        }
      }
      if (error instanceof ApiError) {
        if (error.body?.error?.code === "AUTH_REQUIRED" || error.status === 401) {
          try {
            await enqueueOperation({
              userId: data?.session.user?.id,
              id: operationId,
              kind: "cooking_complete",
              payload,
              createdAt: new Date().toISOString(),
            });
            await markRecipePackageCompleted(recipePackage.id);
            onComplete?.();
            onClose();
            ui.toast(`料理完成！訪客模式已先暫存本地（登入後自動同步），圓夢入帳 NT$ ${deposit}`);
            return;
          } catch {
            // fallback
          }
        }
        ui.toast(error.message || "結算發生錯誤，請稍後再試");
      } else {
        ui.toast("結算發生未預期錯誤，請稍後再試");
      }
      setSubmitting(false);
    }
  };

  return (
    <Modal label="料理完成結算" onClose={onClose}>
      <ModalHeader title={recipePackage.title} kicker="確認後才會扣庫存與圓夢入帳" onClose={onClose} />
      <div className="serving-grid">
        <label>
          這次煮幾份
          <input
            className="field"
            type="number"
            min="1"
            value={servingsInput}
            onFocus={(e) => e.target.select()}
            onChange={(event) => {
              const val = event.target.value;
              setServingsInput(val);
              if (val !== "") {
                const s = Math.max(1, parseInt(val, 10) || 1);
                if (eaten > s) setEatenInput(String(s));
              }
            }}
            onBlur={() => {
              if (servingsInput === "" || parseInt(servingsInput, 10) < 1) {
                setServingsInput("1");
              } else {
                setServingsInput(String(servings));
              }
            }}
          />
        </label>
        <label>
          現在吃幾份
          <input
            className="field"
            type="number"
            min="0"
            max={servings}
            value={eatenInput}
            onFocus={(e) => e.target.select()}
            onChange={(event) => setEatenInput(event.target.value)}
            onBlur={() => {
              if (eatenInput === "" || isNaN(parseInt(eatenInput, 10))) {
                setEatenInput("0");
              } else {
                const clamped = Math.min(servings, Math.max(0, parseInt(eatenInput, 10) || 0));
                setEatenInput(String(clamped));
              }
            }}
          />
        </label>
      </div>
      <p className="prepared-note">剩下 {Math.max(0, servings - eaten)} 份會成為熟食庫存；料理次數仍只記 1 次。</p>
      <label className="field-label">
        本餐實際食材成本
        <input
          className="field"
          type="number"
          min="0"
          value={costInput}
          onFocus={(e) => e.target.select()}
          onChange={(event) => setCostInput(event.target.value)}
          onBlur={() => {
            if (costInput === "" || isNaN(parseInt(costInput, 10))) {
              setCostInput("0");
            } else {
              setCostInput(String(cost));
            }
          }}
        />
      </label>
      <div className="saving-confirm">
        <span>可確認省下</span>
        <strong>NT$ {calculatedSaving}</strong>
        <small>本人外食比較價 NT$ {outsideCost} × {eaten} 份 − 食材成本</small>
      </div>
      <label className="field-label">
        這次確認圓夢入帳
        <input
          className="field"
          type="number"
          min="0"
          max={calculatedSaving}
          value={depositInput}
          onFocus={(e) => e.target.select()}
          onChange={(event) => setDepositInput(event.target.value)}
          onBlur={() => {
            if (depositInput === "" || isNaN(parseInt(depositInput, 10))) {
              setDepositInput("0");
            } else {
              const clamped = Math.min(calculatedSaving, Math.max(0, parseInt(depositInput, 10) || 0));
              setDepositInput(String(clamped));
            }
          }}
        />
      </label>
      <div className="mt-3">
        <label className="vegetable-check">
          <input type="checkbox" checked={vegetables} onChange={(event) => setVegetables(event.target.checked)} />
          <span className="flex-1 flex items-center justify-between gap-1">
            <span>這餐實際吃到蔬菜</span>
            <span className="text-[10px] font-extrabold text-[#2d6a4f] bg-[#d5ede1] px-2 py-0.5 rounded-full border border-[#b4dfc8]">
              🌱 圓夢健康指標
            </span>
          </span>
        </label>
        <p className="text-[11px] text-[#5c6d5f] mt-1 px-1 leading-relaxed">
          不計算卡路里壓力，紀錄將計入「圓夢進度」每週蔬菜攝取種類，建立正向飲食自主感。
        </p>
      </div>
      <div className="mt-lg flex gap-sm">
        <button
          type="button"
          disabled={submitting}
          onClick={() => setDepositInput("0")}
          className="secondary-btn flex-1"
        >
          這次不入帳
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={finish}
          className="primary-btn flex-1 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>結算中…</span>
            </>
          ) : (
            "確認完成"
          )}
        </button>
      </div>
    </Modal>
  );
}
