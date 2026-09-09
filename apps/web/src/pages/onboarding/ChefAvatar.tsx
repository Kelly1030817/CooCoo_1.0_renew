export type ChefMood = "listen" | "applause" | "care" | "sealed";

interface ChefAvatarProps {
  mood?: ChefMood;
  isNodding?: boolean;
  onClick?: () => void;
}

const moodConfig: Record<ChefMood, { text: string; className: string }> = {
  listen: {
    text: "聆聽日常",
    className: "text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-200/80 px-2 py-0.5 rounded-full",
  },
  applause: {
    text: "CooCoo 給讚！",
    className: "text-[10px] font-bold text-emerald-900 bg-emerald-100 border border-emerald-200/80 px-2 py-0.5 rounded-full",
  },
  care: {
    text: "最高防線確認",
    className: "text-[10px] font-bold text-red-900 bg-red-100 border border-red-200/80 px-2 py-0.5 rounded-full",
  },
  sealed: {
    text: "立約見證完成",
    className: "text-[10px] font-bold text-amber-950 bg-amber-200 border border-amber-300/80 px-2 py-0.5 rounded-full",
  },
};

export function ChefAvatar({ mood = "listen", isNodding = false, onClick }: ChefAvatarProps) {
  const currentMood = moodConfig[mood] || moodConfig.listen;

  return (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        onClick={onClick}
        aria-label="口袋主廚 CooCoo"
        className={`w-9 h-9 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-xs shrink-0 cursor-pointer transition-transform ${isNodding ? "chef-nodding" : ""}`}
      >
        <svg
          className="w-5 h-5 transition-all"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
          <line className="chef-eyes" x1="9" y1="12" x2="9.01" y2="12" />
          <line className="chef-eyes" x1="15" y1="12" x2="15.01" y2="12" />
          <line x1="6" y1="17" x2="18" y2="17" />
        </svg>
      </button>
      <div>
        <div className="text-xs font-black text-stone-900 flex items-center gap-1.5">
          <span>主廚 CooCoo</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className={currentMood.className}>{currentMood.text}</span>
        </div>
        <div className="text-[10px] text-stone-400 font-medium">口袋自煮夥伴</div>
      </div>
    </div>
  );
}
