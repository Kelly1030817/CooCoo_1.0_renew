import type { OnboardingProfile } from "@coocoo/contracts";
import { ChefSignature } from "./ChefSignature";

interface PassportTicketProps {
  profile: OnboardingProfile;
  isStamped: boolean;
  isSealDropped?: boolean;
  isFlying?: boolean;
}

export function PassportTicket({
  profile,
  isStamped,
  isSealDropped = isStamped,
  isFlying = false,
}: PassportTicketProps) {
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
          COOCOO CHEF PROFILE
        </span>
        <span className="text-[10px] font-mono text-stone-400">NO. 88209</span>
      </div>

      {/* Chef Profile */}
      <div>
        <span className="text-[10px] text-stone-400 font-bold block">主廚檔案</span>
        <h3 className="text-base font-black text-stone-900 leading-snug">
          初火學徒
        </h3>
        <span className="text-xs font-mono font-black text-amber-900">
          從 0 EXP 開始
        </span>
      </div>

      {/* Parameters Summary */}
      <dl className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-stone-100">
        <div>
          <dt className="text-stone-400 text-[10px] font-bold">每週自煮</dt>
          <dd className="font-bold text-stone-800">{profile.weeklyGoalTarget} {profile.primaryGoalMetric === "cooking_sessions" ? "次" : "份"} / 週</dd>
        </div>
        <div>
          <dt className="text-stone-400 text-[10px] font-bold">料理指引</dt>
          <dd className="font-bold text-stone-800">{profile.guidanceMode === "detailed" ? "詳細" : "精簡"}</dd>
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

      {/* Shockwave Impact Stamp (Scheme B: 現代工坊圓章) */}
      {isSealDropped && (
        <>
          <div
            className="animate-stamp-impact-circle absolute right-2.5 bottom-2 w-20 h-20 rounded-full border-2 border-red-700 text-red-700 bg-[#fdfaf7]/95 flex flex-col items-center justify-center shadow-md select-none transform rotate-[-9deg] z-20 pointer-events-none"
            aria-label="MASTER CHEF COOCOO SEALED"
          >
            <span className="sr-only">主廚檔案已成立 MASTER CHEF COOCOO SEALED</span>
            <div className="w-[70px] h-[70px] rounded-full border border-dashed border-red-600/70 flex flex-col items-center justify-center relative p-1">
              <div className="text-[6.5px] font-black tracking-widest uppercase text-red-800 flex items-center gap-0.5">
                <svg className="w-2 h-2 text-red-700" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span>COOCOO</span>
                <svg className="w-2 h-2 text-red-700" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div className="my-0.5 px-2 py-0.5 bg-red-700 text-white rounded-xs text-[7.5px] font-black tracking-wider uppercase">
                SEALED
              </div>
              <div className="text-[6.5px] font-mono tracking-tight text-red-700 font-bold">
                NO. 88209 · 立約
              </div>
            </div>
          </div>
          <div
            className="shockwave-ring absolute right-4 bottom-3 w-18 h-18 rounded-full border-4 border-red-500/60 pointer-events-none"
            aria-hidden="true"
          />
        </>
      )}
    </div>
  );
}
