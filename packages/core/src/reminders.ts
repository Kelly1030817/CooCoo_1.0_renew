import type { ReminderPreferences } from "@coocoo/contracts";
export type ReminderKind="expiring"|"planned"|"rhythm";
export interface ReminderDelivery{kind:ReminderKind;sentAt:string;weekStart:string}
const enabled=(kind:ReminderKind,p:ReminderPreferences)=>kind==="expiring"?p.expiringIngredients:kind==="planned"?p.plannedMeals:p.weeklyRhythm;
export function canSendReminder(kind:ReminderKind,preferences:ReminderPreferences,history:ReminderDelivery[],now:Date,weekStart:string){
  if(!preferences.pushEnabled||!enabled(kind,preferences))return false;
  const hour=Number(new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Taipei",hour:"2-digit",hour12:false}).format(now));
  if(hour>=21||hour<9)return false;
  const week=history.filter((item)=>item.weekStart===weekStart);
  return week.length<preferences.weeklyLimit&&!week.some((item)=>item.kind===kind);
}
