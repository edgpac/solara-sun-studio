import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import goldenSun from "@/assets/sun-golden.png";
import { loadProgress } from "@/lib/game/storage";
import { getChampion, type Champion } from "@/lib/api/topScore.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SOL DE CABO™ — Match the Suns. Awaken the Light." },
      {
        name: "description",
        content:
          "A luxury Match-3 game starring handcrafted Mexican ceramic sun faces inspired by Talavera pottery and Baja California Sur.",
      },
      { property: "og:title", content: "SOL DE CABO™" },
      {
        property: "og:description",
        content: "Match the Suns. Awaken the Light. A premium Match-3 inspired by Mexican folk art.",
      },
    ],
  }),
  component: Title,
});

function Title() {
  const [careerTotal, setCareerTotal] = useState(0);
  const [champion, setChampion] = useState<Champion | null>(null);

  useEffect(() => {
    setCareerTotal(loadProgress().careerTotal);
    getChampion().then(setChampion).catch(() => null);
  }, []);

  return (
    <main className="scene-cabo min-h-screen w-full flex flex-col items-center justify-center px-6 py-12 relative">
      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl">
        <div className="relative mb-2 sm:mb-4">
          <div
            className="absolute inset-0 -m-12 rounded-full blur-3xl opacity-70"
            style={{
              background:
                "radial-gradient(circle, oklch(0.95 0.18 85 / 0.7), oklch(0.78 0.20 65 / 0.3) 50%, transparent 70%)",
            }}
          />
          <img
            src={goldenSun}
            alt="Golden Talavera Sun"
            width={420}
            height={420}
            className="relative w-[240px] sm:w-[340px] md:w-[420px] drop-shadow-[0_30px_60px_oklch(0_0_0/0.6)]"
            style={{ animation: "sun-breathe 6s ease-in-out infinite" }}
          />
        </div>

        <div className="display text-[11px] sm:text-xs tracking-[0.5em] uppercase text-cream/80 mb-2">
          Cabo San Lucas · México
        </div>
        <h1
          className="display font-bold leading-[0.9] mb-3"
          style={{
            fontSize: "clamp(3rem, 12vw, 6.5rem)",
            background: "linear-gradient(180deg, oklch(0.96 0.12 85), oklch(0.7 0.20 50))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "0 4px 30px oklch(0.78 0.20 65 / 0.4)",
          }}
        >
          SOL <span className="italic font-normal">de</span> CABO
        </h1>
        <p className="display italic text-lg sm:text-xl text-cream/90 mb-6 max-w-md">
          Match the Suns. Awaken the Light.
        </p>

        {champion && (
          <div className="mb-3 text-center">
            <div className="text-[9px] uppercase tracking-[0.3em] text-cream/50 mb-1">
              👑 World Champion
            </div>
            <div
              className="display font-bold tabular-nums"
              style={{
                fontSize: "clamp(1.8rem, 8vw, 3rem)",
                background: "linear-gradient(180deg, oklch(0.96 0.12 85), oklch(0.7 0.20 50))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "0 0 40px oklch(0.78 0.20 65 / 0.5)",
              }}
            >
              {champion.initials} — {champion.score.toLocaleString()}
            </div>
          </div>
        )}

        {careerTotal > 0 && (
          <div className="mb-8 text-center">
            <div className="text-[9px] uppercase tracking-[0.3em] text-cream/40 mb-1">
              Your Career Score
            </div>
            <div className="display text-xl font-bold tabular-nums text-cream/60">
              {careerTotal.toLocaleString()}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link
            to="/map"
            className="tile-gold px-8 py-5 display text-2xl font-bold tracking-wide uppercase text-center hover:scale-[1.03] active:scale-[0.98] transition-transform"
          >
            Play
          </Link>
          <Link
            to="/map"
            className="tile px-8 py-4 text-sm font-semibold tracking-wide uppercase text-center text-foreground/90 hover:scale-[1.02] transition-transform"
          >
            World Map
          </Link>
        </div>

        <div className="mt-10 text-[10px] tracking-[0.3em] uppercase text-cream/50">
          A handcrafted Match-3 experience
        </div>
      </div>
    </main>
  );
}
