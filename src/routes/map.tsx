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
    <main className="scene-cabo min-h-screen w-full px-4 sm:px-6 py-8 relative">
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
}: {
  levelId: number;
  name: string;
  region: string;
  vibe: string;
  earned: number;
  unlocked: boolean;
  sunImg: string;
}) {
  const content = (
    <div
      className={[
        "tile map-pin flex items-center gap-4 p-3 sm:p-4 relative",
        unlocked ? "" : "opacity-50 grayscale",
      ].join(" ")}
    >
      <div className="relative shrink-0">
        <div
          className="absolute inset-0 -m-2 rounded-full blur-xl"
          style={{
            background: unlocked
              ? "radial-gradient(circle, oklch(0.85 0.20 75 / 0.6), transparent 70%)"
              : "transparent",
          }}
        />
        <img
          src={sunImg}
          alt=""
          width={88}
          height={88}
          loading="lazy"
          className="relative w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_4px_8px_oklch(0_0_0/0.5)]"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Level {levelId} · {region}
        </div>
        <div className="display text-xl sm:text-2xl font-semibold text-primary truncate">
          {name}
        </div>
        <div className="text-xs italic text-cream/70 truncate">{vibe}</div>
        <div className="flex gap-1 mt-1.5" aria-label={`${earned} of 3 stars`}>
          {[1, 2, 3].map((s) => (
            <span
              key={s}
              className={
                s <= earned ? "text-primary text-lg leading-none" : "text-muted text-lg leading-none"
              }
              style={
                s <= earned
                  ? { textShadow: "0 0 8px oklch(0.85 0.20 75 / 0.8)" }
                  : undefined
              }
            >
              ★
            </span>
          ))}
        </div>
      </div>
      {!unlocked && (
        <div className="display text-3xl text-muted-foreground/60" aria-hidden>
          ✦
        </div>
      )}
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
