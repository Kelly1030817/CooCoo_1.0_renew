import type { OnboardingProfile } from "@coocoo/contracts";
import { Award } from "lucide-react";
import { StepCard } from "./StepCard";
import { PassportTicket } from "./PassportTicket";

export type AuthStatus = "loading" | "signed-in" | "signed-out";

export type OnboardingStep3Props = {
  profile: OnboardingProfile;
  authStatus: AuthStatus;
  supabaseConfigured: boolean;
  step: number;
  stamped: boolean;
  sealDropped: boolean;
  onGoogleSignIn: (step: number) => void;
};

export function OnboardingStep3({
  profile,
  authStatus,
  supabaseConfigured,
  step,
  stamped,
  sealDropped,
  onGoogleSignIn,
}: OnboardingStep3Props) {
  return (
    <>
      <div className="chef-open">
        <span className="chef-open-icon" aria-hidden="true">
          <Award />
        </span>
        <div>
          <strong>最後一步，登入並成立你的主廚檔案。</strong>
          <p>同步設定後蓋章啟程；這一步不會建立、清空或修改冰箱庫存。</p>
        </div>
      </div>
      <StepCard title="登入並同步主廚檔案" description="設定會跟著帳號，不會只留在這台裝置。">
        {supabaseConfigured && authStatus === "loading" && (
          <p className="safety-note">正在確認登入狀態…</p>
        )}
        {supabaseConfigured && authStatus === "signed-out" && (
          <button type="button" className="wide-action" onClick={() => onGoogleSignIn(step)}>
            <span>使用 Google 登入</span>
            <span>›</span>
          </button>
        )}
        {authStatus === "signed-in" && (
          <p className="safety-note safe">
            {supabaseConfigured
              ? "登入完成，主廚設定可以安全同步。"
              : "本機 Preview 使用測試資料；正式環境會先要求登入。"}
          </p>
        )}
      </StepCard>
      <p className="safety-note safe">食材與保存期限請在完成設定後，前往「冰箱」頁新增或管理。</p>
      <PassportTicket
        profile={{ ...profile, weeklyGoalTarget: 1 }}
        isStamped={stamped}
        isSealDropped={sealDropped}
      />
    </>
  );
}
