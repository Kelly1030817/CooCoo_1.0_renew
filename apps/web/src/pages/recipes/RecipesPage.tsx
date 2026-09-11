import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { InventoryItem, RecipeAdjustmentPreview, RecipePackage } from "@coocoo/contracts";
import { brandSafeRecipes, inventoryItemsNeedingConfirmation, searchRecipes } from "@coocoo/core";
import { stateQueryKey, useAppState } from "@/entities/app-state/model";
import { usePrepTray } from "@/features/kitchen/prep-tray";
import { RecipeModal } from "@/features/cooking/RecipeModal";
import { IngredientIcon } from "@/shared/ui/IngredientIcon";
import { UiContext } from "@/app/ui-context";
import { Modal, ModalHeader } from "@/shared/ui/Modal";
import { api, json } from "@/shared/api/client";
import "./RecipesPage.css";

const categories = [["all", "全部"], ["quick", "15 分鐘"], ["fridge", "冰箱救援"], ["new", "新口味"], ["favorites", "收藏"]] as const;

export function RecipesPage() {
  const { data } = useAppState();
  const queryClient = useQueryClient();
  const ui = useContext(UiContext);
  const { prepIds } = usePrepTray();
  const [tab, setTab] = useState<"find" | "compose">(() => {
    const requested = new URLSearchParams(window.location.search).get("tab");
    if (requested === "find" || requested === "compose") return requested;
    return prepIds.length > 0 ? "compose" : "find";
  });
  const changeTab = (next: "find" | "compose") => {
    setTab(next);
    const search = new URLSearchParams(window.location.search);
    search.set("tab", next);
    window.history.replaceState(window.history.state, "", `/recipes?${search.toString()}`);
  };
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number][0]>("all");
  const inventoryKeys = useMemo(() => new Set((data?.inventory ?? []).map((item) => item.ingredientKey)), [data?.inventory]);
  const hasAllIngredients = useCallback((recipe: RecipePackage) => recipe.ingredients.filter((item) => !item.isPantryStaple).every((item) => inventoryKeys.has(item.ingredientKey)), [inventoryKeys]);
  const favorites = useMemo(() => new Set(data?.recipeFavoriteIds ?? []), [data?.recipeFavoriteIds]);
  const cookedTitles = useMemo(() => new Set((data?.cookingOutcomes ?? []).map((item) => item.mealName)), [data?.cookingOutcomes]);
  const results = useMemo(() => searchRecipes(brandSafeRecipes, data?.inventory ?? [], query, [], favorites).filter(({ recipe, favorite }) => category === "all" || (category === "quick" && recipe.totalMinutes <= 15) || (category === "fridge" && hasAllIngredients(recipe)) || (category === "new" && !cookedTitles.has(recipe.title)) || (category === "favorites" && favorite)), [category, cookedTitles, data?.inventory, favorites, hasAllIngredients, query]);
  const toggleFavorite = async (recipeId: string, favorite: boolean) => { await api(`/recipes/${recipeId}/favorite`, { method: favorite ? "DELETE" : "PUT" }); await queryClient.invalidateQueries({ queryKey: stateQueryKey }); };
  const preview=(recipe:RecipePackage)=>ui.open(<RecipePreview recipe={recipe} inventory={data?.inventory??[]} onClose={ui.close} onCreated={(status)=>{ui.close();ui.toast(status==="ready"?"MealTask 已建立，可以開始料理。":"MealTask 已建立；缺料已交給採買頁。");}}/>);
  return <div className="recipes-page">
    <header><p className="eyebrow">RECIPE LIBRARY</p><h2>今天想煮什麼？</h2><p>可靠食譜優先；AI 只在你確認差異後調整份數、替代與情境。</p></header>
    <div className="recipe-tabs" role="tablist" aria-label="食譜模式"><button type="button" role="tab" aria-selected={tab === "find"} className={tab === "find" ? "active" : ""} onClick={() => changeTab("find")}>找食譜</button><button type="button" role="tab" aria-selected={tab === "compose"} className={tab === "compose" ? "active" : ""} onClick={() => changeTab("compose")}>自由搭配</button></div>
    {tab === "compose" ? <FreeformComposePanel /> : <><input className="recipe-search" name="recipe-search" autoComplete="off" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜尋食譜或多種食材…" aria-label="搜尋食譜或食材" /><div className="recipe-chips">{categories.map(([value, label]) => <button type="button" key={value} className={category === value ? "active" : ""} onClick={() => setCategory(value)}>{label}</button>)}</div><div className="recipe-results">{results.map(({ recipe, favorite }) => <article key={recipe.id}><div><span>{hasAllIngredients(recipe) ? "冰箱全符合" : "部分符合／需補買"}</span><button type="button" className="favorite-btn" aria-label={favorite ? "取消收藏" : "加入收藏"} onClick={() => void toggleFavorite(recipe.recipeId, favorite)}>{favorite ? "已收藏" : "收藏"}</button><h3>{recipe.title}</h3><p>{recipe.totalMinutes} 分鐘 · {recipe.servings} 人份</p></div><ul>{recipe.ingredients.filter((item) => !item.isPantryStaple).map((item) => <li key={item.ingredientKey} className={inventoryKeys.has(item.ingredientKey) ? "ready" : "missing"}>{item.name} {item.quantity}{item.unit}</li>)}</ul><button type="button" onClick={() => preview(recipe)}>查看並調整</button></article>)}</div></>}
  </div>;
}

