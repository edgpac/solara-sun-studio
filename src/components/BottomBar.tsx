interface Props {
  moves: number;
  adUsed: boolean;
  watchingAd: boolean;
  onMap: () => void;
  onHint: () => void;
  onShuffle: () => void;
  onWatchAd: () => void;
}

function Booster({
  icon,
  label,
  onClick,
  disabled,
  accent,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  accent?: "blue" | "gold";
}) {
  const blue = "linear-gradient(180deg, oklch(0.52 0.22 238), oklch(0.38 0.20 235))";
  const gold = "linear-gradient(180deg, oklch(0.88 0.20 82), oklch(0.66 0.24 55))";
  const purple = "linear-gradient(180deg, oklch(0.32 0.10 275), oklch(0.22 0.08 272))";

  const bg = accent === "blue" ? blue : accent === "gold" ? gold : purple;
  const ring = accent === "blue"
    ? "0 0 0 2.5px oklch(0.35 0.18 235), 0 5px 0 oklch(0.26 0.15 232)"
    : accent === "gold"
    ? "0 0 0 2.5px oklch(0.48 0.20 46), 0 5px 0 oklch(0.38 0.18 40)"
    : "0 0 0 2.5px oklch(0.38 0.10 268), 0 5px 0 oklch(0.11 0.05 268)";
  const glow = accent === "blue"
    ? "0 0 16px oklch(0.52 0.22 238 / 0.5)"
    : accent === "gold"
    ? "0 0 16px oklch(0.84 0.22 74 / 0.6)"
    : "none";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-1 active:translate-y-[3px] transition-transform duration-[60ms] disabled:opacity-35"
    >
      <div
        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-2xl sm:text-3xl"
        style={{
          background: bg,
          boxShadow: `inset 0 2px 0 oklch(1 0 0 / 0.25), ${ring}, ${glow}, 0 8px 20px oklch(0 0 0 / 0.55)`,
        }}
      >
        {icon}
      </div>
      <span
        className="text-[9px] uppercase tracking-widest font-semibold leading-none"
        style={{ color: disabled ? "oklch(0.40 0.06 270)" : "oklch(0.75 0.08 280)" }}
      >
        {label}
      </span>
    </button>
  );
}

export function BottomBar({ moves, adUsed, watchingAd, onMap, onHint, onShuffle, onWatchAd }: Props) {
  const showAd = moves <= 10 && !adUsed;

  return (
    <div
      className="w-full flex items-end justify-around px-5"
      style={{
        paddingTop: "0.75rem",
        paddingBottom: "calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 0.75rem)",
        background: "linear-gradient(180deg, oklch(0.14 0.06 272 / 0.0), oklch(0.10 0.05 272 / 0.97))",
        borderTop: "1px solid oklch(0.35 0.10 270 / 0.5)",
      }}
    >
      <Booster icon="🗺" label="Map"     onClick={onMap} />
      <Booster icon="💡" label="Hint"    onClick={onHint} />
      <Booster icon="🔀" label="Shuffle" onClick={onShuffle} />
      <Booster
        icon={watchingAd ? "⏳" : "📺"}
        label={showAd ? "+3 Moves" : "+Moves"}
        onClick={onWatchAd}
        disabled={adUsed || watchingAd}
        accent={showAd ? "blue" : undefined}
      />
    </div>
  );
}
