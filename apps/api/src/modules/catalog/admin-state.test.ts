import { describe, expect, test } from 'bun:test';
import { catalogAdminAlerts, referencePriceStatus } from './admin-state';

describe('catalog owner monitoring', () => {
  test('separates stale prices from prices that expire within seven days', () => {
    const result = referencePriceStatus([
      { id:'fresh', ingredientKey:'蛋', name:'蛋', packageQuantity:10, unit:'顆', price:80, source:'https://example.com/fresh', observedAt:'2026-09-01T00:00:00Z' },
      { id:'soon', ingredientKey:'豆腐', name:'豆腐', packageQuantity:1, unit:'盒', price:35, source:'https://example.com/soon', observedAt:'2026-08-15T00:00:00Z' },
      { id:'stale', ingredientKey:'洋蔥', name:'洋蔥', packageQuantity:1, unit:'顆', price:30, source:'https://example.com/stale', observedAt:'2026-08-01T00:00:00Z' },
    ], new Date('2026-09-08T00:00:00Z'));
    expect(result).toEqual({ stalePriceCount: 1, expiringPriceCount: 1 });
  });

  test('alerts on the real operating budget, failures, heartbeat and price maintenance', () => {
    expect(catalogAdminAlerts({
      spentTwd: 39,
      reservedTwd: 1,
      budgetTwd: 50,
      lastRunAt: '2026-09-08T05:00:00Z',
      failedJobCount: 2,
      stalePriceCount: 1,
      expiringPriceCount: 3,
      now: new Date('2026-09-08T08:00:01Z'),
    })).toEqual([
      '食譜 AI 額度已達 80%（NT$40.00 / NT$50.00）',
      '排程尚未執行或超過兩小時未回報',
      '2 個食譜工作失敗，請查看錯誤並決定是否重審',
      '1 筆參考價格已過期或日期異常，暫時不能判定符合預算',
      '3 筆參考價格將在 7 天內到期',
    ]);
  });
});
