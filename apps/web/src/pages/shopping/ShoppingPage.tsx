import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { MealTask, MealTaskRestockResult, RecipeAdjustmentPreview, RestockPurchasedItem, ShoppingItem } from "@coocoo/contracts";
import { useAppState, stateQueryKey } from "@/entities/app-state/model";
import { UiContext } from "@/app/ui-context";
import { api, json } from "@/shared/api/client";
import { AddShoppingModal, InvoiceModal, ShoppingAssistantModal, VoiceInputModal } from "@/features/shopping/ShoppingModals";
import { RecipePackageModal } from "@/features/cooking/RecipeModal";
import { IngredientIcon } from "@/shared/ui/IngredientIcon";
import { useAppRoute } from "@/app/routing/useAppRoute";
import { CHEF_RANKS } from "@coocoo/core";
import "./ShoppingPage.css";

const categoryLabel:Record<ShoppingItem["category"],string>={produce:"蔬果",protein:"蛋白質",pantry:"常備品",other:"其他"};
type DraftLine={item:ShoppingItem;actualQuantity:number;actualUnit:string;actualPrice:number;storageLocation:"cold"|"frozen"|"pantry";expiresOn:string};
const defaultLocation=(item:ShoppingItem):DraftLine["storageLocation"]=>item.category==="pantry"?"pantry":"cold";
const slotLabel={breakfast:"早餐",lunch:"午餐",dinner:"晚餐"} as const;
const shortDate=(date?:string)=>date?date.slice(5).replace("-","/"):"待確認";

