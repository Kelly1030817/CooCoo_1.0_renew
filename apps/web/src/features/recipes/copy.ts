export function purchaseReminderText(amount:number|null){
  return `這道食譜需要補買約 NT$ ${amount??'待確認'} 的食材。價格為參考值，實際結帳可能不同；加入清單不會發放 EXP，完成採買入庫後才會讓 MealTask 進入可料理狀態。要加入購物清單嗎？`;
}
