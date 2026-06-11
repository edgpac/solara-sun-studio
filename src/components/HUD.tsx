interface Props {
  level: number;
  region: string;
  name: string;
  /** Per-level earned score — used for the progress bar only. */
  score: number;
  /** Running session total displayed as the big number. */
  sessionScore: number;
  targetThree: number;
  moves: number;
  combo: number;
  onPause?: () => void;
}

export function HUD({ level, region, name, score, sessionScore, targetThree, moves, combo, onPause }: Props) {
  const progress = Math.min(100, (score / targetThree) * 100);
  return (
    <div className="w-full max-w-2xl mx-auto px-4 pt-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <button
          onClick={onPause}
          className="tile px-4 py-2 text-sm font-semibold tracking-wide uppercase hover:scale-105 transition-transform"
          aria-label="Pause and return"
        >
          ← Map
        </button>
        <div className="text-center flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Level {level} · {region}
          </div>
          <div className="display text-xl sm:text-2xl truncate text-primary">{name}</div>
        </div>
        <div className="tile px-3 py-2 min-w-[72px] text-center">
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Moves</div>
          <div className="display text-2xl font-bold leading-none">{moves}</div>
        </div>
      </div>

      <div className="tile px-4 py-3 flex items-center gap-3">
        <div className="flex-1">
          <div className="flex justify-between items-baseline mb-1.5">
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Score
            </span>
            <span className="display text-xl font-bold text-primary tabular-nums">
              {sessionScore.toLocaleString()}
            </span>
          </div>
          <div className="h-2 rounded-full bg-background/60 overflow-hidden border border-border">
            <div
              className="h-full bg-gold transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        {combo > 1 && (
          <div
            key={combo}
            className="display text-lg font-bold px-3 py-1 rounded-full bg-accent/30 text-accent-foreground border border-accent animate-scale-in"
          >
            ×{combo}
          </div>
        )}
      </div>
    </div>
  );
}
