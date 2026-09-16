import { useState, useRef, useEffect, useMemo, type FormEvent } from "react";
import { ArrowLeftRight, ArrowUp, BadgeCheck, Info, Sparkles, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ChefChatSession, InventoryItem, MealTask } from "@coocoo/contracts";
import { api, json } from "../../shared/api/client";

export interface ShoppingChefChatModalProps {
  onClose: () => void;
  activeTask?: MealTask | null;
  rescuedItems?: InventoryItem[];
  onApplyReplacement?: (
    shortageId: string,
    replacementName: string,
    qty: number,
    unit: string,
  ) => Promise<void>;
}

export function ShoppingChefChatModal({
  onClose,
  activeTask,
  rescuedItems = [],
  onApplyReplacement,
}: ShoppingChefChatModalProps) {
  const queryClient = useQueryClient();
  const [inputMessage, setInputMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [adoptedShortageId, setAdoptedShortageId] = useState<string | null>(null);
  const [adopting, setAdopting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // 1. Fetch Chef Chat Sessions
  const { data: sessions = [], refetch } = useQuery({
    queryKey: ["chef-chat-sessions"],
    queryFn: () => api<ChefChatSession[]>("/chef-chat/sessions"),
  });

  // 2. Calculate today's quota (30 limit)
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const usedCount = useMemo(() => {
    return sessions
      .flatMap((s) => s.messages)
      .filter((m) => m.role === "user" && m.createdAt.startsWith(today)).length;
  }, [sessions, today]);

  const remainingQuota = Math.max(0, 30 - usedCount);
  const isLimitReached = remainingQuota <= 0;

  // 3. Current active shortage (e.g. Scallion or first shortage)
  const candidateShortage = useMemo(() => {
    return activeTask?.shortages.find((s) => s.resolution === "needed") ?? null;
  }, [activeTask]);

  // Suggested replacement logic
  const suggestedReplacement = useMemo(() => {
    if (!candidateShortage) return null;
    if (candidateShortage.name.includes("蔥") || candidateShortage.name.includes("青蔥")) {
      return {
        name: "洋蔥",
        qty: 1,
        unit: "顆",
        estCost: 18,
        reason: "受熱自帶甘甜且耐放，非常契合照燒風味；冰箱尚有洋蔥可直接無縫接軌！",
      };
    }
    return {
      name: `備用${candidateShortage.name}`,
      qty: candidateShortage.quantity,
      unit: candidateShortage.unit,
      estCost: 35,
      reason: "市場常見替代品，耐煮不易破壞原本料理風味。",
    };
  }, [candidateShortage]);

  // 4. Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [sessions, sending]);

  // 5. Send message
  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText ?? inputMessage).trim();
    if (!textToSend || sending || isLimitReached) return;

    setSending(true);
    setErrorMessage(null);
    setInputMessage("");

    try {
      await api<ChefChatSession>(
        "/chef-chat/sessions",
        json("POST", {
          operationId: crypto.randomUUID(),
          message: textToSend,
        }),
      );
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ["chef-chat-sessions"] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("AI_DAILY_LIMITED")) {
        setErrorMessage("今日 30 則 AI 對話額度已用完，明天 00:00 自動重置。");
      } else {
        setErrorMessage("發送失敗，請稍後再試。");
      }
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void handleSend();
  };

  // 6. Handle 1-click proposal adoption
  const handleAdoptProposal = async () => {
    if (!candidateShortage || !suggestedReplacement || adopting) return;
    setAdopting(true);
    try {
      if (onApplyReplacement) {
        await onApplyReplacement(
          candidateShortage.id,
          suggestedReplacement.name,
          suggestedReplacement.qty,
          suggestedReplacement.unit,
        );
      }
      setAdoptedShortageId(candidateShortage.id);
    } catch {
      setErrorMessage("替換食材處理未完成，請稍後再試");
    } finally {
      setAdopting(false);
    }
  };

  // 7. Flatten messages from recent sessions (last 2 sessions)
  const displayMessages = useMemo(() => {
    const recent = sessions.slice(0, 2).reverse();
    return recent.flatMap((s) =>
      s.messages.map((m) => ({
        ...m,
        source: s.source,
      })),
    );
  }, [sessions]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col justify-end bg-[#1c1917]/50 backdrop-blur-xs transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="AI 陪我逛 - 主廚 CooCoo 對話框"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="w-full max-w-[540px] mx-auto bg-[#fffdf8] rounded-t-[28px] border-t-2 border-x border-[#d9cab2] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
        style={{ height: "92%" }}
      >
        {/* Grab Handle */}
        <div className="w-10 h-1 rounded-full bg-[#d9cab2] mx-auto mt-2 mb-1 shrink-0" />

        {/* Modal Header (100% 對齊 Onboarding Topbar #fffdf6 與組件語彙) */}
        <header className="px-4 py-2.5 border-b border-[#e7dac2] bg-[rgb(255_253_246_/_96%)] backdrop-blur-md shrink-0">
          <div className="flex items-center justify-between gap-2">
            {/* Chef Avatar & Mood */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-stone-100/90 border border-stone-200 text-stone-700 flex items-center justify-center shrink-0 shadow-2xs">
                <svg
                  className="w-5 h-5 text-stone-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
                  <line x1="9" y1="12" x2="9.01" y2="12" />
                  <line x1="15" y1="12" x2="15.01" y2="12" />
                  <path d="M6 17h12" />
                </svg>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-black text-stone-900 tracking-tight">
                    主廚 CooCoo
                  </span>
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"
                    title="AI 連線在線"
                  />
                  <span className="text-[9px] font-bold text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded-full border border-amber-200">
                    聆聽日常
                  </span>
                </div>
                <div className="text-[10px] text-stone-400 font-medium">口袋自煮夥伴</div>
              </div>
            </div>

            {/* Quota & Close Button */}
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-mono font-black px-2 py-0.5 rounded-full border ${
                  remainingQuota <= 3
                    ? "bg-amber-50 text-amber-800 border-amber-300"
                    : "bg-[#e7f3ec] text-[#386753] border-[#bad3c3]"
                }`}
                title="每日對話上限 30 則"
              >
                <Sparkles aria-hidden="true" className="size-3" />
                <span>{remainingQuota} / 30 則</span>
              </span>

              <button
                type="button"
                onClick={onClose}
                aria-label="關閉對話"
                className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-600 flex items-center justify-center transition-colors"
              >
                <X aria-hidden="true" className="size-3.5" />
              </button>
            </div>
          </div>
        </header>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
          {/* Initial Welcome Greeting from CooCoo */}
          <div className="flex gap-2.5 items-start">
            <div className="w-7 h-7 rounded-full bg-[#f3eddf] text-[#9a442d] flex items-center justify-center shrink-0 border border-[#e2d8c3] text-xs font-black">
              C
            </div>
            <div className="flex-1 space-y-2">
              <div className="p-3 rounded-2xl rounded-tl-xs bg-white border border-[#e6dbc8] text-[#293c4e] leading-relaxed shadow-2xs space-y-1.5">
                <p className="m-0 font-medium">
                  {activeTask ? (
                    <>
                      嗨！我看到你這次的任務是「
                      <strong className="text-[#9a442d] font-bold">
                        {activeTask.recipe.title}
                      </strong>
                      」，目前尚缺{" "}
                      <strong className="text-[#9a442d]">
                        {activeTask.shortages.map((s) => s.name).join("、")}
                      </strong>
                      。
                    </>
                  ) : (
                    "嗨！我是主廚 CooCoo，正在陪你一起採買。"
                  )}
                  {rescuedItems.length > 0 && (
                    <>
                      {" "}
                      冰箱裡還有{" "}
                      <span className="text-[#55755b] font-bold">
                        {rescuedItems.map((r) => r.name).join("、")}
                      </span>{" "}
                      即將到期，逛超市或市場時隨時問我怎麼搭配或替換！
                    </>
                  )}
                </p>
              </div>

              {/* Action Proposal Card (結構化建議卡) */}
              {candidateShortage && suggestedReplacement && (
                <div
                  className={`p-3 rounded-xl transition-all ${
                    adoptedShortageId === candidateShortage.id
                      ? "bg-white border border-[#bad3c3] shadow-2xs"
                      : "bg-[#fffdf8] border border-[#ded3c2] shadow-xs space-y-2"
                  }`}
                >
                  {adoptedShortageId === candidateShortage.id ? (
                    <div className="flex items-center gap-1.5 text-[#386753] font-black text-xs">
                      <BadgeCheck aria-hidden="true" className="size-3.5" />
                      <span>已成功採納！任務已記錄替代為「{suggestedReplacement.name} 1 顆」</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-[#9a442d] bg-[#fbf0eb] px-1.5 py-0.5 rounded border border-[#f3d3c7]">
                          主廚現場替代提案
                        </span>
                        <span className="text-[9px] text-[#716b60]">
                          預估差額{" "}
                          <b className="text-[#9a442d]">NT$ {suggestedReplacement.estCost}</b>
                        </span>
                      </div>

                      <div>
                        <strong className="text-xs text-[#293c4e] block">
                          買不到 {candidateShortage.name}？改買「{suggestedReplacement.name}{" "}
                          {suggestedReplacement.qty} {suggestedReplacement.unit}」
                        </strong>
                        <p className="text-[10px] text-[#716b60] mt-1 m-0 leading-relaxed">
                          {suggestedReplacement.reason}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleAdoptProposal}
                        disabled={adopting}
                        className="w-full py-1.5 rounded-lg bg-[#34465b] text-white text-[11px] font-black hover:bg-[#202d3c] transition-all flex items-center justify-center gap-1 shadow-2xs"
                      >
                        <ArrowLeftRight aria-hidden="true" className="size-3.5" />
                        <span>
                          {adopting
                            ? "正在更新任務…"
                            : `採納建議：改買${suggestedReplacement.name} ${suggestedReplacement.qty} ${suggestedReplacement.unit}`}
                        </span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Past Sessions Messages */}
          {displayMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 items-start ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {msg.role === "user" ? (
                <div className="w-7 h-7 rounded-full bg-[#34465b] text-white flex items-center justify-center shrink-0 text-xs font-black">
                  我
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#f3eddf] text-[#9a442d] flex items-center justify-center shrink-0 border border-[#e2d8c3] text-xs font-black">
                  C
                </div>
              )}

              <div
                className={`max-w-[82%] p-3 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                  msg.role === "user"
                    ? "bg-[#34465b] text-white rounded-tr-xs"
                    : "bg-white border border-[#e6dbc8] text-[#293c4e] rounded-tl-xs"
                }`}
              >
                <p className="m-0 whitespace-pre-wrap">{msg.content}</p>
                {msg.role === "assistant" && (
                  <div className="mt-1 flex items-center justify-between text-[9px] text-stone-400">
                    <span>{msg.source === "openrouter" ? "AI 建議" : "規則備援"}</span>
                    <span>{msg.createdAt.slice(11, 16)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Sending State */}
          {sending && (
            <div className="flex gap-2.5 items-start">
              <div className="w-7 h-7 rounded-full bg-[#f3eddf] text-[#9a442d] flex items-center justify-center shrink-0 border border-[#e2d8c3] text-xs font-black">
                C
              </div>
              <div className="p-3 rounded-2xl rounded-tl-xs bg-white border border-[#e6dbc8] text-stone-500 text-xs flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-stone-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-stone-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-stone-400 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] text-stone-400 ml-1">CooCoo 正在對齊食譜與預算…</span>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-1.5">
              <Info aria-hidden="true" className="size-3.5 text-amber-700" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-3 py-1.5 bg-[#faf6ee] border-t border-[#eee5d6] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => void handleSend("青蔥缺貨怎麼辦？有推薦平價替代嗎？")}
            disabled={sending || isLimitReached}
            className="shrink-0 text-[10px] font-bold text-[#5c5446] bg-white px-2.5 py-1 rounded-full border border-[#ded3c2] hover:bg-[#f6eee0] transition-colors"
          >
            青蔥缺貨怎麼辦？
          </button>
          <button
            type="button"
            onClick={() => void handleSend("冰箱快過期的食材怎麼一起順便用完？")}
            disabled={sending || isLimitReached}
            className="shrink-0 text-[10px] font-bold text-[#5c5446] bg-white px-2.5 py-1 rounded-full border border-[#ded3c2] hover:bg-[#f6eee0] transition-colors"
          >
            即期食材如何順便用？
          </button>
          <button
            type="button"
            onClick={() => void handleSend("這餐採買預算 100 元內有什麼省錢建議？")}
            disabled={sending || isLimitReached}
            className="shrink-0 text-[10px] font-bold text-[#5c5446] bg-white px-2.5 py-1 rounded-full border border-[#ded3c2] hover:bg-[#f6eee0] transition-colors"
          >
            預算 100 元內怎麼買？
          </button>
        </div>

        {/* Bottom Input Area */}
        <footer className="p-3 bg-white border-t border-[#e2d8c3] shrink-0">
          {isLimitReached ? (
            <div className="p-2.5 rounded-xl bg-[#f5f6ec] border border-[#d5ddcb] text-center">
              <p className="text-xs font-bold text-[#386753] m-0">
                今日 30 則對話額度已滿，明天 00:00 自動重置
              </p>
              <small className="text-[10px] text-[#716b60] block mt-0.5">
                採買缺料替代仍可於食材章格中選擇「找不到」手動調整。
              </small>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="問問 CooCoo，例如：洋蔥跟去骨雞腿肉怎麼挑？"
                disabled={sending}
                className="flex-1 min-h-[38px] px-3 py-1.5 rounded-full bg-[#f6f2e9] border border-[#ded3c2] text-xs text-[#293c4e] placeholder:text-[#999285] focus:outline-none focus:border-[#9a442d] focus:bg-white transition-all"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || sending}
                className="w-9 h-9 rounded-full bg-[#9a442d] text-white flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#833824] transition-colors shadow-2xs"
                aria-label="發送訊息"
              >
                <ArrowUp aria-hidden="true" className="size-4" />
              </button>
            </form>
          )}
        </footer>
      </section>
    </div>
  );
}
