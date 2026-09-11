import { describe,expect,test } from 'vitest';
import { purchaseReminderText } from './copy';

describe('small-purchase reminder',()=>{
  test('states price uncertainty and MealTask behavior',()=>{
    const text=purchaseReminderText(86);
    expect(text).toContain('NT$ 86');
    expect(text).toContain('價格為參考值');
    expect(text).toContain('實際結帳可能不同');
    expect(text).toContain('不會發放 EXP');
    expect(text).toContain('MealTask');
  });
});
