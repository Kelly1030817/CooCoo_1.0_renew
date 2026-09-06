import { describe,expect,test } from 'vitest';
import { purchaseReminderText } from './copy';

describe('small-purchase reminder',()=>{
  test('states the goal impact, price uncertainty and no automatic deduction',()=>{
    const text=purchaseReminderText(86,'北海道旅行');
    expect(text).toContain('NT$ 86');
    expect(text).toContain('「北海道旅行」');
    expect(text).toContain('圓夢時間稍微延後');
    expect(text).toContain('實際結帳可能不同');
    expect(text).toContain('不會自動扣除圓夢金額');
  });
});
