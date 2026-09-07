import { useContext, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { ShoppingAnalysis, ShoppingItem } from '@coocoo/contracts'
import { UiContext } from '@/app/ui-context'
import { Modal, ModalHeader } from '@/shared/ui/Modal'
import { api, json } from '@/shared/api/client'
import { stateQueryKey } from '@/entities/app-state/model'

export function AddShoppingModal({onClose,item}:{onClose:()=>void;item?:ShoppingItem}){const ui=useContext(UiContext);const query=useQueryClient();return <Modal label="新增待採買食材" onClose={onClose}><ModalHeader title={item?'編輯待採買食材':'新增待採買食材'} onClose={onClose}/><form onSubmit={async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const value={name:String(f.get('name')),category:String(f.get('category')),qty:Number(f.get('qty')),unit:String(f.get('unit')),estCost:Number(f.get('estCost')),checked:item?.checked||false,status:item?.status||'手動新增'};await api(item?`/shopping-items/${item.id}`:'/shopping-items',json(item?'PATCH':'POST',value));await query.invalidateQueries({queryKey:stateQueryKey});onClose();ui.toast(item?'採買項目已更新':'食材已加入採買清單')}} className="grid grid-cols-2 gap-md"><label className="col-span-2 text-xs font-bold text-on-surface-variant">食材名稱<input className="field" name="name" defaultValue={item?.name} required/></label><label className="text-xs font-bold text-on-surface-variant">分類<select className="field" name="category" defaultValue={item?.category||'produce'}><option value="produce">新鮮蔬果</option><option value="protein">蛋白質與乳製品</option></select></label><label className="text-xs font-bold text-on-surface-variant">數量<input className="field" type="number" name="qty" defaultValue={item?.qty||1}/></label><label className="text-xs font-bold text-on-surface-variant">單位<input className="field" name="unit" defaultValue={item?.unit||'包'}/></label><label className="text-xs font-bold text-on-surface-variant">預估金額<input className="field" type="number" name="estCost" defaultValue={item?.estCost||50}/></label><button className="primary-btn col-span-2 mt-md">確認{item?'更新':'加入'}</button></form></Modal>}

export function VoiceInputModal({onClose}:{onClose:()=>void}){const [text,setText]=useState('');const [status,setStatus]=useState('也可以直接打字');const [parsed,setParsed]=useState<ShoppingItem[]>([]);const query=useQueryClient();const ui=useContext(UiContext);const listen=()=>{const SpeechRecognition=(window as typeof window&{webkitSpeechRecognition?:new()=>{lang:string;start:()=>void;onresult:(event:{results:ArrayLike<ArrayLike<{transcript:string}>>})=>void;onerror:()=>void}}).webkitSpeechRecognition;if(!SpeechRecognition){setStatus('這個瀏覽器不支援語音，請直接打字');return}const recognition=new SpeechRecognition();recognition.lang='zh-TW';recognition.onresult=event=>{setText(event.results[0][0].transcript);setStatus('已收到，請確認文字')};recognition.onerror=()=>setStatus('語音暫時不可用，請直接打字');recognition.start();setStatus('正在聽…')};const parse=async()=>setParsed(await api('/shopping/parse',json('POST',{text})));const add=async()=>{for(const item of parsed)await api('/shopping-items',json('POST',item));await query.invalidateQueries({queryKey:stateQueryKey});onClose();ui.toast(`已匯入 ${parsed.length} 項食材`)};return <Modal label="語音輸入採買" onClose={onClose}><ModalHeader title="用說的建立採買單" onClose={onClose}/><button onClick={listen} className="voice-capture"><span className="material-symbols-outlined">mic</span><strong>{status}</strong></button><textarea value={text} onChange={e=>setText(e.target.value)} placeholder="例如：雞蛋兩盒、番茄三顆" className="field min-h-24"/><button disabled={!text.trim()} onClick={parse} className="secondary-btn mt-md w-full">解析內容</button>{parsed.length>0&&<div className="mt-md space-y-xs">{parsed.map(item=><div key={item.id} className="rounded-xl bg-surface-container-low p-sm text-xs"><strong>{item.name}</strong> · {item.qty}{item.unit}</div>)}<button onClick={add} className="primary-btn mt-sm w-full">匯入以上項目</button></div>}</Modal>}

