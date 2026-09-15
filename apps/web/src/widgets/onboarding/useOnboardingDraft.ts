import { useState } from "react";
import type { HabitBarrier, OnboardingProfile } from "@coocoo/contracts";
import {
  emptyOnboardingDraft,
  readOnboardingDraft,
  saveOnboardingDraft,
} from "@/shared/model/onboarding-draft";
import { addCustomRestriction, restrictionQuickOptions, toggleRestriction } from "./restrictions";
import { resolveOnboardingStep } from "./useOnboardingStep";

const cookwareOptions = ["電磁爐", "瓦斯爐", "電鍋", "快煮鍋", "氣炸鍋", "微波爐"];

export type UseOnboardingDraftOptions = {
  initialStep?: number;
};

export function useOnboardingDraft({ initialStep }: UseOnboardingDraftOptions = {}) {
  const saved = readOnboardingDraft();
  const startingStep = resolveOnboardingStep(initialStep, saved.currentStep);
  const [profile, setProfile] = useState<OnboardingProfile>({
    ...emptyOnboardingDraft,
    ...saved,
    currentStep: startingStep,
  });
  const [customCookware, setCustomCookware] = useState("");
  const [restrictionInput, setRestrictionInput] = useState("");
  const [flavorInput, setFlavorInput] = useState("");

  const update = (patch: Partial<OnboardingProfile>) => {
    const next = { ...profile, ...patch };
    setProfile(next);
    saveOnboardingDraft(next);
  };

  const addFlavor = () => {
    const value = flavorInput.trim();
    if (!value || profile.preferredFlavors.includes(value)) return false;
    update({ preferredFlavors: [...profile.preferredFlavors, value] });
    setFlavorInput("");
    return true;
  };

  const addRestriction = () => {
    const next = addCustomRestriction(profile.restrictions, restrictionInput);
    if (next === profile.restrictions) return false;
    update({ restrictions: next });
    setRestrictionInput("");
    return true;
  };

  const toggleHardRestriction = (option: (typeof restrictionQuickOptions)[number]) => {
    update({ restrictions: toggleRestriction(profile.restrictions, option) });
  };

  const toggleCookware = (value: string) => {
    update({
      cookware: profile.cookware.some((item) => item.type === value)
        ? profile.cookware.filter((item) => item.type !== value)
        : [...profile.cookware, { type: value, limitations: [] }],
    });
  };

  const addCustomCookware = () => {
    const value = customCookware.trim();
    if (!value || profile.cookware.some((item) => item.type === value)) return;
    toggleCookware(value);
    setCustomCookware("");
  };

  const toggleBarrier = (value: HabitBarrier) => {
    update({
      habitBarriers: profile.habitBarriers.includes(value)
        ? profile.habitBarriers.filter((item) => item !== value)
        : [...profile.habitBarriers, value],
    });
  };

  return {
    profile,
    update,
    customCookware,
    setCustomCookware,
    restrictionInput,
    setRestrictionInput,
    flavorInput,
    setFlavorInput,
    addFlavor,
    addRestriction,
    toggleHardRestriction,
    toggleCookware,
    addCustomCookware,
    toggleBarrier,
    cookwareOptions,
  };
}
