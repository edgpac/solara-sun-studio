import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LEVELS } from "@/lib/game/levels";
import { isLevelUnlocked, loadProgress, totalStars, type Progress } from "@/lib/game/storage";
import { SUN_IMAGES } from "@/lib/game/art";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "World Map — SOL DE CABO™" },
      {
        name: "description",
        content: "Travel through Cabo, Oaxaca, Yucatán and beyond. Unlock every artisan sun.",
      },
      { property: "og:title", content: "World Map — SOL DE CABO™" },
      {
        property: "og:description",
        content: "Travel through Cabo, Oaxaca, Yucatán and beyond.",
      },
    ],
  }),
  component: MapPage,
  notFoundComponent: () => <div className="p-8">Not found</div>,
  errorComponent: ErrorComp,
});

function ErrorComp({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="min-h-screen grid place-items-center p-6 text-center">
      <div>
        <p className="display text-2xl mb-3">The map could not load</p>
        <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
        <button
          className="tile-gold px-5 py-3 font-semibold"
          onClick={() => {
            router.invalidate();
            reset();
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}

function MapPage() {
  // Loaded client-side to avoid SSR/localStorage mismatch.
  const [progress, setProgress] = useState<Progress>({ levels: {}, careerTotal: 0 });
  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const stars = totalStars(progress);

  return (
    <main className="scene-cabo min-h-screen w-full px-4 sm:px-6 relative" style={{ paddingTop: "calc(var(--sat, env(safe-area-inset-top, 0px)) + 2rem)", paddingBottom: "calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 2rem)" }}>
      <div className="relative z-10 max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-8 gap-4">
          <Link
            to="/"
            className="tile px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:scale-105 transition-transform"
          >
            ← Home
          </Link>
          <div className="text-center">
            <div className="display text-[10px] sm:text-xs tracking-[0.4em] uppercase text-cream/70">
              Journey of the
            </div>
            <h1 className="display text-3xl sm:text-5xl font-bold text-primary leading-tight">
              Sun Pilgrims
            </h1>
          </div>
          <div className="tile px-4 py-2 flex items-center gap-2">
            <span className="text-primary text-xl leading-none">★</span>
            <span className="display text-xl font-bold tabular-nums">{stars}</span>
            <span className="text-xs uppercase tracking-wider text-muted-foreground">/30</span>
          </div>
        </header>

        <div className="relative">
          {/* The pilgrim path */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            preserveAspectRatio="none"
            viewBox="0 0 100 1000"
            aria-hidden
          >
            <path
              d={pathFor(LEVELS.length)}
              fill="none"
              stroke="oklch(0.78 0.18 65 / 0.4)"
              strokeWidth="0.8"
              strokeDasharray="2 2"
            />
          </svg>

          <ol className="relative space-y-6 sm:space-y-8">
            {LEVELS.map((lv, i) => {
              const lp = progress.levels[lv.id];
              const earned = lp?.stars ?? 0;
              const unlocked = isLevelUnlocked(lv.id, progress);
              const sunImg = SUN_IMAGES[(i + 1) % SUN_IMAGES.length];
              const side = i % 2 === 0 ? "ml-0 mr-auto" : "ml-auto mr-0";

              return (
                <li key={lv.id} className={`max-w-[85%] sm:max-w-md ${side}`}>
                  <LevelPin
                    levelId={lv.id}
                    name={lv.name}
                    region={lv.region}
                    vibe={lv.vibe}
                    earned={earned}
                    unlocked={unlocked}
                    sunImg={sunImg}
                    nameColor={lv.color}
                  />
                </li>
              );
            })}
          </ol>
        </div>

        <div className="text-center mt-12 text-[10px] tracking-[0.3em] uppercase text-cream/40">
          More regions awaken with each star
        </div>
      </div>
    </main>
  );
}

function LevelPin({
  levelId,
  name,
  region,
  vibe,
  earned,
  unlocked,
  sunImg,
  nameColor,
}: {
  levelId: number;
  name: string;
  region: string;
  vibe: string;
  earned: number;
  unlocked: boolean;
  sunImg: string;
  nameColor: string;
}) {
  const content = (
    <div
      className={["map-pin relative overflow-hidden", unlocked ? "" : "opacity-45 grayscale"].join(" ")}
      style={{
        background: `linear-gradient(135deg, oklch(0.22 0.09 276) 0%, oklch(0.16 0.07 272) 100%)`,
        border: `2px solid ${unlocked ? nameColor + "88" : "oklch(0.30 0.06 270)"}`,
        borderRadius: "1.25rem",
        boxShadow: unlocked
          ? `inset 0 1px 0 oklch(0.55 0.12 280 / 0.3), 0 5px 0 oklch(0.10 0.04 270), 0 10px 28px oklch(0 0 0 / 0.65), 0 0 40px ${nameColor}22`
          : "0 4px 0 oklch(0.10 0.04 270), 0 8px 20px oklch(0 0 0 / 0.5)",
      }}
    >
      {/* Subtle color wash from nameColor */}
      {unlocked && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 80% 60% at 100% 50%, ${nameColor}18, transparent 70%)`,
          }}
        />
      )}
      <div className="relative flex items-center gap-4 p-3 sm:p-4">
        {/* Sun art with glow */}
        <div className="relative shrink-0">
          {unlocked && (
            <div
              className="absolute inset-0 rounded-full blur-2xl"
              style={{ background: `radial-gradient(circle, ${nameColor}55, transparent 70%)`, transform: "scale(1.4)" }}
            />
          )}
          <img
            src={sunImg}
            alt=""
            width={88}
            height={88}
            loading="lazy"
            className="relative w-16 h-16 sm:w-20 sm:h-20 object-contain"
            style={{ filter: "drop-shadow(0 4px 12px oklch(0 0 0 / 0.6))" }}
          />
        </div>

        {/* Level info */}
        <div className="flex-1 min-w-0">
          <div className="text-[9px] uppercase tracking-[0.22em]" style={{ color: "oklch(0.55 0.08 280)" }}>
            Level {levelId} · {region}
          </div>
          <div
            className="display text-xl sm:text-2xl font-bold truncate leading-tight"
            style={{
              color: unlocked ? nameColor : "oklch(0.45 0.06 270)",
              textShadow: unlocked ? `0 0 20px ${nameColor}88, 0 2px 4px oklch(0 0 0 / 0.6)` : "none",
            }}
          >
            {name}
          </div>
          <div className="text-xs italic mb-1.5" style={{ color: "oklch(0.62 0.06 280)" }}>{vibe}</div>

          {/* Stars */}
          <div className="flex gap-1" aria-label={`${earned} of 3 stars`}>
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                style={{
                  fontSize: "1.15rem",
                  lineHeight: 1,
                  color: s <= earned ? "oklch(0.90 0.22 80)" : "oklch(0.28 0.06 270)",
                  filter: s <= earned ? "drop-shadow(0 0 6px oklch(0.88 0.22 80 / 0.9))" : "none",
                }}
              >★</span>
            ))}
            {earned === 3 && (
              <span className="text-[9px] uppercase tracking-widest ml-1.5" style={{ color: "oklch(0.75 0.16 72)" }}>
                Complete
              </span>
            )}
          </div>
        </div>

        {!unlocked ? (
          <div className="text-4xl" aria-hidden style={{ color: "oklch(0.35 0.06 270)" }}>🔒</div>
        ) : unlocked && earned === 0 ? (
          <div
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{
              background: "linear-gradient(180deg, oklch(0.88 0.20 82), oklch(0.68 0.24 56))",
              color: "oklch(0.14 0.04 35)",
              boxShadow: "0 3px 0 oklch(0.42 0.18 40), 0 6px 12px oklch(0 0 0 / 0.4)",
            }}
          >
            Play
          </div>
        ) : null}
      </div>
    </div>
  );

  if (!unlocked) return content;
  return (
    <Link
      to="/play/$level"
      params={{ level: String(levelId) }}
      className="block"
      aria-label={`Play level ${levelId}: ${name}`}
    >
      {content}
    </Link>
  );
}

function pathFor(n: number): string {
  // Zigzag path connecting alternating-side pins.
  const stepY = 1000 / Math.max(n, 1);
  let d = "";
  for (let i = 0; i < n; i++) {
    const x = i % 2 === 0 ? 20 : 80;
    const y = stepY * (i + 0.5);
    d += i === 0 ? `M ${x} ${y} ` : `L ${x} ${y} `;
  }
  return d;
}
