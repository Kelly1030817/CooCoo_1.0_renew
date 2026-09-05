import type { OnboardingProfile } from "@coocoo/contracts";

export const KNOWN_COOKWARE_TYPES = [
  "電磁爐",
  "瓦斯爐",
  "微波爐",
  "電鍋",
  "氣炸鍋",
  "小烤箱",
] as const;

type CookwareDraft = OnboardingProfile["cookware"][number];
const knownCookware = new Set<string>(KNOWN_COOKWARE_TYPES);

export function getCustomCookware(cookware: CookwareDraft[]) {
  return cookware.find((item) => !knownCookware.has(item.type));
}

export function setCustomCookwareName(cookware: CookwareDraft[], name: string) {
  const known = cookware.filter((item) => knownCookware.has(item.type));
  const custom = getCustomCookware(cookware);
  const normalizedName = name.trim().slice(0, 40);
  if (!normalizedName) return known;
  return [
    ...known,
    {
      ...custom,
      type: normalizedName,
      limitations: custom?.limitations ?? [],
    },
  ];
}
