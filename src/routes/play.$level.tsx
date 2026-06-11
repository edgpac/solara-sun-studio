import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { GameBoard } from "@/components/GameBoard";
import { HUD } from "@/components/HUD";
import { getLevel, LEVELS, type Level } from "@/lib/game/levels";
import { saveLevelResult } from "@/lib/game/storage";

export const Route = createFileRoute("/play/$level")({
  head: ({ params }) => ({
    meta: [
      { title: `Level ${params.level} — SOL DE CABO™` },
      { name: "description", content: "Play a level of SOL DE CABO." },
    ],
  }),
  component: PlayPage,
  notFoundComponent: () => <div className="p-8">Level not found</div>,
  errorComponent: PlayError,
});

function PlayError({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="min-h-screen grid place-items-center p-6 text-center">
      <div>
        <p className="display text-2xl mb-3">Couldn’t start the level</p>
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

interface CompletionState {
  score: number;
  stars: number;
  cleared: boolean;
}

function PlayPage() {
  const params = Route.useParams();
  const navigate = useNavigate();
  const id = Number(params.level);
  const level = getLevel(id);

  if (!level) {
    return (
      <main className="min-h-screen scene-cabo grid place-items-center px-6 text-center">
        <div className="relative z-10">
          <p className="display text-3xl mb-4">That region is still asleep.</p>
          <Link to="/map" className="tile-gold px-6 py-3 inline-block font-semibold">
            Back to map
          </Link>
        </div>
      </main>
    );
  }

  return <Session level={level} navigateBack={() => navigate({ to: "/map" })} navigate={navigate} />;
}

function Session({
  level,
  navigateBack,
  navigate,
}: {
  level: Level;
  navigateBack: () => void;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const [stats, setStats] = useState({ score: 0, moves: level.moves, combo: 0 });
  const [done, setDone] = useState<CompletionState | null>(null);
  const [seed, setSeed] = useState(0);

  const handleComplete = useCallback(
    (r: CompletionState) => {
      if (r.stars > 0) saveLevelResult(level.id, r.stars, r.score);
      setDone(r);
    },
    [level.id],
  );

  const nextLevel = LEVELS.find((l) => l.id === level.id + 1);

  return (
    <main className="scene-cabo min-h-screen w-full pb-10 relative">
      <div className="relative z-10">
        <HUD
          level={level.id}
          region={level.region}
          name={level.name}
          score={stats.score}
          targetThree={level.stars[2]}
          moves={stats.moves}
          combo={stats.combo}
          onPause={navigateBack}
        />
        <GameBoard
          key={seed}
          moves={level.moves}
          targetThree={level.stars[2]}
          onStats={setStats}
          onComplete={handleComplete}
        />
      </div>

      {done && (
        <CompletionOverlay
          level={level}
          result={done}
          onReplay={() => {
            setDone(null);
            setStats({ score: 0, moves: level.moves, combo: 0 });
            setSeed((s) => s + 1);
          }}
          onNext={
            nextLevel
              ? () => {
                  setDone(null);
                  navigate({ to: "/play/$level", params: { level: String(nextLevel.id) } });
                }
              : undefined
          }
          onMap={navigateBack}
        />
      )}
    </main>
  );
}

function CompletionOverlay({
  level,
  result,
  onReplay,
  onNext,
  onMap,
}: {
  level: Level;
  result: CompletionState;
  onReplay: () => void;
  onNext?: () => void;
  onMap: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-6 animate-fade-in"
      style={{ background: "oklch(0 0 0 / 0.7)", backdropFilter: "blur(8px)" }}
    >
      <div className="tile max-w-md w-full p-7 sm:p-9 text-center relative animate-scale-in">
        <div className="display text-[11px] tracking-[0.4em] uppercase text-muted-foreground mb-1">
          {result.cleared ? "Level Complete" : "Out of Moves"}
        </div>
        <h2 className="display text-4xl sm:text-5xl font-bold text-primary mb-1">{level.name}</h2>
        <div className="text-sm italic text-cream/70 mb-5">{level.region}</div>

        <div className="flex justify-center gap-3 mb-6 text-5xl">
          {[1, 2, 3].map((s) => (
            <span
              key={s}
              className={s <= result.stars ? "text-primary" : "text-muted-foreground/30"}
              style={
                s <= result.stars
                  ? {
                      textShadow: "0 0 30px oklch(0.85 0.20 75 / 0.9)",
                      animation: `scale-in 0.4s ease-out ${s * 0.15}s both`,
                    }
                  : undefined
              }
            >
              ★
            </span>
          ))}
        </div>

        <div className="tile-gold inline-block px-6 py-3 mb-7">
          <div className="text-[10px] uppercase tracking-wider opacity-80">Score</div>
          <div className="display text-3xl font-bold tabular-nums">
            {result.score.toLocaleString()}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={onReplay}
            className="tile flex-1 py-3 text-sm font-semibold uppercase tracking-wider hover:scale-[1.02] transition-transform"
          >
            Replay
          </button>
          <button
            onClick={onMap}
            className="tile flex-1 py-3 text-sm font-semibold uppercase tracking-wider hover:scale-[1.02] transition-transform"
          >
            Map
          </button>
          {onNext && result.cleared && (
            <button
              onClick={onNext}
              className="tile-gold flex-1 py-3 text-sm font-bold uppercase tracking-wider hover:scale-[1.02] transition-transform"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