export function ShoppingPage(){
  const {data}=useAppState();const {navigate}=useAppRoute();const ui=useContext(UiContext);const query=useQueryClient();
  const [busy,setBusy]=useState(false);
  const operation=useRef<string|null>(null);
  const [selectedTaskId,setSelectedTaskId]=useState<string|null>(null);
  const [adjustment,setAdjustment]=useState<RecipeAdjustmentPreview|null>(null);
  const [draft,setDraft]=useState<DraftLine[]|null>(null);
  const [resolution,setResolution]=useState<{task:MealTask;shortageId:string;mode:"replace"|"keep"|"replan";name:string;qty:number;unit:string}|null>(null);
  useEffect(()=>{void api('/health').catch(()=>undefined)},[]);
  const refresh=()=>query.invalidateQueries({queryKey:stateQueryKey});
  const save=async(item:ShoppingItem,patch:Partial<ShoppingItem>)=>{await api(`/shopping-items/${item.id}`,json("PATCH",{...item,...patch}));await refresh()};
  const remove=async(id:string)=>{await api(`/shopping-items/${id}`,{method:"DELETE"});await refresh()};
  const tasks=useMemo(()=>(data?.mealTasks??[]).filter((task)=>["needs_shopping","ready","needs_replan"].includes(task.status)),[data?.mealTasks]);
  const activeTask=useMemo(()=>tasks.find(task=>task.id===selectedTaskId)??tasks.find((task)=>task.status==="needs_shopping")??tasks[0],[tasks,selectedTaskId]);
  const byShortage=useMemo(()=>{const map=new Map<string,ShoppingItem>();(data?.shoppingItems??[]).forEach((item)=>{if(item.shortageId&&!map.has(item.shortageId))map.set(item.shortageId,item)});return map},[data?.shoppingItems]);
  if(!data)return null;
  const checked=data.shoppingItems.filter(item=>item.checked&&(!item.shortageId||activeTask?.shortages.some(sh=>sh.id===item.shortageId)));
  const remaining=activeTask?.shortages.filter(sh=>!["bought","replaced"].includes(sh.resolution))??[];
  const requirements=activeTask?.recipe.ingredients.filter(i=>!i.isPantryStaple)??[];
  const coverage=activeTask&&requirements.length?Math.round(100*requirements.reduce((total,item)=>{const sh=remaining.find(sh=>sh.ingredientKey===item.ingredientKey);const required=item.quantity*activeTask.plannedTotalServings/activeTask.recipe.servings;return total+(sh?Math.max(0,1-sh.quantity/Math.max(required,0.001)):1)},0)/requirements.length):activeTask?100:0;
  const rescued=data.inventory.filter(item=>item.qty>0&&item.expiresOn&&item.daysLeft<=3);
  const generalItems=data.shoppingItems.filter((item)=>!item.shortageId);
  const generalChecked=generalItems.filter((item)=>item.checked);
  const taskDone=activeTask?.shortages.filter((item)=>item.resolution==="bought"||item.resolution==="replaced").length??0;
  const taskTotal=activeTask?.shortages.length??0;
  const growth=data.growth;
  const rankIndex=Math.max(0,CHEF_RANKS.findLastIndex((rank)=>growth.totalExp>=rank.threshold));
  const rank=CHEF_RANKS[rankIndex];
  const nextRank=CHEF_RANKS[rankIndex+1];
  const rankSpan=nextRank?nextRank.threshold-rank.threshold:1;
  const rankProgress=nextRank?Math.min(100,Math.round(((growth.totalExp-rank.threshold)/rankSpan)*100)):100;
  const goToday=()=>{ui.close();navigate("today")};
  const act=(action:()=>Promise<unknown>)=>{void action().catch(()=>ui.toast("操作未完成，請再試一次","error"))};
  const startTask=(task:MealTask)=>{const ingredientIds=data.inventory.filter((item)=>task.recipe.ingredients.some((ingredient)=>ingredient.ingredientKey===item.ingredientKey||ingredient.name===item.name)).map((item)=>item.id);ui.open(<RecipePackageModal recipePackage={task.recipe} ingredientIds={ingredientIds} mealTaskId={task.id} onClose={ui.close} onComplete={()=>{void refresh();}}/>)};
  const bridge=(task:MealTask,shortageId:string)=>async()=>{
    const shortage=task.shortages.find((item)=>item.id===shortageId);if(!shortage)return;
    await api("/shopping-items",json("POST",{name:shortage.name,qty:shortage.quantity,unit:shortage.unit,checked:false,status:"MealTask 缺料",estCost:0,shortageId,source:"task"}));
    await refresh();ui.toast("已加入採買清單；買到後勾選即可蓋章");
  };
  const openSettlement=()=>{
    if(!checked.length)return ui.toast("請先勾選實際買到的食材","warning");
    operation.current=crypto.randomUUID();
    setDraft(checked.map((item)=>({item,actualQuantity:item.qty,actualUnit:item.unit,actualPrice:item.estCost,storageLocation:defaultLocation(item),expiresOn:""})));
  };
  const patchDraft=(id:string,patch:Partial<DraftLine>)=>setDraft((lines)=>lines?.map((line)=>line.item.id===id?{...line,...patch}:line)??null);
  const missingExpiry=(draft??[]).filter((line)=>line.item.shortageId&&!line.expiresOn);
  const commit=async()=>{
    if(!draft||busy)return;
    setBusy(true);
    const command={operationId:operation.current??crypto.randomUUID(),mealTaskId:activeTask?.status==="needs_shopping"?activeTask.id:undefined,shortageRevision:activeTask?.status==="needs_shopping"?activeTask.revision:undefined,
      purchasedItems:draft.map((line):RestockPurchasedItem=>({shoppingItemId:line.item.id,shortageId:line.item.shortageId,actualQuantity:line.actualQuantity,actualUnit:line.actualUnit,actualPrice:line.actualPrice,storageLocation:line.storageLocation,expiresOn:line.expiresOn||undefined}))};
    try{
      const result=await api<MealTaskRestockResult>("/shopping/restock",json("POST",command));
      setDraft(null);await refresh();
      if(result.mealTaskStatus==="ready"){
        ui.open(<div className="shopping-ready-sheet"><p className="eyebrow">MealTask · ready</p><h3>{activeTask?.recipe.title} 可以開始了</h3>
          <p>任務必要食材均已入庫。完成採買不會發 EXP，也不代表料理完成。</p>
          <div className="ready-actions"><button className="ghost-btn" onClick={()=>{goToday()}}>返回任務</button>
          <button className="primary-btn" onClick={()=>{ui.close();if(activeTask)startTask(activeTask)}}>直接開始料理</button></div></div>);
      }else{
        ui.toast(result.mealTaskStatus?`已入庫 ${result.count} 項；仍缺 ${result.remainingShortages.length} 項，缺口已保留`:`已入庫 ${result.count} 項`,result.mealTaskStatus?"warning":"success");
      }
    }catch(reason){
      const status=(reason as {status?:number})?.status;
      if(status===409){setDraft(null);operation.current=null;}
      ui.toast(status===409?"任務已更新，清單已刷新；請重新確認後再入庫":"入庫尚未確認，已保留明細；可用相同操作重試","error");
      await refresh();
    }finally{setBusy(false)}
  };
  const submitResolution=async()=>{
    if(!resolution||busy)return;
    setBusy(true);
    const {task,shortageId,mode,name,qty,unit}=resolution;
    try{
      if(mode==="replan"){await api("/meal-tasks/replan",json("POST",{operationId:crypto.randomUUID(),mealTaskId:task.id,shortageRevision:task.revision,action:"replan_meal"}));ui.toast("已放回重新選擇；餐期與份數保留，清單不會被刪除","warning");}
      else if(mode==="keep"){await api(`/meal-tasks/${task.id}/shortages/${shortageId}`,json("PATCH",{operationId:crypto.randomUUID(),mealTaskId:task.id,shortageRevision:task.revision,shortageId,action:"keep_for_later"}));ui.toast("已標記本次找不到，缺口保留到下次","warning");}
      else{await api(`/meal-tasks/${task.id}/shortages/${shortageId}`,json("PATCH",{operationId:crypto.randomUUID(),mealTaskId:task.id,shortageRevision:task.revision,shortageId,action:"replace",adjustmentPreviewId:adjustment?.previewId,replacementIngredientKey:name,replacementName:name,replacementQuantity:qty,replacementUnit:unit}));ui.toast(`已記錄替代為「${name}」；買到後才會蓋章`,"warning");}
      setResolution(null);setAdjustment(null);await refresh();if(mode==="replan")goToday();
    }catch{setResolution(null);ui.toast("處理失敗，請稍後再試","error");await refresh();}finally{setBusy(false)}
  };
  const previewReplacement=async()=>{
    if(!resolution||busy)return;setBusy(true);setAdjustment(null);
    try{const sh=resolution.task.shortages.find(s=>s.id===resolution.shortageId)!;
      const value=await api<RecipeAdjustmentPreview>(`/recipes/${encodeURIComponent(resolution.task.recipe.recipeId)}/adjustments/preview`,json("POST",{operationId:crypto.randomUUID(),servings:resolution.task.plannedTotalServings,replacementRequests:[{ingredientKey:sh.ingredientKey,requestedReplacement:resolution.name}],context:"採買缺貨，請連同料理步驟與安全提醒調整"}));
      if(value.source!=="openrouter")ui.toast("替代食譜目前無法確認，請保留缺口或重新選餐","warning");else setAdjustment(value);
    }catch{ui.toast("替代食譜尚未通過檢核，請保留缺口或重新選餐","warning")}finally{setBusy(false)}
  };
  return <div className="shopping-mobile">
    <section className="shopping-hud" aria-label="主廚職階進度">
      <div className="hud-row"><div className="hud-chef"><span className="hud-avatar material-symbols-outlined" aria-hidden="true">local_fire_department</span><div><strong>{growth.rank.name}</strong><small>{growth.nextBadge?`下一枚 · ${growth.nextBadge.title} ${growth.nextBadge.current}/${growth.nextBadge.target}`:"徽章已全部收藏"}</small></div></div><button className="hud-exp" onClick={()=>navigate("me")}>EXP {growth.totalExp}</button></div>
      <div className="hud-progress"><span style={{width:`${rankProgress}%`}}/></div><div className="hud-meta"><span>職階進度</span><span>{growth.totalExp} / {nextRank?.threshold??growth.totalExp}</span></div>
    </section>

    <section className="shopping-heading">
      <div>
        <p className="eyebrow">GROCERY & MEALTASKS</p>
        <h2>採買清單</h2>
        <p className="shopping-heading-sub">先買任務真正缺少的；一般食材順路再帶。</p>
      </div>
      <button type="button" onClick={()=>ui.open(<ShoppingAssistantModal onClose={ui.close}/>)}>
        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>smart_toy</span>
        <span>AI 陪我逛</span>
      </button>
    </section>

    {tasks.length>1&&<label className="task-selector">切換採買任務<select value={activeTask?.id} onChange={e=>setSelectedTaskId(e.target.value)}>{tasks.map(t=><option key={t.id} value={t.id}>{t.recipe.title} · {shortDate(t.currentMeal.date)} {slotLabel[t.currentMeal.slot]}</option>)}</select></label>}

    <section className={`task-strip ${activeTask?.status??"empty"}`}>
      <span className="task-node material-symbols-outlined" aria-hidden="true">{activeTask?.status==="ready"?"check_circle":activeTask?.status==="needs_replan"?"error":"shopping_cart"}</span>
      <div><strong>{activeTask?.recipe.title??"尚未建立料理任務"}</strong><small>{activeTask?`${slotLabel[activeTask.currentMeal.slot]} · ${activeTask.plannedTotalServings} 份 · ${activeTask.nextMeal.strategy==="cook_extra"?"順便多煮":activeTask.nextMeal.strategy==="plan_separately"?"下餐另規劃":"跳過下一餐"}`:"先到今日確認菜色與份數"}</small></div>
      <button onClick={goToday}>{activeTask?"回 Today":"去選料理"}</button>
    </section>

    <section className="shopping-coverage">
      <div className="coverage-ring" style={{background:`conic-gradient(${activeTask?.status==="ready"?"#4f8067":"#c59332"} ${coverage}%,#ebe4d6 0)`}}><strong>{coverage}<small>%</small><span>任務補齊度</span></strong></div>
      <div><h2>{activeTask?(activeTask.status==='needs_replan'?'這道餐點待重新選擇':remaining.length?`還差 ${remaining.length} 樣就能煮`:'食材已備妥'):"先選一道料理開始"}</h2><p>{activeTask?`只計算已確認的 ${activeTask.plannedTotalServings} 份需求；本週一般採買不影響這個數字。`:"確認料理後，必要食材會自動成為任務票上的章格。"}</p>{activeTask&&<div className="need-list">{remaining.slice(0,3).map(item=><span key={item.id}><IngredientIcon name={item.name} size={13}/>{item.name}</span>)}</div>}</div>
    </section>

    <section className="shopping-ledger">
      <header><div><strong>這次採買算到哪裡？</strong><small>{activeTask?`${activeTask.nextMeal.strategy==="cook_extra"?"順便多煮":activeTask.nextMeal.strategy==="plan_separately"?"下餐另規劃":"跳過下一餐"} · 合計 ${activeTask.plannedTotalServings} 份`:"等待確認料理任務"}</small></div><button onClick={goToday}>查看依據</button></header>
      <div className="scope-flow"><div className="scope-card"><span>這一餐 · {activeTask?"已確認":"待確認"}</span><b>{activeTask?`${shortDate(activeTask.currentMeal.date)} ${slotLabel[activeTask.currentMeal.slot]}`:"尚未選擇"}</b><i>{activeTask?`${activeTask.recipe.title} ${activeTask.currentMeal.servings} 份`:"到今日選擇料理"}</i></div><span className="scope-arrow material-symbols-outlined" aria-hidden="true">arrow_forward</span><div className="scope-card"><span>下一餐 · {activeTask?.nextMeal.strategy==="skip"?"已跳過":activeTask?"已確認":"待確認"}</span><b>{activeTask?.nextMeal.strategy!=="skip"?`${shortDate(activeTask?.nextMeal.date)} ${activeTask?slotLabel[activeTask.nextMeal.slot]:""}`:"跳過下一餐"}</b><i>{activeTask?.nextMeal.strategy==="cook_extra"?`同一道菜留 ${activeTask.nextMeal.servings} 份`:activeTask?.nextMeal.strategy==="plan_separately"?"只保留餐期，不加食材":"不納入計算"}</i></div></div>
      <div className="scope-rule"><b>不自動加購</b><span>尚未選定的料理不會進入 MealTask；確認菜色與份數後才重新計算缺口。</span></div>
    </section>

    <section className={`meal-task-ticket ${activeTask?.status==="ready"?"sealed":""}`}>
      <div className="ticket-stub"><span className="material-symbols-outlined" aria-hidden="true">{activeTask?.status==="ready"?"verified":"local_fire_department"}</span><div><small>任務進度</small><strong>{taskDone}/{taskTotal}</strong><span>{Array.from({length:Math.min(taskTotal,5)},(_,index)=><i key={index} className={index<taskDone?"on":""}/>)}</span></div><b>MEALTASK</b></div>
      <div className="ticket-body"><p className="ticket-label">MealTask 必買</p><h2>{activeTask?.recipe.title??"等待料理任務"}</h2><p className="ticket-copy">{activeTask?`依已確認 ${activeTask.plannedTotalServings} 份計算 · 缺口 ${taskTotal} 項 · revision ${activeTask.revision}`:"到今日確認菜色後，缺口會出現在這張任務票。"}</p>
        {activeTask?<div className="stamp-grid">{activeTask.shortages.map((shortage)=>{const linked=byShortage.get(shortage.id);const done=shortage.resolution==="bought"||shortage.resolution==="replaced";return <article key={shortage.id} className={`stamp-cell ${done?"done":""} ${shortage.resolution==="unavailable"?"unavail":""} ${shortage.resolution==="replaced"?"replaced":""}`}><button className="stamp-main" disabled={done||activeTask.status!=="needs_shopping"} onClick={()=>linked?act(()=>save(linked,{checked:!linked.checked})):act(bridge(activeTask,shortage.id))}><span className="stamp-ico"><IngredientIcon name={shortage.name} size={25}/></span><strong>{shortage.name}</strong><small>{done?`已入庫 ${shortage.quantity}${shortage.unit}`:shortage.resolution==="unavailable"?"本次找不到 · 已保留":linked?.checked?"已勾選 · 待入庫":`需 ${shortage.quantity}${shortage.unit}`}</small>{done&&<em>{shortage.resolution==="replaced"?"已替代":"已蓋章"}</em>}</button>{!done&&activeTask.status==="needs_shopping"&&<button className="stamp-missing" onClick={()=>{setAdjustment(null);setResolution({task:activeTask,shortageId:shortage.id,mode:"keep",name:"",qty:shortage.quantity,unit:shortage.unit})}}>找不到</button>}</article>})}</div>:<button className="empty-ticket-action" onClick={goToday}><span className="material-symbols-outlined" aria-hidden="true">restaurant_menu</span><strong>建立第一張任務票</strong><small>選好料理與份數後再開始採買</small></button>}
        {activeTask?.status==="ready"&&<div className="ticket-cta"><button className="primary-btn" onClick={()=>startTask(activeTask)}>直接開始料理</button><button className="ghost-btn" onClick={goToday}>返回任務</button></div>}
        <p className="ticket-note">{activeTask?.status==="ready"?"食材已備妥。完成採買不發 EXP；料理完成後才會記錄成就。":activeTask?`${remaining.length} 項仍缺。全部確認入庫後才會轉為 ready；部分買到會保留缺口。`:"這裡只呈現已確認的料理需求，不會把 AI 討論內容自動加入清單。"}</p></div>
    </section>

    <section className="shopping-entry-grid"><button onClick={()=>ui.open(<ShoppingAssistantModal onClose={ui.close}/>)}><span className="material-symbols-outlined">auto_awesome</span><strong>AI 陪我逛</strong><small>帶任務缺口一起分析</small></button><button onClick={()=>ui.open(<InvoiceModal onClose={ui.close}/>)}><span className="material-symbols-outlined">document_scanner</span><strong>掃描發票</strong><small>逐項確認後直接入庫</small></button><button onClick={()=>ui.open(<VoiceInputModal onClose={ui.close}/>)}><span className="material-symbols-outlined">mic</span><strong>用說的新增</strong><small>也可以直接打字</small></button></section>

    <section className="shopping-list"><header><div><p className="eyebrow">本週一般採買</p><h3>{generalItems.length} 項 · 已買到 {generalChecked.length} 項</h3><small>一般採買不會影響料理任務是否 ready</small></div><button onClick={async()=>{const shouldCheck=!generalItems.every(item=>item.checked);await Promise.all(generalItems.map(item=>save(item,{checked:shouldCheck})))}}>{generalItems.length&&generalItems.every(item=>item.checked)?"取消全選":"全選"}</button></header>{generalItems.length===0?<div className="empty-shopping"><span className="material-symbols-outlined">add_shopping_cart</span><strong>本週清單是空的</strong><p>從「今日」選一道料理，或手動新增日常食材。</p><button onClick={()=>ui.open(<AddShoppingModal onClose={ui.close}/>)}>手動新增</button></div>:<div className="shopping-cards">{generalItems.map(item=><article key={item.id} className={item.checked?"checked":""}><button className="shopping-check" onClick={event=>{if(!item.checked&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches){const rect=event.currentTarget.getBoundingClientRect();const target=document.querySelector(".shopping-basket");if(target){const end=target.getBoundingClientRect();const dot=document.createElement("span");dot.className="shopping-flyer";dot.style.left=`${rect.left}px`;dot.style.top=`${rect.top}px`;document.body.append(dot);dot.animate([{transform:"translate(0,0)",opacity:1},{transform:`translate(${(end.left-rect.left)/2}px,${(end.top-rect.top)/2-60}px)`,opacity:1},{transform:`translate(${end.left-rect.left+28}px,${end.top-rect.top+20}px) scale(.3)`,opacity:0}],{duration:500}).onfinish=()=>dot.remove();}}act(()=>save(item,{checked:!item.checked}))}} aria-label={`${item.checked?'取消':'勾選'} ${item.name}`}><span className="material-symbols-outlined">check</span></button><div><span>本週一般 · {categoryLabel[item.category]}</span><strong>{item.name}</strong><small>{item.qty} {item.unit} · {item.status}</small></div><b>NT$ {item.estCost}</b><div className="shopping-card-actions"><button onClick={()=>ui.open(<AddShoppingModal item={item} onClose={ui.close}/>)}>編輯</button><button onClick={()=>act(()=>remove(item.id))}>刪除</button></div></article>)}</div>}</section>

    <section className="shopping-rescue"><header><div><p className="eyebrow">惜食救援軌</p><h3>順路補貨，讓即期食材接上下一餐</h3><small>只顯示冰箱中三天內需要優先照顧的食材</small></div><button onClick={()=>navigate("fridge")}>去看看</button></header>{rescued.length?<div>{rescued.map(item=><article key={item.id}><span className="rescue-icon"><IngredientIcon name={item.name} size={25}/></span><div><strong>{item.name}</strong><small>冰箱剩 {item.qty}{item.unit} · {item.daysLeft===0?"今天確認狀態":`還有 ${item.daysLeft} 天`}</small></div><button onClick={()=>navigate("fridge")}>查看冰箱</button></article>)}</div>:<p className="rescue-empty">冰箱目前沒有三天內到期的食材。</p>}</section>

    <footer className="shopping-basket" aria-live="polite"><span className="basket-icon material-symbols-outlined">shopping_basket<i>{checked.length}</i></span><div><small>已勾選 {checked.length} 項 · 任務 {taskDone}/{taskTotal} · 預估</small><strong>NT$ {checked.reduce((sum,item)=>sum+item.estCost,0)}</strong>{taskTotal>0&&<span className="basket-progress"><i style={{width:`${coverage}%`}}/></span>}</div><button disabled={!checked.length} onClick={openSettlement}>{activeTask?.status==="ready"?"完成並入庫":"完成這次採買"}</button></footer>
    {draft&&<div className="settlement-overlay" role="dialog" aria-modal="true"><section className="settlement-sheet"><div className="grab"/><header><p className="eyebrow">完成這次採買</p><h3>確認 {draft.length} 項入庫</h3><p>只入庫勾選的品項。任務項必須確認保存位置與期限。</p></header>
      {draft.map((line)=><div key={line.item.id} className="settle-line"><strong>{line.item.name}{line.item.shortageId?" · 任務":""}</strong>
        <label>數量<input type="number" min="0" step="0.5" value={line.actualQuantity} onChange={(event)=>patchDraft(line.item.id,{actualQuantity:Number(event.target.value)||0})}/></label>
        <label>單位<input value={line.actualUnit} onChange={(event)=>patchDraft(line.item.id,{actualUnit:event.target.value})}/></label>
        <label>實付<input type="number" min="0" value={line.actualPrice} onChange={(event)=>patchDraft(line.item.id,{actualPrice:Number(event.target.value)||0})}/></label>
        <label>保存<select value={line.storageLocation} onChange={(event)=>patchDraft(line.item.id,{storageLocation:event.target.value as DraftLine["storageLocation"]})}><option value="cold">冷藏</option><option value="frozen">冷凍</option><option value="pantry">常溫</option></select></label>
        <label>期限<input type="date" value={line.expiresOn} onChange={(event)=>patchDraft(line.item.id,{expiresOn:event.target.value})}/></label>
        {line.item.shortageId&&!line.expiresOn&&<small className="settle-warn">請確認期限，才能判斷是否可用於這一餐</small>}</div>)}
      <div className="settle-actions"><button className="ghost-btn" onClick={()=>setDraft(null)}>回清單調整</button><button className="primary-btn" disabled={busy||missingExpiry.length>0||draft.some((line)=>line.actualQuantity<=0)} onClick={commit}>確認入庫這 {draft.length} 項</button></div></section></div>}
    {resolution&&<div className="settlement-overlay" role="dialog" aria-modal="true"><section className="settlement-sheet"><div className="grab"/><header><p className="eyebrow">缺貨處理</p><h3>{resolution.task.shortages.find((item)=>item.id===resolution.shortageId)?.name} 找不到</h3><p>三種選擇都不會把未完成算成完成；替代後仍然要實際買到才會蓋章。</p></header>
      <div className="resolve-options">
        <button className={`resolve-opt ${resolution.mode==="replace"?"on":""}`} onClick={()=>setResolution({...resolution,mode:"replace"})}><b>換成替代食材</b><span>先預覽完整食譜，確認後重新計算缺口</span></button>
        <button className={`resolve-opt ${resolution.mode==="keep"?"on":""}`} onClick={()=>setResolution({...resolution,mode:"keep"})}><b>這次先不買，保留缺口</b><span>留下缺口，下次繼續買</span></button>
        <button className={`resolve-opt ${resolution.mode==="replan"?"on":""}`} onClick={()=>setResolution({...resolution,mode:"replan"})}><b>放棄這道菜，回 Today 重選</b><span>保留餐期與份數，回到今日重新選餐</span></button>
      </div>
      {resolution.mode==="replace"&&<div className="settle-line"><label>替代食材<input value={resolution.name} onChange={(event)=>{setResolution({...resolution,name:event.target.value});setAdjustment(null)}}/></label>
        <label>數量<input type="number" min="0" step="0.5" value={resolution.qty} onChange={(event)=>setResolution({...resolution,qty:Number(event.target.value)||0})}/></label>
        <label>單位<input value={resolution.unit} onChange={(event)=>setResolution({...resolution,unit:event.target.value})}/></label></div>}
      {resolution.mode==='replace'&&<><button className="primary-btn" disabled={busy||!resolution.name.trim()} onClick={previewReplacement}>{busy?'正在確認替代食譜…':'預覽替代食譜與步驟'}</button>{adjustment&&<section className="replacement-preview"><h4>{adjustment.adjustedRecipe.title}</h4><p>確認後才更新任務；替代品仍需實際入庫。</p><ul>{adjustment.adjustedRecipe.ingredients.map(i=><li key={i.ingredientKey}>{i.name} {i.quantity}{i.unit}</li>)}</ul><ol>{adjustment.adjustedRecipe.steps.map(step=><li key={step.id}>{step.instruction}</li>)}</ol></section>}</>}
      <div className="settle-actions"><button className="ghost-btn" onClick={()=>setResolution(null)}>取消</button><button className="primary-btn" disabled={busy||(resolution.mode==="replace"&&!adjustment)} onClick={submitResolution}>確認這個處理方式</button></div></section></div>}
  </div>;
}