const composeStyles=["AI 自由發揮","台式家常","日式和風","低卡健康","一鍋到底免洗"];
function FreeformComposePanel(){
  const {data}=useAppState();const ui=useContext(UiContext);const {prepIds,addToTray,removeFromTray,clearTray}=usePrepTray();const [style,setStyle]=useState(composeStyles[0]);
  if(!data)return null;
  const selected=data.inventory.filter((item)=>prepIds.includes(item.id));const available=data.inventory.filter((item)=>!prepIds.includes(item.id)).sort((a,b)=>a.daysLeft-b.daysLeft);
  const start=()=>{if(!selected.length){ui.toast("請先選取至少一項食材。","warning");return;}ui.open(<RecipeModal ingredientIds={selected.map((item)=>item.id)} style={style} onClose={ui.close} onComplete={()=>{clearTray();ui.toast("料理完成，已更新庫存與主廚進度。");}}/>)};
  return <section className="compose-panel"><header><div><p className="eyebrow">備料盤</p><h3>用冰箱裡的食材自由搭配</h3></div><span>{selected.length} 項已選</span></header><div className="compose-section"><strong>料理風格</strong><div className="recipe-chips">{composeStyles.map((item)=><button type="button" key={item} className={style===item?"active":""} onClick={()=>setStyle(item)}>{item}</button>)}</div><small>使用「我的」已設定的廚具：{data.cookware.map((item)=>item.name||item.type).join("、")||"尚未設定"}</small></div><div className="compose-section"><strong>已選食材</strong>{selected.length?<div className="compose-ingredients">{selected.map((item)=><button type="button" key={item.id} onClick={()=>removeFromTray(item.id)}><IngredientIcon name={item.name} size={18}/><span>{item.name} {item.qty}{item.unit}</span><small>移除</small></button>)}</div>:<p>從下方挑一項食材開始，不需要先決定完整菜色。</p>}</div><div className="compose-section"><strong>冰箱可用食材</strong><div className="compose-ingredients">{available.map((item)=><button type="button" key={item.id} onClick={()=>addToTray(item.id)}><IngredientIcon name={item.name} size={18}/><span>{item.name} {item.qty}{item.unit}</span><small>{item.daysLeft<=3?`即期 ${item.daysLeft} 天`:"加入"}</small></button>)}</div></div><button type="button" className="primary-btn w-full" disabled={!selected.length} onClick={start}>依備料盤產生料理建議</button></section>;
}

