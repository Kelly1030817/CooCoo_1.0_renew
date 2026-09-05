import { useContext, useEffect, useState } from "react";
import type { MealPlanResult, MealPostpone, MealSlot, PlannedMeal, RecipePackage, TodayDecision } from "@coocoo/contracts";
import { useAppState } from "@/entities/app-state/model";
import { UiContext } from "@/app/ui-context";
import { RecipePackageModal } from "@/features/cooking/RecipeModal";
import { api, json } from "@/shared/api/client";
import { Modal, ModalHeader } from "@/shared/ui/Modal";
import "./TodayPage.css";

const subtitles:Record<string,string>={"番茄滑蛋飯":"先用掉冰箱裡的蛋與番茄","味噌蔬菜烏龍麵":"一鍋到底，收拾也輕鬆","胡麻雞絲拌麵":"同一批青菜，換一個味道"};
const taipeiDateParts=(value:Date)=>Object.fromEntries(new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Taipei",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(value).filter(part=>part.type!=="literal").map(part=>[part.type,part.value]));
const dateOnly=()=>{const parts=taipeiDateParts(new Date());return `${parts.year}-${parts.month}-${parts.day}`};
const weekStart=(date:string)=>{const value=new Date(date+"T12:00:00+08:00");const day=value.getDay()||7;value.setDate(value.getDate()-day+1);const parts=taipeiDateParts(value);return `${parts.year}-${parts.month}-${parts.day}`};
const slotName:Record<MealSlot,string>={breakfast:"早餐",lunch:"午餐",dinner:"晚餐"};
const dayLabel=(date:string)=>new Intl.DateTimeFormat("zh-TW",{timeZone:"Asia/Taipei",weekday:"short",month:"numeric",day:"numeric"}).format(new Date(date+"T12:00:00+08:00"));

export function TodayPage() {
  const { data } = useAppState();
  const ui = useContext(UiContext);
  const [energyLow,setEnergyLow]=useState(false);
  const [decision,setDecision]=useState<TodayDecision|null>(null);
  const [planResult,setPlanResult]=useState<MealPlanResult|null>(null);
  const [primaryId,setPrimaryId]=useState("");
  const [error,setError]=useState("");
  const today=dateOnly();
  useEffect(()=>{let active=true;setError("");api<TodayDecision>("/meal-decisions/today?date="+today+"&energy="+(energyLow?"low":"normal")).then(value=>{if(active){setDecision(value);setPrimaryId(value.primary?.id||"")}}).catch(reason=>active&&setError(reason instanceof Error?reason.message:"餐點載入失敗"));return()=>{active=false}},[energyLow,today]);
  useEffect(()=>{let active=true;const week=weekStart(today);api<MealPlanResult>("/meal-plans",json("POST",{weekStart:week})).then(value=>active&&setPlanResult(value)).catch(reason=>active&&setError(reason instanceof Error?reason.message:"本週餐單載入失敗"));return()=>{active=false}},[today]);
  const choices=[decision?.primary,...(decision?.alternatives||[])].filter((item):item is RecipePackage=>Boolean(item));
  const recommended=choices.find(item=>item.id===primaryId)||choices[0];
  const choose=(meal:RecipePackage)=>{setPrimaryId(meal.id);ui.toast("今天就煮「"+meal.title+"」")};
  const start=()=>{if(!recommended)return;const ingredientIds=(data?.inventory||[]).filter(item=>recommended.ingredients.some(ingredient=>[ingredient.name,ingredient.ingredientKey].includes(item.name))).map(item=>item.id);ui.open(<RecipePackageModal recipePackage={recommended} ingredientIds={ingredientIds} onClose={ui.close}/>)};
  const reschedule=(meal:PlannedMeal)=>ui.open(<PostponeModal meal={meal} planWeekStart={planResult!.plan.weekStart} planUpdatedAt={planResult!.plan.updatedAt} onClose={ui.close} onSaved={value=>{setPlanResult(value);ui.close();ui.toast("本週餐單已更新")}}/>);
  if(error&&!recommended)return <section className="today-page no-safe-meal" role="alert"><p className="eyebrow">今天 · 尚未載入</p><h2>{error}</h2><button className="primary-btn" onClick={()=>location.reload()}>重新整理</button></section>;
  if(!decision||!planResult)return <section className="today-page no-safe-meal" role="status"><p className="eyebrow">今天</p><h2>正在依你的設定安排餐點…</h2></section>;
  if(!recommended)return <section className="today-page no-safe-meal" role="status"><p className="eyebrow">今天 · 安全優先</p><h2>目前沒有同時符合飲食限制、廚具與預算的餐點。</h2><p>{decision.notice}</p></section>;
  return <div className="today-page">
    {error&&<p className="today-warning" role="alert">{error}</p>}
    <section className="today-intro"><div><p className="eyebrow">今天 · {slotName[decision.slot]}</p><h2>先別想一整週，<br />決定下一餐就好。</h2></div><button className={energyLow?"energy-toggle active":"energy-toggle"} onClick={()=>setEnergyLow(value=>!value)}><span>☁</span>{energyLow?"低體力模式已開":"今天有點累"}</button></section>
    <article className="meal-ticket primary-meal"><div className="ticket-stub"><span>首選</span><strong>01</strong></div><div className="ticket-body"><div className="meal-tags"><span>{recommended.totalMinutes<=15?"15 分快手":recommended.totalMinutes+" 分鐘"}</span><span>庫存優先</span><span>NT$ {recommended.estimatedCost}</span></div><h3>{recommended.title}</h3><p>{subtitles[recommended.title]||decision.notice}</p><div className="ingredient-route">{recommended.ingredients.filter(item=>!item.isPantryStaple).map((item,index)=><span key={item.ingredientKey}>{item.name}{item.coveredByInventory?"（已有）":""}{index<recommended.ingredients.filter(value=>!value.isPantryStaple).length-1&&<i>＋</i>}</span>)}</div><button className="cook-choice" onClick={start}>就煮這道 <span>→</span></button></div></article>
    <section className="alternatives"><div className="section-heading"><div><p className="eyebrow">還有兩個方向</p><h3>不用從無限食譜裡挑</h3></div><button onClick={()=>setEnergyLow(value=>!value)}>重新排序</button></div><div className="alternative-grid">{choices.filter(meal=>meal.id!==recommended.id).map(meal=><button className="alternative-card" key={meal.id} onClick={()=>choose(meal)}><span>{meal.totalMinutes<=15?"更省力":"換口味"}</span><strong>{meal.title}</strong><small>{subtitles[meal.title]||"符合你的廚具與飲食設定"}</small><footer><b>{meal.totalMinutes} 分</b><b>NT$ {meal.estimatedCost}</b></footer></button>)}</div></section>
    <section className="week-strip"><div className="week-summary"><p className="eyebrow">這週的 {planResult.plan.meals.filter(meal=>meal.status!=="cancelled").length} 餐</p><h3>買一次，食材多用幾次</h3><div><span><strong>{Math.round(planResult.plan.overlapRate*100)}%</strong>食材重疊率</span><span><strong>{Math.round(planResult.plan.inventoryCoverageRate*100)}%</strong>庫存覆蓋率</span></div>{planResult.expiryWarnings.map(message=><small className="expiry-warning" key={message}>{message}</small>)}</div><ol>{planResult.plan.meals.map((meal,index)=><li key={meal.id}><i>{index+1}</i><span>{dayLabel(meal.date)} · {slotName[meal.slot]} · {meal.title}{meal.status==="cancelled"?"（已取消）":""}</span>{meal.status==="planned"&&<button onClick={()=>reschedule(meal)}>順延</button>}</li>)}</ol></section>
  </div>;
}

function PostponeModal({meal,planWeekStart,planUpdatedAt,onClose,onSaved}:{meal:PlannedMeal;planWeekStart:string;planUpdatedAt:string;onClose:()=>void;onSaved:(value:MealPlanResult)=>void}){
  const [date,setDate]=useState(meal.date);const [slot,setSlot]=useState<MealSlot>(meal.slot);const [error,setError]=useState("");const [saving,setSaving]=useState(false);
  const submit=async(command:Pick<MealPostpone,"kind">)=>{setSaving(true);setError("");try{onSaved(await api<MealPlanResult>("/meal-plans/meals/"+meal.id,json("PATCH",{weekStart:planWeekStart,kind:command.kind,date:command.kind==="specific_date"?date:undefined,slot:command.kind==="specific_date"?slot:undefined,expectedUpdatedAt:planUpdatedAt})))}catch(reason){setError(reason instanceof Error?reason.message:"餐單更新失敗");setSaving(false)}};
  return <Modal label="順延餐點" onClose={onClose}><ModalHeader title={"調整「"+meal.title+"」"} kicker="選擇下一步" onClose={onClose}/>{error&&<p className="offline-error" role="alert">{error}</p>}<button className="primary-btn w-full" disabled={saving} onClick={()=>submit({kind:"next_slot"})}>移到下一個空位</button><div className="mt-md grid grid-cols-2 gap-sm"><label className="field-label">指定日期<input className="field" type="date" value={date} onChange={event=>setDate(event.target.value)}/></label><label className="field-label">餐期<select className="field" value={slot} onChange={event=>setSlot(event.target.value as MealSlot)}><option value="breakfast">早餐</option><option value="lunch">午餐</option><option value="dinner">晚餐</option></select></label></div><button className="secondary-btn mt-sm w-full" disabled={saving} onClick={()=>submit({kind:"specific_date"})}>移到指定日期</button><button className="secondary-btn mt-sm w-full" disabled={saving} onClick={()=>submit({kind:"cancel"})}>取消這餐</button></Modal>;
}
