interface ChefSignatureProps {
  runAnimation?: boolean;
}

export function ChefSignature({ runAnimation = false }: ChefSignatureProps) {
  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-stone-400 font-bold block">主廚 CooCoo 親筆見證</span>
      </div>

      <div className="relative inline-block mt-1 select-none overflow-visible">
        <svg
          width="200"
          height="95"
          viewBox="0 0 200 95"
          style={{ overflow: "visible", display: "block" }}
          aria-label="CooCoo 親筆簽名"
        >
          <defs>
            <mask
              id="sig-ink-flow-mask"
              maskUnits="userSpaceOnUse"
              maskContentUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="300"
              height="150"
            >
              <path
                className={runAnimation ? "sig-mask-anim" : ""}
                d="M 28 32 C 30 20, 36 15, 36 15 C 30 18, 22 36, 22 48 C 22 62, 28 72, 36 71 C 42 70, 46 60, 48 55 C 52 48, 58 46, 62 50 C 66 54, 66 66, 58 70 C 50 72, 48 64, 52 56 C 56 50, 62 50, 68 53 C 72 48, 78 46, 82 50 C 86 54, 86 66, 78 70 C 70 72, 68 64, 72 56 C 76 50, 82 50, 90 53 C 96 35, 102 15, 104 15 C 98 18, 90 36, 90 48 C 90 62, 96 72, 104 71 C 110 70, 114 60, 116 55 C 120 48, 126 46, 130 50 C 134 54, 134 66, 126 70 C 118 72, 116 64, 120 56 C 124 50, 130 50, 136 53 C 140 48, 146 46, 150 50 C 154 54, 154 66, 146 70 C 138 72, 136 64, 140 56 C 144 50, 152 50, 166 56 C 172 58, 178 56, 184 52"
                fill="none"
                stroke="white"
                strokeWidth="32"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={
                  runAnimation
                    ? { strokeDasharray: "620" }
                    : { strokeDasharray: "620", strokeDashoffset: "620" }
                }
              />
            </mask>

            <linearGradient id="goldInkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#d97706" />
              <stop offset="35%" stopColor="#f59e0b" />
              <stop offset="70%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>

            <filter id="goldInkSpread" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="0.5" stdDeviation="0.4" floodColor="#b45309" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Authentic Cedarville Cursive text rendered with ink flow reveal */}
          <text
            x="20"
            y="70"
            fontFamily="'Cedarville Cursive', cursive"
            fontSize="44"
            fill="#1c1917"
            mask="url(#sig-ink-flow-mask)"
          >
            CooCoo
          </text>

          {/* Liquid Golden Underline Sweep, drawn from left to right */}
          <path
            className={runAnimation ? "sig-underline-sweep" : ""}
            d="M 18 86 Q 95 93, 168 83 Q 174 81, 178 78"
            fill="none"
            stroke="url(#goldInkGrad)"
            strokeWidth="3.2"
            strokeLinecap="round"
            filter="url(#goldInkSpread)"
            style={
              runAnimation
                ? { strokeDasharray: "180" }
                : { strokeDasharray: "180", strokeDashoffset: "180" }
            }
          />
        </svg>
      </div>
    </div>
  );
}
