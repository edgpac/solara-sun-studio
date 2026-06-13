import { useState } from "react";
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
  onPause?: () => void;
}

export function HUD({ level, region, name, score, sessionScore, targetThree, moves, combo, onPause }: Props) {
  const progress = Math.min(100, (score / targetThree) * 100);
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());

  function handleSoundToggle() {
    setSoundOn(toggleSound());
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-3 pt-2 pb-1">
      {/* Single compact row */}
      <div className="flex items-center gap-2">
        <button
          onClick={onPause}
          className="tile px-3 py-1.5 text-xs font-semibold tracking-wide uppercase hover:scale-105 transition-transform flex-shrink-0"
          aria-label="Pause and return"
        >
          ← Map
        </button>

        {/* Level info + score — fills middle */}
        <div className="flex-1 min-w-0 tile px-3 py-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground leading-none">
                Lv {level} · {region}
              </div>
              <div className="display text-sm font-bold text-primary truncate leading-tight">{name}</div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {combo > 1 && (
                <span
                  key={combo}
                  className="display text-sm font-bold px-2 py-0.5 rounded-full bg-accent/30 text-accent-foreground border border-accent animate-scale-in"
                >
                  ×{combo}
                </span>
              )}
              <span className="display text-lg font-bold text-primary tabular-nums">
                {sessionScore.toLocaleString()}
              </span>
            </div>
          </div>
          {/* Slim progress bar */}
          <div className="h-1 rounded-full bg-background/60 overflow-hidden border border-border mt-1">
            <div
              className="h-full bg-gold transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <button
          onClick={handleSoundToggle}
          className="tile px-2 py-1.5 text-base hover:scale-105 transition-transform flex-shrink-0"
          aria-label={soundOn ? "Mute" : "Unmute"}
        >
          {soundOn ? "🔊" : "🔇"}
        </button>

        <div className="tile px-2 py-1.5 text-center flex-shrink-0 min-w-[48px]">
          <div className="text-[8px] uppercase tracking-wider text-muted-foreground leading-none">Moves</div>
          <div className="display text-xl font-bold leading-tight">{moves}</div>
        </div>
      </div>
    </div>
  );
}
