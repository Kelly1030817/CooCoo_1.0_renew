import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { EquipmentRadar } from "./EquipmentRadar";
import { ChefAvatar } from "./ChefAvatar";
import { PassportTicket } from "./PassportTicket";
import { emptyOnboardingDraft } from "../../shared/model/onboarding-draft";

describe("Chef Consultation Components", () => {
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

  test("PassportTicket renders dream info, Cedarville cursive SVG signature, and stamp when sealed", () => {
    const profile = {
      ...emptyOnboardingDraft,
      dreamName: "冬天去北海道看初雪",
      dreamTargetAmount: 30000,
      weeklyHomeCookTarget: 3,
      dailyMealBudget: 240,
      householdServings: 1,
      cookware: [{ type: "電鍋", limitations: [] }],
      restrictions: [{ id: "r1", label: "甲殼類", kind: "allergy" as const, ingredientKeys: ["甲殼類"], isHardLimit: true }],
    };

    const unstampedHtml = renderToStaticMarkup(<PassportTicket profile={profile} isStamped={false} />);
    expect(unstampedHtml).toContain("COOCOO DREAM PASSPORT");
    expect(unstampedHtml).toContain("冬天去北海道看初雪");
    expect(unstampedHtml).toContain("NT$ 30,000");
    expect(unstampedHtml).toContain("Cedarville Cursive");
    expect(unstampedHtml).not.toContain("sig-mask-anim");
    expect(unstampedHtml).not.toContain("重播簽名");
    expect(unstampedHtml).not.toContain("圓夢契約已立");

    const stampedHtml = renderToStaticMarkup(<PassportTicket profile={profile} isStamped={true} />);
    expect(stampedHtml).toContain("sig-mask-anim");
    expect(stampedHtml).not.toContain("重播簽名");
    expect(stampedHtml).toContain("圓夢契約已立");
    expect(stampedHtml).toContain("MASTER CHEF COOCOO SEALED");
    expect(stampedHtml).toContain("shockwave-ring");

    const flyingHtml = renderToStaticMarkup(<PassportTicket profile={profile} isStamped={true} isFlying={true} />);
    expect(flyingHtml).toContain("ticket-flying-active");
    expect(flyingHtml).toContain("flight-aura");
    expect(flyingHtml).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u);
  });
});