type RecognizedItem={id:string;name:string;quantity:number;unit:string;unit_price:number;actual_price:number;storage_location:'cold'|'frozen'|'pantry'|null;expires_on:string|null;confidence:{name:number;quantity:number;unitPrice:number;actualPrice:number}}
type RecognizedReceipt={id:string;purchased_on:string|null;receipt_items:RecognizedItem[]}
export function InvoiceModal({onClose}:{onClose:()=>void}){const query=useQueryClient();const ui=useContext(UiContext);const [file,setFile]=useState<File|null>(null);const [receipt,setReceipt]=useState<RecognizedReceipt|null>(null);const [items,setItems]=useState<RecognizedItem[]>([]);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const upload=async()=>{if(!file)return;setBusy(true);setError('');try{const form=new FormData();form.append('image',file);const created=await api<{id:string}>('/receipts',{method:'POST',body:form});const result=await api<RecognizedReceipt>(`/receipts/${created.id}/recognize`,{method:'POST'});setReceipt(result);setItems(result.receipt_items)}catch(reason){setError(reason instanceof Error?reason.message:'發票辨識失敗')}finally{setBusy(false)}};const patchItem=(id:string,patch:Partial<RecognizedItem>)=>setItems(current=>current.map(item=>item.id===id?{...item,...patch}:item));const confirm=async()=>{if(!receipt||items.some(item=>!item.storage_location||!item.expires_on))return;setBusy(true);try{await api(`/receipts/${receipt.id}/confirm`,json('POST',{items:items.map(item=>({id:item.id,name:item.name,quantity:item.quantity,unit:item.unit,unitPrice:item.unit_price,actualPrice:item.actual_price,storageLocation:item.storage_location,expiresOn:item.expires_on}))}));await query.invalidateQueries({queryKey:stateQueryKey});onClose();ui.toast(`已確認 ${items.length} 項並直接入庫`)}catch(reason){setError(reason instanceof Error?reason.message:'入庫失敗');setBusy(false)}};return <Modal label="掃描發票" onClose={onClose} wide><ModalHeader title="拍下有品項明細的發票" kicker="真實 Gemini OCR · 逐項確認後入庫" onClose={onClose}/>{!receipt&&<><label className="receipt-drop"><span className="material-symbols-outlined">document_scanner</span><strong>{file?.name||'拍照或選擇發票圖片'}</strong><small>JPEG、PNG、WebP，最多 10MB；純 QR 與手寫單不支援</small><input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={event=>setFile(event.target.files?.[0]||null)}/></label><button disabled={!file||busy} onClick={upload} className="primary-btn mt-md w-full">{busy?'正在安全上傳並辨識…':'開始辨識'}</button></>}{receipt&&<div className="receipt-review"><p>購買日期：{receipt.purchased_on||'未辨識，請在品項確認時補充'}</p>{items.map(item=><div key={item.id} className={Math.min(...Object.values(item.confidence))<.7?'low-confidence':''}><label>品名<input className="field" value={item.name} onChange={event=>patchItem(item.id,{name:event.target.value})}/></label><div className="receipt-row"><label>數量<input className="field" type="number" value={item.quantity} onChange={event=>patchItem(item.id,{quantity:Number(event.target.value)})}/></label><label>單位<input className="field" value={item.unit} onChange={event=>patchItem(item.id,{unit:event.target.value})}/></label><label>實付<input className="field" type="number" value={item.actual_price} onChange={event=>patchItem(item.id,{actual_price:Number(event.target.value)})}/></label></div><div className="receipt-row"><label>保存<select className="field" value={item.storage_location||''} onChange={event=>patchItem(item.id,{storage_location:event.target.value as RecognizedItem['storage_location']})}><option value="">請選擇</option><option value="cold">冷藏</option><option value="frozen">冷凍</option><option value="pantry">常溫</option></select></label><label>建議期限<input className="field" type="date" value={item.expires_on||''} onChange={event=>patchItem(item.id,{expires_on:event.target.value})}/></label></div>{Math.min(...Object.values(item.confidence))<.7&&<small>橘色欄位代表辨識信心較低，請特別確認。</small>}</div>)}<button disabled={busy||items.some(item=>!item.storage_location||!item.expires_on)} onClick={confirm} className="primary-btn w-full">確認全部並直接入庫</button></div>}{error&&<p role="alert" className="offline-error">{error}。原圖已保留時可稍後重試或手動輸入。</p>}</Modal>}

const shoppingActionLabel = {
  buy_now: "這次買",
  buy_later: "晚點補",
  skip: "先不要買",
} as const;

export function ShoppingAssistantModal({ onClose }: { onClose: () => void }) {
  const [result, setResult] = useState<ShoppingAnalysis | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const analyze = async () => {
    setBusy(true);
    setError("");
    try {
      setResult(await api<ShoppingAnalysis>("/shopping/analyze", json("POST", {operationId:crypto.randomUUID()})));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "採買分析暫時無法使用");
    } finally {
      setBusy(false);
    }
  };

  return <Modal label="AI 陪我逛" onClose={onClose}>
    <ModalHeader title="AI 陪我逛" kicker="採買決策助手" onClose={onClose} />
    <p className="rounded-2xl bg-surface-container-low p-md text-xs leading-5 text-on-surface-variant">
      CooCoo 會一起參考採買單、冰箱庫存、飲食限制、餐費預算與每週自煮目標。
    </p>
    <button disabled={busy} onClick={analyze} className="primary-btn mt-md w-full">
      {busy ? "正在請 AI 分析…" : "分析目前採買單"}
    </button>
    {result ? <div className="mt-md rounded-2xl border border-secondary/20 bg-secondary/10 p-md">
      <div className="flex items-start justify-between gap-sm">
        <strong className="text-sm text-secondary">{result.summary}</strong>
        <small className="shrink-0 rounded-full bg-white/70 px-2 py-1 text-[10px] font-bold text-on-surface-variant">
          {result.source === "openrouter" ? "AI 分析" : "安全規則"}
        </small>
      </div>
      <ul className="mt-sm space-y-sm text-xs text-on-surface-variant">
        {result.recommendations.map(({ item, action, reason }) => <li key={item.id} className="rounded-xl bg-white/60 p-sm">
          <div className="flex justify-between gap-sm"><strong>{item.name}</strong><span>{shoppingActionLabel[action]} · NT$ {item.estCost}</span></div>
          <p className="mt-1 leading-5">{reason}</p>
        </li>)}
      </ul>
      <p className="mt-sm text-xs font-bold text-secondary">這次建議購買：約 NT$ {result.estimatedTotal}</p>
      {result.notice ? <p className="mt-sm text-[11px] leading-5 text-on-surface-variant">{result.notice}</p> : null}
    </div> : null}
    {error ? <p role="alert" className="offline-error">{error}</p> : null}
  </Modal>;
}
