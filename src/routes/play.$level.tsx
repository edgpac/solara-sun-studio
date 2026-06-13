import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { GameBoard } from "@/components/GameBoard";
import { HUD } from "@/components/HUD";
import { getLevel, type Level } from "@/lib/game/levels";
import { saveLevelResult, addToCareerTotal } from "@/lib/game/storage";
import { getSessionBase, advanceSession } from "@/lib/game/sessionScore";
import { getChampion, submitScore, type Champion } from "@/lib/api/topScore.functions";

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
  sessionTotal: number;
  careerTotal: number;
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

  return <Session key={level.id} level={level} sessionBase={getSessionBase()} navigateBack={() => navigate({ to: "/map" })} navigate={navigate} />;
}

function Session({
  level,
  sessionBase,
  navigateBack,
  navigate,
}: {
  level: Level;
  sessionBase: number;
  navigateBack: () => void;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const [stats, setStats] = useState({ score: 0, moves: level.moves, combo: 0 });
  const [done, setDone] = useState<CompletionState | null>(null);
  const [seed, setSeed] = useState(0);

  const handleComplete = useCallback(
    (r: { score: number; stars: number; cleared: boolean }) => {
      console.log(`[SOL] level ${level.id} complete — stars:${r.stars} score:${r.score} cleared:${r.cleared}`);
      saveLevelResult(level.id, r.stars, r.score);
      advanceSession(r.score);
      const { careerTotal } = addToCareerTotal(r.score);
      setDone({ ...r, sessionTotal: sessionBase + r.score, careerTotal });
    },
    [level.id, sessionBase],
  );

  const nextLevel = getLevel(level.id + 1);
  console.log(`[SOL] Session mounted — level:${level.id} nextLevel:${nextLevel.id} moves:${level.moves}`);

  return (
    <main className="scene-cabo min-h-screen w-full pb-10 relative">
      <div className="relative z-10">
        <HUD
          level={level.id}
          region={level.region}
          name={level.name}
          score={stats.score}
          sessionScore={sessionBase + stats.score}
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
                  console.log(`[SOL] Next clicked — navigating to level ${nextLevel.id}`);
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
  const [champion, setChampion] = useState<Champion | null>(null);
  const [initials, setInitials] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getChampion().then(setChampion).catch(() => null);
  }, []);

  const isNewRecord = champion === null || result.sessionTotal > champion.score;
  const showInitialsForm = isNewRecord && !submitted;

  useEffect(() => {
    if (showInitialsForm) setTimeout(() => inputRef.current?.focus(), 300);
  }, [showInitialsForm]);

  async function handleSubmitInitials() {
    if (!initials.trim()) return;
    setSubmitting(true);
    try {
      const res = await submitScore({ data: { score: result.sessionTotal, initials: initials.trim() } });
      setChampion(res.champion);
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

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

        <div className="flex justify-center gap-3 mb-5 text-5xl">
          {[1, 2, 3].map((s) => (
            <span
              key={s}
              className={s <= result.stars ? "text-primary" : "text-muted-foreground/30"}
              style={
                s <= result.stars
                  ? { textShadow: "0 0 30px oklch(0.85 0.20 75 / 0.9)", animation: `scale-in 0.4s ease-out ${s * 0.15}s both` }
                  : undefined
              }
            >★</span>
          ))}
        </div>

        {/* Session score */}
        <div className="mb-1">
          <div className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground mb-1">Session Score</div>
          <div
            className="display font-bold tabular-nums text-primary"
            style={{ fontSize: "clamp(2.2rem, 11vw, 4rem)", textShadow: "0 0 40px oklch(0.85 0.20 75 / 0.6)" }}
          >
            {result.sessionTotal.toLocaleString()}
          </div>
        </div>
        <div className="text-[9px] uppercase tracking-wider text-muted-foreground/60 mb-5">
          +{result.score.toLocaleString()} this level · career {result.careerTotal.toLocaleString()}
        </div>

        {/* New record flow */}
        {showInitialsForm && (
          <div className="tile-gold px-5 py-4 mb-5 animate-scale-in">
            <div className="display text-xs tracking-[0.3em] uppercase mb-2">🏆 New World Record!</div>
            <div className="text-[10px] text-foreground/70 mb-3">Enter your initials</div>
            <div className="flex items-center gap-2 justify-center">
              <input
                ref={inputRef}
                value={initials}
                onChange={(e) => setInitials(e.target.value.toUpperCase().slice(0, 3))}
                onKeyDown={(e) => e.key === "Enter" && void handleSubmitInitials()}
                maxLength={3}
                placeholder="AAA"
                className="w-20 text-center display text-2xl font-bold bg-background/40 border border-primary/40 rounded-lg py-2 tracking-[0.4em] outline-none focus:border-primary"
              />
              <button
                onClick={() => void handleSubmitInitials()}
                disabled={submitting || !initials.trim()}
                className="tile px-4 py-2 text-sm font-bold uppercase tracking-wide disabled:opacity-40"
              >
                {submitting ? "…" : "Save"}
              </button>
            </div>
          </div>
        )}

        {submitted && isNewRecord && (
          <div className="tile-gold px-5 py-3 mb-5 animate-scale-in">
            <div className="display text-sm tracking-[0.2em] uppercase">
              🏆 {initials} — {result.sessionTotal.toLocaleString()} · World Record!
            </div>
          </div>
        )}

        {!isNewRecord && champion && (
          <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-5">
            Champion: {champion.initials} — {champion.score.toLocaleString()}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button onClick={onReplay} className="tile flex-1 py-3 text-sm font-semibold uppercase tracking-wider hover:scale-[1.02] transition-transform">
            Replay
          </button>
          <button onClick={onMap} className="tile flex-1 py-3 text-sm font-semibold uppercase tracking-wider hover:scale-[1.02] transition-transform">
            Map
          </button>
          {onNext && (
            <button onClick={onNext} className="tile-gold flex-1 py-3 text-sm font-bold uppercase tracking-wider hover:scale-[1.02] transition-transform">
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
