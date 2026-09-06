import { useContext, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Recipe, RecipeGeneration, RecipePackage } from "@coocoo/contracts";
import { api, json } from "@/shared/api/client";
import { Modal, ModalHeader } from "@/shared/ui/Modal";
import { UiContext } from "@/app/ui-context";
import { useAppState, stateQueryKey } from "@/entities/app-state/model";
import { enqueueOperation, markRecipePackageCompleted, saveRecipePackage } from "@/shared/offline/recipe-packages";

export function RecipeModal({ ingredientIds, style, onClose, onComplete }: { ingredientIds: string[]; style: string; onClose: () => void; onComplete?: () => void }) {
  const [generation, setGeneration] = useState<RecipeGeneration | null>(null);
  const [cookingPackage, setCookingPackage] = useState<RecipePackage | null>(null);
  const [offlineError, setOfflineError] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { api<RecipeGeneration>("/recipes/generate", json("POST", { ingredientIds, style })).then(setGeneration).catch((reason: Error) => setError(reason.message)); }, [ingredientIds, style]);
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
  return <Modal label={recipe.title} onClose={onClose} wide><ModalHeader title={recipe.title} kicker={`${recipe.totalMinutes} 分鐘 · ${recipe.servings} 人份 · NT$ ${recipe.estimatedCost}`} onClose={onClose} />{generation.notice&&<p className="rounded-xl bg-secondary/10 p-md text-xs text-on-surface-variant">{generation.notice}</p>}<div className="meal-tags">{recipe.cookwareTypes.map(item=><span key={item}>{item}</span>)}</div><ol className="mt-md space-y-sm">{recipe.steps.map(step => <li key={step.id} className="flex gap-sm rounded-2xl bg-surface-container-low p-md"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-extrabold text-white">{step.order}</span><p className="text-sm leading-6 text-slate-blue">{step.instruction}{step.safetyNote&&<small className="mt-1 block text-error">注意：{step.safetyNote}</small>}</p></li>)}</ol>{offlineError && <p role="alert" className="offline-error">{offlineError}</p>}<div className="mt-lg flex flex-col gap-sm sm:flex-row"><button onClick={async () => setGeneration(await api<RecipeGeneration>("/recipes/generate", json("POST", { ingredientIds, style, excludeTitle: recipe.title })))} className="secondary-btn flex-1">換一道</button><button onClick={start} className="primary-btn flex-1">下載並開始料理</button></div></Modal>;
}

export function RecipePackageModal({ recipePackage, ingredientIds, onClose, onComplete }: { recipePackage: RecipePackage; ingredientIds: string[]; onClose: () => void; onComplete?: () => void }) {
  const [savedPackage,setSavedPackage]=useState<RecipePackage|null>(null);const [error,setError]=useState("");
  if(savedPackage)return <CookingMode recipePackage={savedPackage} ingredientIds={ingredientIds} onClose={onClose} onComplete={onComplete}/>;
  const start=async()=>{setError("");try{setSavedPackage(await saveRecipePackage(recipePackage.catalogVersionId?await api<RecipePackage>(`/recipes/${recipePackage.catalogVersionId}/start`,json("POST",{})):recipePackage))}catch{setError("核心食譜未能存到這台裝置，尚未進入離線料理。");}};
  return <Modal label={recipePackage.title} onClose={onClose} wide><ModalHeader title={recipePackage.title} kicker={`${recipePackage.totalMinutes} 分鐘 · ${recipePackage.servings} 人份 · NT$ ${recipePackage.estimatedCost}`} onClose={onClose}/><div className="meal-tags"><span>{recipePackage.totalMinutes<=15?"快手餐":"低體力可選"}</span>{recipePackage.cookwareTypes.map(item=><span key={item}>{item}</span>)}</div><ol className="mt-md space-y-sm">{recipePackage.steps.map(step=><li key={step.id} className="rounded-2xl bg-surface-container-low p-md text-sm text-slate-blue">{step.order}. {step.instruction}</li>)}</ol>{error&&<p className="offline-error">{error}</p>}<button onClick={start} className="primary-btn mt-lg w-full">下載並開始料理</button></Modal>;
}

function CookingMode({ recipePackage, ingredientIds, onClose, onComplete }: { recipePackage: RecipePackage; ingredientIds: string[]; onClose: () => void; onComplete?: () => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [status, setStatus] = useState("語音待命");
  const [finishing, setFinishing] = useState(false);
  const wakeLock = useRef<{ release: () => Promise<void> } | null>(null);
  const step = recipePackage.steps[stepIndex];
  const speak = () => { if ("speechSynthesis" in window) { speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(step.voiceText)); } };
  const next = () => setStepIndex((value) => Math.min(recipePackage.steps.length - 1, value + 1));
  const previous = () => setStepIndex((value) => Math.max(0, value - 1));
  useEffect(() => {
    const acquire = async () => { try { if ("wakeLock" in navigator) wakeLock.current = await (navigator as Navigator & { wakeLock: { request: (type: "screen") => Promise<{ release: () => Promise<void> }> } }).wakeLock.request("screen"); } catch { setStatus("螢幕可能會自動變暗，料理仍可繼續"); } };
    void acquire(); const resume = () => { if (document.visibilityState === "visible") void acquire(); }; document.addEventListener("visibilitychange", resume);
    return () => { document.removeEventListener("visibilitychange", resume); void wakeLock.current?.release(); };
  }, []);
  useEffect(() => { if (!timerRunning || secondsLeft === null) return; const timer = window.setInterval(() => setSecondsLeft((value) => value === null ? null : Math.max(0, value - 1)), 1000); return () => window.clearInterval(timer); }, [timerRunning, secondsLeft]);
  useEffect(() => { if (secondsLeft === 0) { setTimerRunning(false); setStatus("計時完成"); } }, [secondsLeft]);
  const commands = { "上一步": previous, "下一步": next, "重複": speak, "開始計時": () => { setSecondsLeft(step.timerSeconds ?? 60); setTimerRunning(true); }, "還剩多久": () => setStatus(secondsLeft === null ? "目前沒有計時" : `還剩 ${secondsLeft} 秒`), "完成料理": () => setFinishing(true) };
  const listen = () => {
    const SpeechRecognition = (window as typeof window & { webkitSpeechRecognition?: new () => { lang: string; start: () => void; onresult: (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onerror: () => void } }).webkitSpeechRecognition;
    if (!SpeechRecognition) { setStatus("這個瀏覽器不支援語音，請使用下方大按鈕"); return; }
    const recognition = new SpeechRecognition(); recognition.lang = "zh-TW";
    recognition.onresult = (event) => { const transcript = event.results[0][0].transcript.replace(/[，。！？\s]/g, ""); const entry = Object.entries(commands).find(([command]) => transcript.includes(command)); if (entry) { entry[1](); setStatus(`已執行：${entry[0]}`); } else setStatus(`沒有聽懂：「${transcript}」`); };
    recognition.onerror = () => setStatus("語音暫時不可用，請使用下方大按鈕"); recognition.start(); setStatus("正在聽…");
  };
  if (finishing) return <CookingCompleteModal recipePackage={recipePackage} ingredientIds={ingredientIds} onClose={onClose} onComplete={onComplete} />;
  return <div className="cooking-mode" role="dialog" aria-modal="true" aria-label={`${recipePackage.title}料理模式`}><header><button onClick={onClose} aria-label="離開料理"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button><div><small>{recipePackage.title}</small><strong>步驟 {stepIndex + 1} / {recipePackage.steps.length}</strong></div><button onClick={listen} aria-label="開始語音控制"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg></button></header><div className="cooking-progress"><i style={{ width: `${((stepIndex + 1) / recipePackage.steps.length) * 100}%` }} /></div><main><span>STEP {String(step.order).padStart(2, "0")}</span><h2>{step.instruction}</h2>{step.safetyNote && <p className="safety-note">注意：{step.safetyNote}</p>}<button className="repeat-step" onClick={speak}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg><span>重複唸一次</span></button>{secondsLeft !== null && <div className="timer-display"><strong>{Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}</strong><button onClick={() => setTimerRunning((value) => !value)}>{timerRunning ? "暫停" : "繼續"}</button></div>}<p className="voice-status" aria-live="polite">{status}</p></main><footer><button onClick={previous} disabled={stepIndex === 0}>← 上一步</button>{stepIndex < recipePackage.steps.length - 1 ? <button className="next-step" onClick={next}>下一步 →</button> : <button className="next-step" onClick={() => setFinishing(true)}>完成料理</button>}</footer></div>;
}

function CookingCompleteModal({ recipePackage, ingredientIds, onClose, onComplete }: { recipePackage: RecipePackage; ingredientIds: string[]; onClose: () => void; onComplete?: () => void }) {
  const { data } = useAppState(); const query = useQueryClient(); const ui = useContext(UiContext); const outsideCost = data?.cookingPlan?.eatingOutCost || 0;
  const [cost, setCost] = useState(data?.cookingPlan?.homeCookBudget || 80); const [servings, setServings] = useState(recipePackage.servings); const [eaten, setEaten] = useState(1); const calculatedSaving = Math.max(0, outsideCost * eaten - cost); const [deposit, setDeposit] = useState(calculatedSaving); const [vegetables, setVegetables] = useState(recipePackage.ingredients.some((item) => item.isVegetable));
  const finish = async () => { const operationId=crypto.randomUUID(); const legacyRecipe: Recipe = { catalogVersionId:recipePackage.catalogVersionId, source:recipePackage.source??(recipePackage.catalogVersionId?"catalog":"brand_safe"), id: recipePackage.recipeId, title: recipePackage.title, style: "料理包", prepTime: `${recipePackage.totalMinutes} 分鐘`, estCost: `NT$ ${cost}`, scientificPrinciple: "已下載的離線料理包", ingredients: recipePackage.ingredients.map((item) => item.name), steps: recipePackage.steps.map((item) => item.instruction) }; const payload={ completionKey: operationId, recipe: legacyRecipe, ingredientIds, ingredientRequirements:recipePackage.ingredients.map(i=>({...i,quantity:i.quantity/recipePackage.servings})), homeCookCost: cost, actualDeposit: deposit, foodSafe: true, vegetables, lowOil: false, mindfulSeasoning: false, servingsCooked: servings, servingsEaten: eaten }; if(!navigator.onLine){await enqueueOperation({userId:data?.session.user?.id,id:operationId,kind:"cooking_complete",payload,createdAt:new Date().toISOString()});await markRecipePackageCompleted(recipePackage.id);onComplete?.();onClose();ui.toast(`已離線暫存：1 次料理、${eaten} 餐；連線後只會同步一次`);return} try{await api("/cooking/outcomes", json("POST", payload));await markRecipePackageCompleted(recipePackage.id);await query.invalidateQueries({ queryKey: stateQueryKey });onComplete?.();onClose();ui.toast(`完成 1 次料理、吃了 ${eaten} 餐，圓夢入帳 NT$ ${deposit}`)}catch(error){if(error instanceof TypeError){await enqueueOperation({userId:data?.session.user?.id,id:operationId,kind:"cooking_complete",payload,createdAt:new Date().toISOString()});await markRecipePackageCompleted(recipePackage.id);onComplete?.();onClose();ui.toast("網路中斷，料理結果已安全暫存");return}throw error} };
  return <Modal label="料理完成結算" onClose={onClose}><ModalHeader title={recipePackage.title} kicker="確認後才會扣庫存與圓夢入帳" onClose={onClose} /><div className="serving-grid"><label>這次煮幾份<input className="field" type="number" min="1" value={servings} onChange={(event) => { const value = Math.max(1, Number(event.target.value)); setServings(value); setEaten((current) => Math.min(current, value)); }} /></label><label>現在吃幾份<input className="field" type="number" min="0" max={servings} value={eaten} onChange={(event) => setEaten(Math.min(servings, Math.max(0, Number(event.target.value))))} /></label></div><p className="prepared-note">剩下 {Math.max(0, servings - eaten)} 份會成為熟食庫存；料理次數仍只記 1 次。</p><label className="field-label">本餐實際食材成本<input className="field" type="number" min="0" value={cost} onChange={(event) => setCost(Number(event.target.value))} /></label><div className="saving-confirm"><span>可確認省下</span><strong>NT$ {calculatedSaving}</strong><small>本人外食比較價 NT$ {outsideCost} × {eaten} 份 − 食材成本</small></div><label className="field-label">這次確認圓夢入帳<input className="field" type="number" min="0" max={calculatedSaving} value={deposit} onChange={(event) => setDeposit(Math.min(calculatedSaving, Number(event.target.value)))} /></label><label className="vegetable-check"><input type="checkbox" checked={vegetables} onChange={(event) => setVegetables(event.target.checked)} /> 這餐實際吃到蔬菜</label><div className="mt-lg flex gap-sm"><button onClick={() => setDeposit(0)} className="secondary-btn flex-1">這次不入帳</button><button onClick={finish} className="primary-btn flex-1">確認完成</button></div></Modal>;
}