function RecipePreview({recipe,inventory,onClose,onCreated}:{recipe:RecipePackage;inventory:InventoryItem[];onClose:()=>void;onCreated:(status:string)=>void}){
  const [servings, setServings] = useState(recipe.servings);
  const [doubleMeal, setDoubleMeal] = useState(false);
  const [staleConfirmed, setStaleConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [adjustment, setAdjustment] = useState<RecipeAdjustmentPreview | null>(null);
  const [error, setError] = useState("");
  const totalServings = servings * (doubleMeal ? 2 : 1);
  const missing = adjustment?.missing ?? [];
  const stale = inventoryItemsNeedingConfirmation(inventory, recipe.ingredients.map((item) => item.ingredientKey));
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPreviewBusy(true);
      api<RecipeAdjustmentPreview>(`/recipes/${recipe.id}/adjustments/preview`, json("POST", { operationId: crypto.randomUUID(), servings: totalServings, replacementRequests: [], context: doubleMeal ? "多煮下一餐" : "本餐" }))
        .then(setAdjustment)
        .catch((reason: Error) => setError(reason.message))
        .finally(() => setPreviewBusy(false));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [doubleMeal, recipe.id, totalServings]);
  const confirm=async()=>{setBusy(true);setError("");try{const today=new Date().toISOString().slice(0,10);const task=await api<{status:string}>("/meal-tasks",json("POST",{operationId:crypto.randomUUID(),recipePackageId:recipe.id,adjustmentPreviewId:adjustment?.previewId,currentMeal:{date:today,slot:"dinner",servings},nextMeal:doubleMeal?{strategy:"cook_extra",date:today,slot:"lunch",servings}:{strategy:"skip"}}));onCreated(task.status);}catch(reason){setError(reason instanceof Error?reason.message:"MealTask 建立失敗")}finally{setBusy(false)}};
  return <Modal label="食譜調整預覽" onClose={onClose}><ModalHeader title={recipe.title} kicker="差異、缺料與安全檢核" onClose={onClose}/><label className="field-label">份數<input className="field" type="number" min="1" max="20" value={servings} onChange={(event)=>setServings(Number(event.target.value))}/></label><label className="vegetable-check mt-sm"><input type="checkbox" checked={doubleMeal} onChange={(event)=>setDoubleMeal(event.target.checked)}/><span>這次多煮下一餐（選配，可跳過）</span></label><section className="mt-md rounded-2xl bg-surface-container-low p-md"><strong>調整差異</strong><p>原始 {recipe.servings} 份 → 本次 {servings*(doubleMeal?2:1)} 份</p><strong>缺料</strong>{missing.length?<ul>{missing.map((item)=><li key={item.ingredientKey}>{item.name} 尚缺 {item.quantity}{item.unit}</li>)}</ul>:<p>{previewBusy?"正在核對庫存…":"目前庫存足夠"}</p>}{stale.length>0&&<label className="vegetable-check mt-sm"><input type="checkbox" checked={staleConfirmed} onChange={(event)=>setStaleConfirmed(event.target.checked)}/><span>我已核對這次會用到的 {stale.map((item)=>item.name).join("、")}</span></label>}<strong>安全檢核</strong><p>後端會再次套用過敏與禁食硬限制；未通過就不建立任務。</p><small>{previewBusy ? "正在產生調整預覽…" : adjustment?.source === "openrouter" ? "AI 調整預覽已完成；確認後才建立任務。" : "AI 不可用，已清楚切換規則型調整。"}</small></section>{error&&<p role="alert" className="onboarding-error">{error}</p>}<div className="mt-md flex gap-sm"><button className="secondary-btn flex-1" onClick={onClose}>取消</button><button className="primary-btn flex-1" disabled={busy||previewBusy||!adjustment||(stale.length>0&&!staleConfirmed)} onClick={()=>void confirm()}>{busy?"建立中…":"確認並建立 MealTask"}</button></div></Modal>;
}
