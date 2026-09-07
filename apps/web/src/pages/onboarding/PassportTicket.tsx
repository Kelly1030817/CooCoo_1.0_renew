import type { OnboardingProfile } from "@coocoo/contracts";
import { ChefSignature } from "./ChefSignature";

interface PassportTicketProps {
  profile: OnboardingProfile;
  isStamped: boolean;
  isFlying?: boolean;
}

export function PassportTicket({ profile, isStamped, isFlying = false }: PassportTicketProps) {
  const cookwareDisplay = profile.cookware.map((c) => c.type).join("、") || "基本鍋具";
  const restrictionsDisplay = profile.restrictions.map((r) => r.label).join("、") || "無特殊禁忌";

  return (
    <div
      className={`animate-ticket-fold bg-white rounded-2xl border-2 border-stone-800 p-4 shadow-md space-y-3 relative text-left transform-gpu transition-all ${
        isFlying ? "ticket-flying-active overflow-visible" : "overflow-hidden"
      }`}
    >
      <div className="flight-aura" aria-hidden="true" />

      {/* Ticket Header */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-2">
        <span className="font-black text-stone-900 text-[11px] tracking-wider uppercase">
          COOCOO DREAM PASSPORT
        </span>
        <span className="text-[10px] font-mono text-stone-400">NO. 88209</span>
      </div>

      {/* Dream Plan */}
      <div>
        <span className="text-[10px] text-stone-400 font-bold block">圓夢計畫</span>
        <h3 className="text-base font-black text-stone-900 leading-snug">
          {profile.dreamName || "首個自煮願望"}
        </h3>
        <span className="text-xs font-mono font-black text-amber-900">
          NT$ {profile.dreamTargetAmount.toLocaleString()}
        </span>
      </div>

      {/* Parameters Summary */}
      <dl className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-stone-100">
        <div>
          <dt className="text-stone-400 text-[10px] font-bold">每週自煮</dt>
          <dd className="font-bold text-stone-800">{profile.weeklyHomeCookTarget} 餐 / 週</dd>
        </div>
        <div>
          <dt className="text-stone-400 text-[10px] font-bold">每日餐費</dt>
          <dd className="font-bold text-stone-800">NT$ {profile.dailyMealBudget}</dd>
        </div>
        <div>
          <dt className="text-stone-400 text-[10px] font-bold">常用份量</dt>
          <dd className="font-bold text-stone-800">{profile.householdServings} 人份</dd>
        </div>
        <div>
          <dt className="text-stone-400 text-[10px] font-bold">不能吃</dt>
          <dd className="font-bold text-red-800 truncate" title={restrictionsDisplay}>
            {restrictionsDisplay}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-stone-400 text-[10px] font-bold">烹飪裝備</dt>
          <dd className="font-bold text-stone-800 truncate" title={cookwareDisplay}>
            {cookwareDisplay}
          </dd>
        </div>
      </dl>

      {/* Signature & Verification */}
      <div className="pt-2 border-t border-dashed border-stone-200 flex justify-between items-end">
        <ChefSignature runAnimation={isStamped} />
        <span className="text-[10px] font-mono text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
          VERIFIED
        </span>
      </div>

      {/* Shockwave Impact Stamp */}
      {isStamped && (
        <>
          <div className="animate-stamp-impact absolute right-3 bottom-3 border-2 border-red-700 text-red-700 bg-white/95 px-3 py-1.5 rounded-md font-black text-xs tracking-widest text-center shadow-md select-none z-10">
            <div className="flex items-center gap-1 justify-center">
              <svg
                className="w-3.5 h-3.5 text-red-700"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>圓夢契約已立</span>
            </div>
            <span className="text-[7px] font-mono tracking-normal block text-red-600/80">
              MASTER CHEF COOCOO SEALED
            </span>
          </div>
          <div
            className="shockwave-ring absolute right-8 bottom-5 w-20 h-20 rounded-full border-4 border-red-500/60 pointer-events-none"
            aria-hidden="true"
          />
        </>
      )}
    </div>
  );
}
