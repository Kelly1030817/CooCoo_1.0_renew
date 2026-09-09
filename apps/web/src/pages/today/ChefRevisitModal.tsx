import { useState, useRef, useEffect } from "react";
import { Modal } from "../../shared/ui/Modal";
import {
  LOW_ENERGY_EMERGENCY_RECIPE,
  checkEmergencyIngredients,
  findEmergencyRecipeRestriction,
  hasCompatibleEmergencyCookware,
} from "../../features/cooking/emergencyRecipe";
import type { DietaryRestriction, RecipePackage } from "@coocoo/contracts";

export interface ActionButtonConfig {
  label: string;
  onClick: () => void | Promise<void>;
  variant?: "primary" | "secondary";
  icon?: "play" | "cart";
}

interface ChefRevisitModalProps {
  onClose: () => void;
  onSelectLowEnergy: () => void;
  onStartCooking?: (customRecipe?: RecipePackage) => void;
  inventoryNames?: string[];
  restrictions?: DietaryRestriction[];
  cookwareTypes?: string[];
  weeklyTarget?: number;
  onAdjustTarget?: (newTarget: number) => Promise<void>;
  onRecordTakeout?: () => Promise<string>;
  outsideMealPrice?: number;
}

interface MessageItem {
  id: string;
  sender: "chef" | "user";
  text: string;
  actionType?: "tired" | "adjust" | "takeout";
  actionButton?: ActionButtonConfig;
  actionButtons?: ActionButtonConfig[];
  timestamp?: string;
}

