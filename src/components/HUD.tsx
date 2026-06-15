import { useEffect, useRef, useState } from "react";
import { isSoundEnabled, toggleSound } from "@/lib/game/audio";

interface Props {
  level: number;
  region: string;
  name: string;
  score: number;
  sessionScore: number;
  targetThree: number;
  moves: number;
  combo: number;
}

export function HUD({ level, region, name, score, sessionScore, targetThree, moves, combo }: Props) {
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const prevStars = useRef(0);
  const [earnedIdx, setEarnedIdx] = useState<number | null>(null);

  const t1 = Math.round(targetThree * 0.35);
  const t2 = Math.round(targetThree * 0.60);
  const t3 = targetThree;
  const stars = score >= t3 ? 3 : score >= t2 ? 2 : score >= t1 ? 1 : 0;
  const progress = Math.min(100, (score / t3) * 100);
  const movesLow = moves <= 5;

  // Trigger star-earn animation when a new star is crossed.
  useEffect(() => {
    if (stars > prevStars.current) {
      setEarnedIdx(stars - 1);
      const t = setTimeout(() => setEarnedIdx(null), 600);
      prevStars.current = stars;
      return () => clearTimeout(t);
    }
  }, [stars]);

  return (
    <div className="w-full px-3 pt-1 pb-0.5">
      {/* Game HUD panel */}
      <div
        style={{
          background: "linear-gradient(180deg, oklch(0.24 0.09 278) 0%, oklch(0.17 0.07 272) 100%)",
          border: "2px solid oklch(0.50 0.14 270 / 0.6)",
          borderBottom: "2px solid oklch(0.12 0.05 270)",
          borderRadius: "1.25rem",
          boxShadow:
            "inset 0 1px 0 oklch(0.62 0.12 285 / 0.35), 0 5px 0 oklch(0.10 0.04 270), 0 10px 28px oklch(0 0 0 / 0.6)",
        }}
      >
        {/* ── Row 1: level label · name · sound ── */}
        <div className="flex items-center justify-between px-3 pt-1.5 pb-0 gap-2">
          <div
            className="text-[9px] uppercase tracking-[0.22em] leading-none flex-shrink-0"
            style={{ color: "oklch(0.62 0.10 280)" }}
          >
            Lv {level} · {region}
          </div>
          <div
            className="display text-xs font-bold truncate text-center flex-1"
            style={{
              background: "linear-gradient(90deg, oklch(0.96 0.10 85), oklch(0.82 0.20 70))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {name}
          </div>
          <button
            onClick={() => setSoundOn(toggleSound())}
            className="text-base opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"
            aria-label={soundOn ? "Mute" : "Unmute"}
          >
            {soundOn ? "🔊" : "🔇"}
          </button>
        </div>

        {/* ── Row 2: Score pill · Stars · Big Moves ── */}
        <div className="flex items-center justify-between px-3 py-1 gap-3">

          {/* Score badge — gold-bordered pill */}
          <div
            className="flex flex-col items-center flex-shrink-0 px-2.5 py-1 rounded-xl tabular-nums"
            style={{
              background: "oklch(0.14 0.06 270)",
              border: "2px solid oklch(0.55 0.18 72 / 0.7)",
              boxShadow: "0 2px 0 oklch(0.38 0.14 52), 0 4px 12px oklch(0 0 0 / 0.4), inset 0 1px 0 oklch(0.70 0.14 80 / 0.2)",
              minWidth: "72px",
            }}
          >
            <span className="text-[8px] uppercase tracking-widest leading-none mb-0.5" style={{ color: "oklch(0.60 0.08 280)" }}>Score</span>
            <span
              className="display text-base font-bold leading-none"
              style={{
                background: "linear-gradient(180deg, oklch(0.96 0.10 85), oklch(0.76 0.22 68))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {sessionScore.toLocaleString()}
            </span>
          </div>

          {/* Stars — light up and bounce when earned */}
          <div className="flex items-center gap-2 flex-1 justify-center">
            {[1, 2, 3].map((s) => {
              const lit = s <= stars;
              const bouncing = earnedIdx === s - 1;
              return (
                <span
                  key={s}
                  className={bouncing ? "star-earned" : ""}
                  style={{
                    fontSize: "clamp(1.2rem, 6vw, 1.8rem)",
                    lineHeight: 1,
                    display: "block",
                    color: lit ? "oklch(0.90 0.22 80)" : "oklch(0.32 0.06 270)",
                    filter: lit
                      ? "drop-shadow(0 0 10px oklch(0.88 0.22 80 / 0.9)) drop-shadow(0 2px 4px oklch(0 0 0 / 0.6))"
                      : "none",
                    transition: "color 0.3s ease, filter 0.3s ease",
                  }}
                >★</span>
              );
            })}
            {combo > 1 && (
              <span
                key={combo}
                className="display text-xs font-bold px-1.5 py-0.5 rounded-full ml-1 animate-bounce"
                style={{
                  background: "oklch(0.82 0.20 72 / 0.25)",
                  border: "1px solid oklch(0.82 0.20 72 / 0.6)",
                  color: "oklch(0.96 0.14 82)",
                }}
              >
                ×{combo}
              </span>
            )}
          </div>

          {/* Moves — huge, Candy Crush style */}
          <div
            className="flex flex-col items-center flex-shrink-0 px-2.5 py-1 rounded-xl"
            style={{
              background: movesLow ? "oklch(0.22 0.12 20)" : "oklch(0.14 0.06 270)",
              border: movesLow
                ? "2px solid oklch(0.65 0.24 25 / 0.8)"
                : "2px solid oklch(0.55 0.18 72 / 0.7)",
              boxShadow: movesLow
                ? "0 2px 0 oklch(0.35 0.18 20), 0 4px 12px oklch(0.65 0.24 25 / 0.4), inset 0 1px 0 oklch(0.80 0.20 30 / 0.2)"
                : "0 2px 0 oklch(0.38 0.14 52), 0 4px 12px oklch(0 0 0 / 0.4), inset 0 1px 0 oklch(0.70 0.14 80 / 0.2)",
              minWidth: "60px",
              transition: "all 0.3s ease",
            }}
          >
            <span className="text-[8px] uppercase tracking-widest leading-none mb-0.5" style={{ color: movesLow ? "oklch(0.72 0.18 25)" : "oklch(0.60 0.08 280)" }}>Moves</span>
            <span
              className="display font-bold leading-none tabular-nums"
              style={{
                fontSize: "clamp(1.4rem, 6vw, 2rem)",
                color: movesLow ? "oklch(0.80 0.26 25)" : "oklch(0.97 0.01 80)",
                textShadow: movesLow ? "0 0 20px oklch(0.75 0.26 25 / 0.8)" : "0 2px 0 oklch(0 0 0 / 0.5)",
                animation: movesLow ? "pulse-red 1s ease-in-out infinite" : "none",
              }}
            >
              {moves}
            </span>
          </div>
        </div>

        {/* ── Progress bar with 3 star threshold markers ── */}
        <div className="px-3 pb-1.5">
          <div
            className="relative rounded-full overflow-visible"
            style={{ height: "7px", background: "oklch(0.12 0.04 270)" }}
          >
            {/* Glowing fill */}
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, oklch(0.62 0.22 48), oklch(0.90 0.20 80))",
                boxShadow: "0 0 10px oklch(0.84 0.20 74 / 0.8), 0 0 20px oklch(0.80 0.18 68 / 0.4)",
              }}
            />
            {/* Star marker pins at 35 / 60 / 100 % */}
            {[
              { pct: 35, earned: stars >= 1 },
              { pct: 60, earned: stars >= 2 },
              { pct: 100, earned: stars >= 3 },
            ].map(({ pct, earned }) => (
              <div
                key={pct}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-[11px] leading-none"
                style={{
                  left: `${pct}%`,
                  color: earned ? "oklch(0.90 0.22 80)" : "oklch(0.40 0.06 270)",
                  filter: earned ? "drop-shadow(0 0 5px oklch(0.88 0.22 80 / 0.9))" : "none",
                  zIndex: 1,
                  transition: "color 0.3s ease, filter 0.3s ease",
                }}
              >★</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
