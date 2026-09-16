import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import {
  OnboardingProfileSchema,
  type HabitBarrier,
  type OnboardingProfile,
} from "@coocoo/contracts";
import {
  emptyOnboardingDraft,
  readOnboardingDraft,
  saveOnboardingDraft,
} from "@/shared/model/onboarding-draft";
import { addCustomRestriction, restrictionQuickOptions, toggleRestriction } from "./restrictions";
import { resolveOnboardingStep } from "./useOnboardingStep";

const cookwareOptions = ["電磁爐", "瓦斯爐", "電鍋", "快煮鍋", "氣炸鍋", "微波爐"];

function isOnboardingProfileKey(key: string): key is keyof OnboardingProfile {
  return key in emptyOnboardingDraft;
}

export type UseOnboardingDraftOptions = {
  initialStep?: number;
};

export function useOnboardingDraft({ initialStep }: UseOnboardingDraftOptions = {}) {
  const saved = readOnboardingDraft();
  const startingStep = resolveOnboardingStep(initialStep, saved.currentStep);
  const form = useForm<OnboardingProfile>({
    resolver: typeboxResolver(OnboardingProfileSchema),
    defaultValues: {
      ...emptyOnboardingDraft,
      ...saved,
      currentStep: startingStep,
    },
    mode: "onSubmit",
  });
  const profile = form.watch();
  const [customCookware, setCustomCookware] = useState("");
  const [restrictionInput, setRestrictionInput] = useState("");
  const [flavorInput, setFlavorInput] = useState("");

  useEffect(() => {
    const { unsubscribe } = form.watch(() => {
      saveOnboardingDraft({ ...emptyOnboardingDraft, ...form.getValues() });
    });
    return unsubscribe;
  }, [form]);

  const update = (patch: Partial<OnboardingProfile>) => {
    for (const key of Object.keys(patch)) {
      if (!isOnboardingProfileKey(key)) continue;
      const value = patch[key];
      if (value === undefined) continue;
      form.setValue(key, value, { shouldDirty: true });
    }
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
    const cookwareName = customCookware.trim();
    if (!cookwareName || profile.cookware.some((item) => item.type === cookwareName)) return;
    toggleCookware(cookwareName);
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
    form,
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
