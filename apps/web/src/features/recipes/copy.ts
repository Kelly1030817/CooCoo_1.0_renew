export function purchaseReminderText(amount:number|null,goalName?:string){
  return `這道食譜需要補買約 NT$ ${amount??'待確認'} 的食材。這筆支出可能降低本週可存入${goalName?`「${goalName}」`:'圓夢目標'}的金額，讓圓夢時間稍微延後。價格為參考值，實際結帳可能不同；系統不會自動扣除圓夢金額。要加入購物清單嗎？`;
}
