import type { OnboardingProfile } from "@coocoo/contracts";
import { UtensilsCrossed } from "lucide-react";
import { Choice } from "./Choice";
import { StepCard } from "./StepCard";
import { hasRestriction, restrictionQuickOptions } from "./restrictions";

export type OnboardingStep1Props = {
  profile: OnboardingProfile;
  flavorInput: string;
  restrictionInput: string;
  onUpdate: (patch: Partial<OnboardingProfile>) => void;
  onFlavorInputChange: (value: string) => void;
  onAddFlavor: () => void;
  onToggleHardRestriction: (option: (typeof restrictionQuickOptions)[number]) => void;
  onRestrictionInputChange: (value: string) => void;
  onAddRestriction: () => void;
};

export function OnboardingStep1({
  profile,
  flavorInput,
  restrictionInput,
  onUpdate,
  onFlavorInputChange,
  onAddFlavor,
  onToggleHardRestriction,
  onRestrictionInputChange,
  onAddRestriction,
}: OnboardingStep1Props) {
  return (
    <>
      <div className="chef-open">
        <span className="chef-open-icon" aria-hidden="true">
          <UtensilsCrossed />
        </span>
        <div>
          <strong>Hi！我是你的專屬主廚 CooCoo。</strong>
          <p>沒有標準答案，我們只想讓第一次推薦更可行。你的回答會決定我怎麼挑菜、怎麼排餐。</p>
        </div>
      </div>
      <StepCard title="平常可用時間">
        <div className="slider-row">
          <input
            name="available-minutes"
            type="range"
            min="5"
            max="180"
            step="5"
            value={profile.availableMinutes}
            onChange={(event) => onUpdate({ availableMinutes: Number(event.target.value) })}
          />
          <strong>{profile.availableMinutes} 分鐘</strong>
        </div>
      </StepCard>
      <StepCard title="常用餐期">
        <div className="choices three">
          {(
            [
              ["breakfast", "早餐"],
              ["lunch", "午餐"],
              ["dinner", "晚餐"],
            ] as const
          ).map(([value, label]) => (
            <Choice
              key={value}
              selected={profile.plannedMealSlots.includes(value)}
              onClick={() =>
                onUpdate({
                  plannedMealSlots: profile.plannedMealSlots.includes(value)
                    ? profile.plannedMealSlots.filter((item) => item !== value)
                    : [...profile.plannedMealSlots, value],
                })
              }
            >
              {label}
            </Choice>
          ))}
        </div>
      </StepCard>
      <StepCard title="喜歡的口味">
        <div className="tag-input">
          <input
            value={flavorInput}
            placeholder="例如：清爽、台式、微辣"
            onChange={(event) => onFlavorInputChange(event.target.value)}
          />
          <button type="button" disabled={!flavorInput.trim()} onClick={onAddFlavor}>
            ＋
          </button>
        </div>
        <div className="tag-list">
          {profile.preferredFlavors.map((flavor) => (
            <span className="tag" key={flavor}>
              {flavor}
              <button
                type="button"
                aria-label={`移除 ${flavor}`}
                onClick={() =>
                  onUpdate({
                    preferredFlavors: profile.preferredFlavors.filter((item) => item !== flavor),
                  })
                }
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </StepCard>
      <StepCard
        title="過敏原或絕對不吃"
        description="可多選常見過敏原，其他項目也能自行新增；全部都會成為硬限制。"
      >
        <div className="restriction-chip-grid" aria-label="常見過敏原快選">
          {restrictionQuickOptions.map((option) => {
            const selected = hasRestriction(profile.restrictions, option);
            return (
              <button
                type="button"
                className={`restriction-chip ${selected ? "selected" : ""}`}
                aria-pressed={selected}
                key={option.id}
                onClick={() => onToggleHardRestriction(option)}
              >
                <span>{option.label}</span>
                <i aria-hidden="true">✓</i>
              </button>
            );
          })}
        </div>
        <div className="tag-input restriction-input">
          <input
            name="dietary-restrictions"
            maxLength={24}
            placeholder="其他不能吃，例如：香菜"
            value={restrictionInput}
            onChange={(event) => onRestrictionInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onAddRestriction();
              }
            }}
          />
          <button
            type="button"
            disabled={!restrictionInput.trim()}
            aria-label="新增其他不能吃的食物"
            onClick={onAddRestriction}
          >
            ＋
          </button>
        </div>
        <div className="tag-list">
          {profile.restrictions
            .filter(
              (item) =>
                !restrictionQuickOptions.some(
                  (option) => option.id === item.id || option.label === item.label,
                ),
            )
            .map((item) => (
              <span className="tag" key={item.id}>
                {item.label}
                <button
                  type="button"
                  aria-label={`移除 ${item.label}`}
                  onClick={() =>
                    onUpdate({
                      restrictions: profile.restrictions.filter(
                        (restriction) => restriction.id !== item.id,
                      ),
                    })
                  }
                >
                  ×
                </button>
              </span>
            ))}
        </div>
        <p className="safety-note">
          硬限制會寫入 dietary_restrictions，所有推薦與 AI 調整都必須遵守。
        </p>
      </StepCard>
    </>
  );
}
