import type { IngredientPrice } from '@coocoo/contracts';

const DAY_MS = 86_400_000;

export function referencePriceStatus(prices: IngredientPrice[], now = new Date()) {
  let stalePriceCount = 0;
  let expiringPriceCount = 0;
  for (const price of prices) {
    const ageDays = (now.getTime() - Date.parse(price.observedAt)) / DAY_MS;
    if (!Number.isFinite(ageDays) || ageDays < 0 || ageDays > 30) stalePriceCount += 1;
    else if (ageDays >= 23) expiringPriceCount += 1;
  }
  return { stalePriceCount, expiringPriceCount };
}

export function catalogAdminAlerts(input: {
  spentTwd: number;
  reservedTwd: number;
  budgetTwd: number;
  lastRunAt: string | null;
  failedJobCount: number;
  stalePriceCount: number;
  expiringPriceCount: number;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const alerts: string[] = [];
  if (input.budgetTwd > 0 && input.spentTwd + input.reservedTwd >= input.budgetTwd * 0.8) {
    alerts.push(`食譜 AI 額度已達 80%（NT$${(input.spentTwd + input.reservedTwd).toFixed(2)} / NT$${input.budgetTwd.toFixed(2)}）`);
  }
  if (!input.lastRunAt || now.getTime() - Date.parse(input.lastRunAt) > 2 * 3_600_000) {
    alerts.push('排程尚未執行或超過兩小時未回報');
  }
  if (input.failedJobCount > 0) alerts.push(`${input.failedJobCount} 個食譜工作失敗，請查看錯誤並決定是否重審`);
  if (input.stalePriceCount > 0) alerts.push(`${input.stalePriceCount} 筆參考價格已過期或日期異常，暫時不能判定符合預算`);
  if (input.expiringPriceCount > 0) alerts.push(`${input.expiringPriceCount} 筆參考價格將在 7 天內到期`);
  return alerts;
}
