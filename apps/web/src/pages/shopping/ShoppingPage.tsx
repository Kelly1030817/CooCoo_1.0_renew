import { useContext, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ShoppingItem } from "@coocoo/contracts";
import { useAppState, stateQueryKey } from "@/entities/app-state/model";
import { UiContext } from "@/app/ui-context";
import { api, json } from "@/shared/api/client";
import { AddShoppingModal, InvoiceModal, ShoppingAssistantModal, VoiceInputModal } from "@/features/shopping/ShoppingModals";
import "./ShoppingPage.css";

const categoryLabel:Record<ShoppingItem["category"],string>={produce:"蔬果",protein:"蛋白質",pantry:"常備品",other:"其他"};
export function ShoppingPage(){
  const {data}=useAppState();const ui=useContext(UiContext);const query=useQueryClient();
  useEffect(()=>{void api('/health').catch(()=>undefined)},[]);
  if(!data)return null;
  const refresh=()=>query.invalidateQueries({queryKey:stateQueryKey});
  const save=async(item:ShoppingItem,patch:Partial<ShoppingItem>)=>{await api(`/shopping-items/${item.id}`,json("PATCH",{...item,...patch}));await refresh()};
  const remove=async(id:string)=>{await api(`/shopping-items/${id}`,{method:"DELETE"});await refresh()};
  const checked=data.shoppingItems.filter(item=>item.checked);
  const restock=async()=>{if(!checked.length)return ui.toast("請先勾選實際買到的食材","warning");const result=await api<{count:number}>("/shopping/restock",{method:"POST"});await refresh();ui.toast(`已將 ${result.count} 項原子化入庫，未勾選品項繼續保留`)};
  return <div className="shopping-mobile"><section className="shopping-heading"><div><p className="eyebrow">市場陪伴</p><h2>只買這週<br/>真的用得到的。</h2></div><button onClick={()=>ui.open(<AddShoppingModal onClose={ui.close}/>)}>＋ 手動新增</button></section>
    <section className="shopping-entry-grid"><button onClick={()=>ui.open(<ShoppingAssistantModal onClose={ui.close}/>) }><span>✦</span><strong>AI 陪我逛</strong><small>依餐單與庫存建議份量</small></button><button onClick={()=>ui.open(<InvoiceModal onClose={ui.close}/>) }><span>▣</span><strong>掃描發票</strong><small>確認後直接入庫</small></button><button onClick={()=>ui.open(<VoiceInputModal onClose={ui.close}/>) }><span>●</span><strong>用說的新增</strong><small>也可以直接打字</small></button></section>
    <section className="shopping-list"><header><div><p className="eyebrow">本週採買單</p><h3>{data.shoppingItems.length} 項 · 已買到 {checked.length} 項</h3></div><button onClick={async()=>{const shouldCheck=!data.shoppingItems.every(item=>item.checked);await Promise.all(data.shoppingItems.map(item=>save(item,{checked:shouldCheck})))}}>全選</button></header>{data.shoppingItems.length===0?<div className="empty-shopping">清單是空的。先從「今日」選一道餐，或手動新增食材。</div>:<div className="shopping-cards">{data.shoppingItems.map(item=><article key={item.id} className={item.checked?"checked":""}><button className="shopping-check" onClick={()=>save(item,{checked:!item.checked})} aria-label={`${item.checked?'取消':'勾選'} ${item.name}`}>{item.checked?'✓':''}</button><div><span>{categoryLabel[item.category]}</span><strong>{item.name}</strong><small>{item.qty} {item.unit} · {item.status}</small></div><b>NT$ {item.estCost}</b><div className="shopping-card-actions"><button onClick={()=>ui.open(<AddShoppingModal item={item} onClose={ui.close}/>)}>編輯</button><button onClick={()=>remove(item.id)}>刪除</button></div></article>)}</div>}
    <footer><div><small>已勾選預估</small><strong>NT$ {checked.reduce((sum,item)=>sum+item.estCost,0)}</strong></div><button disabled={!checked.length} onClick={restock}>完成補貨並入庫</button></footer></section>
  </div>;
}
