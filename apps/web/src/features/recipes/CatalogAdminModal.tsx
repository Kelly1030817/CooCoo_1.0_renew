import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { CatalogAdminState, IngredientPrice } from '@coocoo/contracts';
import { api, json } from '@/shared/api/client';
import { Modal, ModalHeader } from '@/shared/ui/Modal';

const emptyPrice = () => ({
  ingredientKey: '', name: '', packageQuantity: 1, unit: '克', price: 0,
  source: '', observedAt: new Date().toISOString().slice(0, 10),
});

function freshness(price: IngredientPrice) {
  const age = Math.floor((Date.now() - Date.parse(price.observedAt)) / 86_400_000);
  if (!Number.isFinite(age) || age < 0) return '日期異常';
  if (age > 30) return '已過期';
  if (age >= 23) return `剩 ${30 - age} 天到期`;
  return `有效，已查價 ${age} 天`;
}

export function CatalogAdminModal({ onClose }: { onClose: () => void }) {
  const q = useQuery({ queryKey: ['catalog-admin'], queryFn: () => api<CatalogAdminState>('/admin/recipes') });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [priceId, setPriceId] = useState<string | null>(null);
  const [price, setPrice] = useState(emptyPrice);
  const act = async (path: string, body: unknown, method = 'POST') => {
    setBusy(true); setError('');
    try { await api(path, json(method, body)); await q.refetch(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : '操作失敗'); }
    finally { setBusy(false); }
  };
  const savePrice = async () => {
    await act('/admin/recipes/prices', {
      ...price, id: priceId || crypto.randomUUID(), observedAt: `${price.observedAt}T00:00:00+08:00`,
    } satisfies IngredientPrice, 'PUT');
    setPriceId(null); setPrice(emptyPrice());
  };

  return <Modal label="食譜管理" onClose={onClose} wide>
    <ModalHeader title="食譜與自動更新管理" onClose={onClose}/>
    {q.error && <p role="alert">無法載入，請確認管理者權限與資料庫版本。</p>}
    {q.data && <div className="space-y-md">
      <section className="rounded-2xl bg-surface-container-low p-md text-sm">
        <strong>{q.data.month} 自動更新狀態</strong>
        <p>本月候選 {q.data.candidateCount}/{q.data.candidateLimit}</p>
        <p>實際 NT${q.data.spentTwd.toFixed(2)} · 預留 NT${q.data.reservedTwd.toFixed(2)} · 月額度 NT${q.data.catalogBudgetTwd.toFixed(2)}</p>
        <p>OpenRouter 共用：實際 NT${q.data.globalSpentTwd.toFixed(2)} · 預留 NT${q.data.globalReservedTwd.toFixed(2)} · 月額度 NT${q.data.globalBudgetTwd.toFixed(2)}</p>
        {q.data.interactiveUsage.map(item=><p className="text-xs" key={item.feature}>{({shopping_analysis:'採買陪逛',recipe_generation:'即時食譜',receipt_ocr:'收據辨識'})[item.feature]}：NT${item.spentTwd.toFixed(2)} + 預留 NT${item.reservedTwd.toFixed(2)} / NT${item.budgetTwd.toFixed(2)}；每人每日 {item.dailyUserLimit} 次</p>)}
        <p className="text-xs">最近排程回報：{q.data.lastRunAt || '尚未執行'}。無回報不能視為自動更新已啟用。</p>
        <p className="text-xs">失敗工作 {q.data.failedJobCount} · 過期價格 {q.data.stalePriceCount} · 7 天內到期 {q.data.expiringPriceCount}</p>
      </section>
      {q.data.alerts.map(alert => <p key={alert} role="alert" className="text-error">{alert}</p>)}
      <button className="primary-btn" disabled={busy} onClick={() => void act('/admin/recipes/control', { paused: !q.data!.paused }, 'PUT')}>
        {q.data.paused ? '啟用已部署的排程' : '暫停新增生成'}
      </button>

      <details open={q.data.stalePriceCount > 0 || q.data.expiringPriceCount > 0}>
        <summary>食材參考價格（{q.data.prices.length} 筆）</summary>
        <p className="text-xs my-sm">填入可追溯資料；來源必須是 https 網址或 receipt: 憑證說明。第 23 天起提醒，超過 30 天停止預算判定。</p>
        {(['ingredientKey', 'name', 'unit', 'source', 'observedAt'] as const).map(key => <label className="field-label" key={key}>
          {({ ingredientKey:'食材識別名稱', name:'顯示名稱', unit:'包裝內容單位', source:'來源網址或 receipt: 憑證說明', observedAt:'查價日期' })[key]}
          <input className="field" type={key === 'observedAt' ? 'date' : 'text'} value={price[key]} onChange={event => setPrice({ ...price, [key]: event.target.value })}/>
        </label>)}
        <label className="field-label">每包裝內容量<input className="field" type="number" min="0.001" value={price.packageQuantity} onChange={event => setPrice({ ...price, packageQuantity:Number(event.target.value) })}/></label>
        <label className="field-label">每包裝參考價 NT$<input className="field" type="number" min="0" value={price.price} onChange={event => setPrice({ ...price, price:Number(event.target.value) })}/></label>
        <button className="secondary-btn" disabled={busy} onClick={() => void savePrice()}>{priceId ? '儲存價格修訂' : '新增參考價格'}</button>
        {priceId && <button className="secondary-btn" disabled={busy} onClick={() => { setPriceId(null); setPrice(emptyPrice()); }}>取消修訂</button>}
        {q.data.prices.map(item => <div key={item.id} className="rounded-xl bg-white p-sm text-xs my-sm">
          <strong>{item.name}</strong> · {item.packageQuantity}{item.unit} / NT${item.price}
          <p>{item.observedAt.slice(0,10)} · {freshness(item)}</p>
          {item.source.startsWith('https://') ? <a href={item.source} target="_blank" rel="noreferrer">查看價格來源</a> : <span>{item.source}</span>}
          <button className="secondary-btn" onClick={() => { setPriceId(item.id); setPrice({ ...item, observedAt:item.observedAt.slice(0,10) }); }}>帶入修訂</button>
        </div>)}
      </details>

      <details open={q.data.failedJobCount > 0}>
        <summary>本月工作紀錄（{q.data.jobs.length} 筆）</summary>
        {q.data.jobs.map(job => <div key={job.id} className="rounded-xl bg-surface-container-low p-sm text-xs my-sm">
          <strong>{job.status}</strong> · 嘗試 {job.attempts}/3 · {job.createdAt}
          {job.error && <p className="text-error">{job.error}</p>}
        </div>)}
      </details>

      <details><summary>使用者回報（{q.data.reports.length} 筆）</summary>
        {q.data.reports.map(report => <article key={report.id} className="rounded-2xl bg-surface-container-low p-md my-sm">
          <strong>{report.safety ? '食安回報' : '品質回報'} · {report.title}</strong>
          <p className="text-xs">{report.message}</p>
          <small>{report.createdAt} · {report.processedAt ? '已觸發處理' : '累積門檻中'}</small>
        </article>)}
      </details>

      <div>{q.data.versions.map(version => <article key={version.id} className="rounded-2xl bg-surface-container-low p-md my-sm">
        <strong>{version.recipe.title}</strong>
        <p className="text-xs">{({ candidate:'候選', published:'已發布', quarantined:'隔離待審', rejected:'未通過' })[version.status]} · {version.createdAt}</p>
        <p className="text-xs">{version.reasons.join('、')}</p>
        <details><summary>查看此版本</summary><pre className="whitespace-pre-wrap text-xs">{JSON.stringify(version.recipe, null, 2)}</pre></details>
        <button className="secondary-btn" disabled={busy || version.status === 'quarantined'} onClick={() => void act(`/admin/recipes/${version.id}/quarantine`, { reason:'管理者暫停推薦' })}>暫停推薦</button>
        {version.status !== 'published' && <button className="secondary-btn" disabled={busy} onClick={() => void act(`/admin/recipes/${version.id}/review`, {})}>建立修訂並重新品檢</button>}
      </article>)}</div>
    </div>}
    {error && <p role="alert" className="text-error">{error}</p>}
  </Modal>;
}
