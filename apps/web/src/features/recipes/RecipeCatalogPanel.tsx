import { useContext, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { RecipeMode, RecipePreferences, RecipeRecommendations, RecipeRecommendation } from '@coocoo/contracts';
import { api, json } from '@/shared/api/client';
import { UiContext } from '@/app/ui-context';
import { useAppState, stateQueryKey } from '@/entities/app-state/model';
import { RecipePackageModal } from '@/features/cooking/RecipeModal';
import { Modal, ModalHeader } from '@/shared/ui/Modal';
import { adoptLegacyOperations, legacyOperations } from '@/shared/offline/recipe-packages';
import { syncOfflineOperations } from '@/shared/offline/sync';
import { purchaseReminderText } from './copy';

export function RecipeCatalogPanel(){
  const ui=useContext(UiContext),query=useQueryClient();const {data:state}=useAppState();
  const settings=useQuery({queryKey:['recipe-preferences',state?.session.user?.id],queryFn:()=>api<RecipePreferences>('/settings/recipes')});
  const [mode,setMode]=useState<RecipeMode>('inventory_only'),[override,setOverride]=useState<number|null>(null),[allowRepeat,setAllowRepeat]=useState(false);
  const [result,setResult]=useState<RecipeRecommendations|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const budget=override??settings.data?.purchaseBudget??100;
  const save=async()=>{if(!settings.data)throw new Error('請先載入個人設定');await api('/settings/recipes',json('PUT',{purchaseBudget:budget,expectedVersion:settings.data.version}));await settings.refetch();};
  const search=async()=>{setBusy(true);setError('');try{setResult(await api<RecipeRecommendations>('/recipes/recommendations',json('POST',{mode,purchaseBudget:budget,allowRepeat})));}catch(e){setError(e instanceof Error?e.message:'推薦未完成');}finally{setBusy(false);}};
  const changeMode=(value:RecipeMode)=>{setMode(value);setResult(null);};
  const choose=(item:RecipeRecommendation)=>{
    if(!item.missing.length){ui.open(<RecipePackageModal recipePackage={item.recipe} ingredientIds={[]} onClose={ui.close}/>);return;}
    ui.open(<PurchaseReminder item={item} budget={budget} allowRepeat={allowRepeat} goalName={state?.activeGoal?.name} onClose={ui.close} onUseInventory={()=>{ui.close();changeMode('inventory_only');}} onAdded={async()=>{await query.invalidateQueries({queryKey:stateQueryKey});ui.close();ui.toast('已加入購物清單；完成採買入庫後再開始料理。');setResult(null);}}/>);
  };
  return <section className="rounded-3xl border border-outline-variant/30 bg-white p-md space-y-sm" aria-label="食譜庫推薦">
    <h3 className="text-lg font-extrabold text-slate-blue">今天想怎麼煮？</h3>
    <div className="flex gap-sm"><button className={mode==='inventory_only'?'primary-btn':'secondary-btn'} onClick={()=>changeMode('inventory_only')}>只用現有食材</button><button className={mode==='small_purchase'?'primary-btn':'secondary-btn'} onClick={()=>changeMode('small_purchase')}>少量補買</button></div>
    <p className="text-xs text-on-surface-variant">調味料也依庫存判斷；少量補買最多 2 種，參考價格不代表商店即時售價。</p>
    {mode==='small_purchase'&&<div><label className="field-label">本次補買預算（NT$）<input className="field" type="number" min="0" max="100000" value={budget} onChange={e=>{setOverride(Number(e.target.value));setResult(null);}}/></label><button className="secondary-btn mt-sm" disabled={busy||!settings.data} onClick={()=>{void save().then(()=>ui.toast('已儲存預設預算')).catch(e=>setError(e.message));}}>儲存為預設</button><p className="text-xs mt-sm">{settings.data?.confirmed?'當次調整不會覆寫個人預設；只有按「儲存為預設」才會更新。':'首次帶入 NT$100；可以直接用於本次搜尋，只有按「儲存為預設」才會跨裝置保存。'}</p></div>}
    <label className="flex gap-2 text-xs"><input type="checkbox" checked={allowRepeat} onChange={e=>{setAllowRepeat(e.target.checked);setResult(null);}}/>也接受最近 7 天吃過或已安排的菜色</label>
    <button className="primary-btn" disabled={busy||!Number.isInteger(budget)||budget<0} onClick={()=>void search()}>{busy?'正在找食譜…':mode==='small_purchase'?'用這次預算找食譜':'找符合條件的食譜'}</button>
    {(error||settings.error)&&<p role="alert" className="text-sm text-error">{error||'食譜庫設定目前無法載入，請稍後再試。'}</p>}
    {result&&<><p className="text-xs">{result.notice}</p>{result.eligible.slice(0,6).map(item=><article className="rounded-2xl bg-surface-container-low p-md" key={item.recipe.id}><strong>{item.recipe.title}</strong><p className="text-xs my-sm">{item.recipe.servings} 人份 · {item.recipe.totalMinutes} 分鐘 · {item.missing.length?`補買估計 NT$${item.estimatedPurchaseCost}`:'現有食材足夠'}</p><button className="secondary-btn" onClick={()=>choose(item)}>{item.missing.length?'選擇這道，查看補買':'查看料理步驟'}</button><ReportRecipe id={item.recipe.catalogVersionId!}/></article>)}{result.needsConfirmation.length>0&&<div><h4 className="font-bold">預算／庫存待確認</h4>{result.needsConfirmation.slice(0,6).map(item=><p className="text-xs my-sm" key={item.recipe.id}>{item.recipe.title}：{item.issues.join('、')||'缺少有效參考價格'}。請先確認資料；目前不列為符合預算的方案。</p>)}</div>}</>}
    <OfflineImportAndConflicts userId={state?.session.user?.id}/>
  </section>;
}
function PurchaseReminder({item,budget,allowRepeat,goalName,onClose,onUseInventory,onAdded}:{item:RecipeRecommendation;budget:number;allowRepeat:boolean;goalName?:string;onClose:()=>void;onUseInventory:()=>void;onAdded:()=>Promise<void>}){
 const [operationId]=useState(()=>crypto.randomUUID());const [busy,setBusy]=useState(false),[error,setError]=useState('');
 return <Modal label="補買前確認" onClose={onClose}><ModalHeader title="多一個選擇，也留意這次支出" onClose={onClose}/><p className="text-sm leading-6">{purchaseReminderText(item.estimatedPurchaseCost,goalName)}</p><ul className="my-md space-y-sm">{item.missing.map(i=><li key={i.ingredientKey}>{i.name}：需用 {i.quantity} {i.unit}，補買 {i.packages} 包裝（共 {i.purchaseQuantity} {i.unit}），估計 NT$ {i.estimatedCost}</li>)}</ul>{error&&<p role="alert" className="text-error">{error}</p>}<div className="flex gap-sm mt-md"><button disabled={busy} className="secondary-btn" onClick={onUseInventory}>改用現有食材</button><button disabled={busy} className="primary-btn" onClick={async()=>{setBusy(true);try{await api(`/recipes/${item.recipe.catalogVersionId}/purchases`,json('POST',{operationId,purchaseBudget:budget,allowRepeat}));await onAdded();}catch(e){setError(e instanceof Error?e.message:'加入清單失敗');}finally{setBusy(false);}}}>加入購物清單</button></div></Modal>;
}
function ReportRecipe({id}:{id:string}){const [open,setOpen]=useState(false),[message,setMessage]=useState(''),[safety,setSafety]=useState(false),[notice,setNotice]=useState('');return <div className="mt-sm text-xs"><button onClick={()=>setOpen(!open)}>回報食譜問題</button>{open&&<div><label>問題說明<textarea className="field" value={message} onChange={e=>setMessage(e.target.value)}/></label><label><input type="checkbox" checked={safety} onChange={e=>setSafety(e.target.checked)}/>可能涉及食安</label><button className="secondary-btn" disabled={!message.trim()} onClick={async()=>{try{await api(`/recipes/${id}/report`,json('POST',{message,safety}));setNotice('已收到回報');setOpen(false);}catch(e){setNotice(e instanceof Error?e.message:'回報失敗');}}}>送出回報</button></div>}<p role="status">{notice}</p></div>;}
function OfflineImportAndConflicts({userId}:{userId?:string}){const query=useQuery({queryKey:['legacy-offline',userId],enabled:Boolean(userId),queryFn:async()=>({legacy:await legacyOperations(),conflicts:await api<Array<{id:string;kind:string;message:string;created_at:string}>>('/sync/conflicts').catch(()=>[])})});const [busy,setBusy]=useState(false),[notice,setNotice]=useState('');if(!userId||!query.data||(!query.data.legacy.length&&!query.data.conflicts.length))return null;return <aside className="rounded-2xl bg-surface-container-low p-md text-xs"><strong>跨裝置同步待確認</strong>{query.data.legacy.length>0&&<div><p>這台裝置有 {query.data.legacy.length} 筆舊版離線料理紀錄。預覽時間：</p><ul>{query.data.legacy.map(item=><li key={item.id}>{new Date(item.createdAt).toLocaleString('zh-TW')} · 料理完成</li>)}</ul><button className="secondary-btn mt-sm" disabled={busy} onClick={async()=>{setBusy(true);try{const adopted=await adoptLegacyOperations(userId,query.data!.legacy.map(item=>item.id));const synced=await syncOfflineOperations();setNotice(synced===adopted?'已依你的確認匯入並同步。':'已依你的確認歸戶；網路恢復後會繼續同步。');await query.refetch();}finally{setBusy(false);}}}>確認匯入這些紀錄</button></div>}{query.data.conflicts.map(conflict=><div key={conflict.id} className="mt-sm"><p>{conflict.message}</p><button className="secondary-btn" onClick={async()=>{await api(`/sync/conflicts/${conflict.id}/acknowledge`,json('POST',{}));await query.refetch();}}>我已確認</button></div>)}<p role="status">{notice}</p></aside>}