export function ChefRevisitModal({
  onClose,
  onSelectLowEnergy,
  onStartCooking,
  inventoryNames = ["雞蛋", "青江菜"],
  restrictions = [],
  cookwareTypes = [],
  weeklyTarget = 3,
  onAdjustTarget,
  onRecordTakeout,
  outsideMealPrice = 150,
}: ChefRevisitModalProps) {
  const [messages, setMessages] = useState<MessageItem[]>(() => {
    const fridgeItems =
      inventoryNames.length > 0
        ? inventoryNames.slice(0, 2).join("與")
        : "雞蛋與鮮蔬";
    return [
      {
        id: "intro",
        sender: "chef",
        text: `哈囉！我是主廚 CooCoo。我看了一下你的冰箱，冷藏庫還有「${fridgeItems}」，建議優先使用。今晚想以什麼節奏來準備晚餐呢？`,
        timestamp: "剛剛",
      },
    ];
  });

  const [isPending, setIsPending] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const streamEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
    streamEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isPending, showQuickActions]);

  const handleAction = (type: "tired" | "adjust" | "takeout") => {
    if (typeof window !== "undefined" && window.navigator?.vibrate) {
      window.navigator.vibrate(10);
    }

    setShowQuickActions(false);

    let userText = "";
    if (type === "tired") userText = "今天體力透支了，給我最簡單的 12 分鐘低體力餐！";
    if (type === "adjust") userText = "這週臨時聚餐多，自煮想少煮 1 餐，目標順延。";
    if (type === "takeout") userText = "今晚改外食，調整今天的餐單。";

    const userMsg: MessageItem = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: userText,
      timestamp: "剛剛",
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsPending(true);

    setTimeout(() => {
      const finish = (chefMsg: MessageItem) => {
        setMessages((prev) => [...prev, chefMsg]);
        setIsPending(false);
      };

      if (type === "tired") {
        onSelectLowEnergy();
        const blockedBy = findEmergencyRecipeRestriction(restrictions);
        if (blockedBy) {
          finish({
            id: `chef-${Date.now()}`,
            sender: "chef",
            actionType: "tired",
            text: `主廚 CooCoo 已切換為低體力模式，但固定快手料理含有「${blockedBy.label}」限制的食材，因此不會派發或開啟這道料理。請關閉相談室，查看後端重新檢核過飲食限制的安全候選。`,
            timestamp: "剛剛",
          });
          return;
        }

        if (!hasCompatibleEmergencyCookware(cookwareTypes)) {
          finish({
            id: `chef-${Date.now()}`,
            sender: "chef",
            actionType: "tired",
            text: "主廚 CooCoo 已切換為低體力模式，但這道固定料理需要可搭配平底鍋或湯鍋的直接加熱設備；你目前登記的廚具不相容，因此不會派發或開啟。請關閉相談室，查看後端重新檢核廚具的安全候選。",
            timestamp: "剛剛",
          });
          return;
        }

        const { isFullyCovered, missing } = checkEmergencyIngredients(inventoryNames);
        if (isFullyCovered) {
          finish({
            id: `chef-${Date.now()}`,
            sender: "chef",
            actionType: "tired",
            text: "主廚 CooCoo 收到！已為你切換為「低體力模式」：\n步驟 ≤ 4、單鍋到底、免繁複備料。\n冰箱冷藏庫剛好有齊全食材，為你調派 11 分鐘保底快手菜「麻油焦香煎蛋湯麵」，善終冰箱食材，收拾只要洗一個鍋！",
            actionButton: onStartCooking
              ? {
                  label: "離線料理包已備妥 · 跟著主廚做 ➔",
                  variant: "primary",
                  icon: "play",
                  onClick: () => {
                    onClose();
                    onStartCooking(LOW_ENERGY_EMERGENCY_RECIPE);
                  },
                }
              : undefined,
            timestamp: "剛剛",
          });
          return;
        }

        const missingNames = missing.map((item) => item.name).join("、");
        const fridgeStatus = inventoryNames.length === 0
          ? "目前冰箱尚無食材"
          : `目前冰箱缺少「${missingNames}」`;
        finish({
          id: `chef-${Date.now()}`,
          sender: "chef",
          actionType: "tired",
          text: `主廚 CooCoo 收到！已為你切換為「低體力模式」：\n為你調派 11 分鐘單鍋「麻油焦香煎蛋湯麵」（步驟 ≤ 4、一鍋到底）。\n\n主廚檢視冰箱，${fridgeStatus}。\n若手邊確實有這些食材，可以直接開始；否則請關閉相談室，透過「少量補買」查看費用並確認後再加入採買清單。`,
          actionButtons: [
            {
              label: "自備食材 · 直接跟著主廚做 ➔",
              variant: "primary",
              icon: "play",
              onClick: () => {
                onClose();
                onStartCooking?.(LOW_ENERGY_EMERGENCY_RECIPE);
              },
            },
            {
              label: "關閉後查看少量補買",
              variant: "secondary",
              icon: "cart",
              onClick: onClose,
            },
          ],
          timestamp: "剛剛",
        });
        return;
      }

      if (type === "adjust") {
        const nextTarget = Math.max(1, weeklyTarget - 1);
        if (!onAdjustTarget) {
          finish({
            id: `chef-${Date.now()}`,
            sender: "chef",
            actionType: "adjust",
            text: "主廚 CooCoo：這次沒有可更新的圓夢目標，因此尚未變更本週餐數。請先完成目標設定。",
            timestamp: "剛剛",
          });
          return;
        }
        void onAdjustTarget(nextTarget)
          .then(() => finish({
            id: `chef-${Date.now()}`,
            sender: "chef",
            actionType: "adjust",
            text: `主廚 CooCoo：完全沒問題！已將本週自煮目標儲存為 ${nextTarget} 餐。生活有變化時再調整就好，不會扣除圓夢累積。`,
            timestamp: "剛剛",
          }))
          .catch(() => finish({
            id: `chef-${Date.now()}`,
            sender: "chef",
            actionType: "adjust",
            text: "主廚 CooCoo：本週目標尚未儲存成功，原設定沒有改變。請稍後再試。",
            timestamp: "剛剛",
          }));
        return;
      }

      if (!onRecordTakeout) {
        finish({
          id: `chef-${Date.now()}`,
          sender: "chef",
          actionType: "takeout",
          text: `主廚 CooCoo：今晚放心休息。外食比較價 NT$ ${outsideMealPrice} 只會用於日後的省錢比較；目前沒有新增支出或餐次紀錄。`,
          timestamp: "剛剛",
        });
        return;
      }
      void onRecordTakeout()
        .then((detail) => finish({
          id: `chef-${Date.now()}`,
          sender: "chef",
          actionType: "takeout",
          text: `主廚 CooCoo：今晚放心享受外食。${detail}`,
          timestamp: "剛剛",
        }))
        .catch(() => finish({
          id: `chef-${Date.now()}`,
          sender: "chef",
          actionType: "takeout",
          text: "主廚 CooCoo：餐單調整尚未儲存成功，原本安排沒有改變。請稍後再試。",
          timestamp: "剛剛",
        }));
    }, 350);
  };

  return (
    <Modal label="主廚 CooCoo 相談室" onClose={onClose} wide={false}>
      {/* Modal Header */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
              <line x1="9" y1="12" x2="9.01" y2="12" />
              <line x1="15" y1="12" x2="15.01" y2="12" />
              <line x1="6" y1="17" x2="18" y2="17" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-black text-stone-900">主廚 CooCoo 相談室</h2>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded">
                日常隨行
              </span>
            </div>
            <p className="text-[10px] text-stone-400 font-medium">隨時為你的下班決策分憂</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="關閉"
          className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Chat Stream Body */}
      <div
        ref={chatContainerRef}
        className="max-h-[380px] overflow-y-auto space-y-3 pr-1 text-xs"
      >
        {messages.map((msg) => {
          if (msg.sender === "user") {
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="bg-amber-600 text-white text-xs font-medium py-2 px-3.5 rounded-2xl rounded-tr-xs shadow-2xs max-w-[85%] text-left">
                  {msg.text}
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className="flex items-start gap-2 text-left">
              <div className="w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
                </svg>
              </div>
              <div className="max-w-[88%] bg-stone-50 border border-stone-200 rounded-2xl rounded-tl-xs p-3 text-xs text-stone-800 shadow-2xs space-y-1.5">
                <div className="font-bold text-stone-900 flex items-center justify-between">
                  <span>主廚 CooCoo</span>
                  <span className="text-[10px] font-mono text-stone-400">{msg.timestamp}</span>
                </div>
                <p className="text-stone-600 text-[11px] leading-relaxed whitespace-pre-line">
                  {msg.text}
                </p>
                {msg.actionButtons && msg.actionButtons.length > 0 ? (
                  <div className="mt-2 space-y-1.5 w-full">
                    {msg.actionButtons.map((btn, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={btn.onClick}
                        className={`spring-btn w-full font-bold py-2.5 px-3 rounded-xl text-[11px] transition-colors flex items-center justify-center gap-1.5 ${
                          btn.variant === "secondary"
                            ? "bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200"
                            : "bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300/80"
                        }`}
                      >
                        {btn.icon === "cart" ? (
                          <svg
                            className="w-3.5 h-3.5 text-stone-600 shrink-0"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <circle cx="8" cy="21" r="1" />
                            <circle cx="19" cy="21" r="1" />
                            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                          </svg>
                        ) : (
                          <svg
                            className="w-3.5 h-3.5 text-amber-800 shrink-0"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        )}
                        <span>{btn.label}</span>
                      </button>
                    ))}
                  </div>
                ) : msg.actionButton ? (
                  <button
                    type="button"
                    onClick={msg.actionButton.onClick}
                    className="spring-btn mt-2 w-full bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold py-2 px-3 rounded-xl text-[11px] transition-colors flex items-center justify-center gap-1.5 border border-amber-300/80"
                  >
                    <svg
                      className="w-3.5 h-3.5 text-amber-800"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    <span>{msg.actionButton.label}</span>
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}

        {isPending && (
          <div className="flex items-center gap-2 text-stone-400 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>主廚 CooCoo 正在思考…</span>
          </div>
        )}

        <div ref={streamEndRef} />
      </div>

      {/* Quick Action Decision List */}
      {!showQuickActions ? (
        <div className="pt-2.5 border-t border-stone-100 mt-2.5 flex items-center justify-between">
          <span className="text-[10px] text-stone-400 font-medium">需要處理其他狀況？</span>
          <button
            type="button"
            onClick={() => setShowQuickActions(true)}
            className="spring-btn text-[11px] font-bold text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-xl border border-amber-200/80 transition-all flex items-center gap-1 shadow-2xs"
          >
            <svg
              className="w-3 h-3 text-amber-700"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            <span>展開速決清單</span>
          </button>
        </div>
      ) : (
        <div className="pt-3 border-t border-stone-100 mt-3 space-y-2 text-left">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-stone-400 flex items-center gap-1">
              <svg
                className="w-3 h-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
              主廚 CooCoo 隨行速決清單：
            </span>
            {messages.length > 1 && (
              <button
                type="button"
                onClick={() => setShowQuickActions(false)}
                className="text-[10px] text-stone-400 hover:text-stone-600"
              >
                收摺
              </button>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => handleAction("tired")}
              className="spring-btn text-left bg-white hover:bg-amber-50/70 border border-stone-200 p-2.5 rounded-xl shadow-2xs flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-stone-800 text-[11px] group-hover:text-amber-950">
                    腦力透支！要 12 分鐘低體力出餐
                  </div>
                  <div className="text-[9px] text-stone-400">步驟 ≤ 6 · 單鍋搞定 · 免繁複備料</div>
                </div>
              </div>
              <svg
                className="w-3.5 h-3.5 text-stone-300 group-hover:text-amber-600 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => handleAction("adjust")}
              className="spring-btn text-left bg-white hover:bg-amber-50/70 border border-stone-200 p-2.5 rounded-xl shadow-2xs flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <rect width="18" height="18" x="3" y="4" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                    <path d="m9 16 2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-stone-800 text-[11px] group-hover:text-amber-950">
                    這週臨時聚餐多，自煮想少 1 餐
                  </div>
                  <div className="text-[9px] text-stone-400">生活彈性第一，目標順延不懲罰</div>
                </div>
              </div>
              <svg
                className="w-3.5 h-3.5 text-stone-300 group-hover:text-amber-600 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => handleAction("takeout")}
              className="spring-btn text-left bg-white hover:bg-amber-50/70 border border-stone-200 p-2.5 rounded-xl shadow-2xs flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center shrink-0">
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
                    <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-stone-800 text-[11px] group-hover:text-amber-950">
                    今晚改外食，調整今天的餐單
                  </div>
                  <div className="text-[9px] text-stone-400">有今日排定餐點時才會儲存取消，不會自動扣款</div>
                </div>
              </div>
              <svg
                className="w-3.5 h-3.5 text-stone-300 group-hover:text-amber-600 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
