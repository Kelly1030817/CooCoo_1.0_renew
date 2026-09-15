import type { HabitBarrier, OnboardingProfile } from "@coocoo/contracts";
import { CookingPot } from "lucide-react";
import { Choice } from "./Choice";
import { StepCard } from "./StepCard";

const barriers: Array<[HabitBarrier, string]> = [
  ["no_ideas", "常常沒想法"],
  ["low_energy", "下班沒力氣"],
  ["no_time", "時間不固定"],
  ["ingredients_waste", "食材容易放壞"],
  ["cleanup", "不想收拾"],
];

export type OnboardingStep2Props = {
  profile: OnboardingProfile;
  cookwareOptions: string[];
  customCookware: string;
  onUpdate: (patch: Partial<OnboardingProfile>) => void;
  onToggleCookware: (value: string) => void;
  onCustomCookwareChange: (value: string) => void;
  onAddCustomCookware: () => void;
  onToggleBarrier: (value: HabitBarrier) => void;
};

export function OnboardingStep2({
  profile,
  cookwareOptions,
  customCookware,
  onUpdate,
  onToggleCookware,
  onCustomCookwareChange,
  onAddCustomCookware,
  onToggleBarrier,
}: OnboardingStep2Props) {
  return (
    <>
      <div className="chef-open">
        <span className="chef-open-icon" aria-hidden="true">
          <CookingPot />
        </span>
        <div>
          <strong>我先確認你真的能用什麼來煮。</strong>
          <p>份量、廚具與日常卡點會直接影響我能推薦哪些料理。</p>
        </div>
      </div>
      <StepCard className="step2-household" title="通常幾人吃？">
        <div className="onboarding-counter">
          <span>人份</span>
          <div>
            <button
              type="button"
              onClick={() =>
                onUpdate({ householdServings: Math.max(1, profile.householdServings - 1) })
              }
            >
              −
            </button>
            <strong>{profile.householdServings}</strong>
            <button
              type="button"
              onClick={() =>
                onUpdate({ householdServings: Math.min(12, profile.householdServings + 1) })
              }
            >
              +
            </button>
          </div>
        </div>
      </StepCard>
      <StepCard
        className="step2-cookware"
        title="可用廚具"
        description="至少選一項；其他廚具也能自行新增。"
      >
        <div className="choices">
          {cookwareOptions.map((value) => (
            <Choice
              key={value}
              selected={profile.cookware.some((item) => item.type === value)}
              onClick={() => onToggleCookware(value)}
            >
              {value}
            </Choice>
          ))}
        </div>
        <div className="tag-input">
          <input
            name="custom-cookware"
            maxLength={24}
            placeholder="例如：卡式爐、蒸烤箱"
            value={customCookware}
            onChange={(event) => onCustomCookwareChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onAddCustomCookware();
              }
            }}
          />
          <button type="button" disabled={!customCookware.trim()} onClick={onAddCustomCookware}>
            ＋
          </button>
        </div>
        <div className="tag-list">
          {profile.cookware
            .filter((item) => !cookwareOptions.includes(item.type))
            .map((item) => (
              <span className="tag" key={item.type}>
                {item.type}
                <button
                  type="button"
                  aria-label={`移除 ${item.type}`}
                  onClick={() => onToggleCookware(item.type)}
                >
                  ×
                </button>
              </span>
            ))}
        </div>
      </StepCard>
      <StepCard title="最常卡在哪裡？" description="可多選。這會決定我第一則提醒的方式。">
        <div className="choices">
          {barriers.map(([value, label]) => (
            <Choice
              key={value}
              selected={profile.habitBarriers.includes(value)}
              onClick={() => onToggleBarrier(value)}
            >
              {label}
            </Choice>
          ))}
        </div>
      </StepCard>
    </>
  );
}
