import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { EquipmentRadar } from "./EquipmentRadar";
import { ChefAvatar } from "./ChefAvatar";
import { PassportTicket } from "./PassportTicket";
import { emptyOnboardingDraft } from "../../shared/model/onboarding-draft";
import { suggestWeeklyGoalTarget } from "./weekly-goal";

describe("Chef Consultation Components", () => {
  test("weekly goal suggestion is current frequency plus one within the supported range",()=>{
    expect(suggestWeeklyGoalTarget(0)).toBe(1);
    expect(suggestWeeklyGoalTarget(1)).toBe(2);
    expect(suggestWeeklyGoalTarget(21)).toBe(21);
  });
  test("EquipmentRadar renders correct unlocked recipe counts without emoji", () => {
    const html = renderToStaticMarkup(<EquipmentRadar cookwareCount={2} />);
    expect(html).toContain("裝備適配度雷達");
    expect(html).toContain("已解鎖約 28 道專屬料理包");
    // Ensure 100% SVG (no emoji)
    expect(html).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u);
  });

  test("ChefAvatar renders living mood label and SVG eyes", () => {
    const html = renderToStaticMarkup(<ChefAvatar mood="applause" isNodding={true} />);
    expect(html).toContain("主廚 CooCoo");
    expect(html).toContain("CooCoo 給讚！");
    expect(html).toContain("chef-eyes");
    expect(html).toContain("chef-nodding");
  });

  test("PassportTicket renders chef profile, signature, and stamp when sealed", () => {
    const profile = {
      ...emptyOnboardingDraft,
      weeklyGoalTarget: 3,
      householdServings: 1,
      cookware: [{ type: "電鍋", limitations: [] }],
      restrictions: [{ id: "r1", label: "甲殼類", kind: "allergy" as const, ingredientKeys: ["甲殼類"], isHardLimit: true }],
    };

    const unstampedHtml = renderToStaticMarkup(<PassportTicket profile={profile} isStamped={false} />);
    expect(unstampedHtml).toContain("COOCOO CHEF PROFILE");
    expect(unstampedHtml).toContain("初火學徒");
    expect(unstampedHtml).toContain("從 0 EXP 開始");
    expect(unstampedHtml).toContain("Cedarville Cursive");
    expect(unstampedHtml).not.toContain("sig-mask-anim");
    expect(unstampedHtml).not.toContain("重播簽名");
    expect(unstampedHtml).not.toContain("主廚檔案已成立");

    // Phase 1 & 2: Signature and gold underline sweeping, seal not dropped yet
    const signingOnlyHtml = renderToStaticMarkup(
      <PassportTicket profile={profile} isStamped={true} isSealDropped={false} />,
    );
    expect(signingOnlyHtml).toContain("sig-mask-anim");
    expect(signingOnlyHtml).not.toContain("MASTER CHEF COOCOO SEALED");
    expect(signingOnlyHtml).not.toContain("shockwave-ring");

    // Phase 3: Stamp impacts with shockwave
    const stampedHtml = renderToStaticMarkup(
      <PassportTicket profile={profile} isStamped={true} isSealDropped={true} />,
    );
    expect(stampedHtml).toContain("sig-mask-anim");
    expect(stampedHtml).not.toContain("重播簽名");
    expect(stampedHtml).toContain("主廚檔案已成立");
    expect(stampedHtml).toContain("MASTER CHEF COOCOO SEALED");
    expect(stampedHtml).toContain("shockwave-ring");

    const flyingHtml = renderToStaticMarkup(
      <PassportTicket profile={profile} isStamped={true} isSealDropped={true} isFlying={true} />,
    );
    expect(flyingHtml).toContain("ticket-flying-active");
    expect(flyingHtml).toContain("flight-aura");
    expect(flyingHtml).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u);
  });

  test("hasSavedOnboardingDraft accurately detects stored drafts", async () => {
    const store = new Map<string, string>();
    const mockStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { store.set(k, String(v)); },
      removeItem: (k: string) => { store.delete(k); },
      clear: () => { store.clear(); },
    };
    (globalThis as any).localStorage = mockStorage;

    const { hasSavedOnboardingDraft, saveOnboardingDraft, ONBOARDING_DRAFT_STORAGE_KEY } = await import(
      "../../shared/model/onboarding-draft"
    );
    mockStorage.removeItem(ONBOARDING_DRAFT_STORAGE_KEY);
    expect(hasSavedOnboardingDraft()).toBe(false);

    saveOnboardingDraft({
      ...emptyOnboardingDraft,
      currentStep: 5,
      status: "draft",
    });
    expect(hasSavedOnboardingDraft()).toBe(true);

    const stored = JSON.parse(mockStorage.getItem(ONBOARDING_DRAFT_STORAGE_KEY) || "{}");
    expect(stored.currentStep).toBe(5);
    expect(stored.status).toBe("draft");
  });
});
