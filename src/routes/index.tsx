import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import goldenSun from "@/assets/sun-golden.png";
import { loadProgress } from "@/lib/game/storage";
import { getChampion, type Champion } from "@/lib/api/topScore.functions";
import { DemoBoard } from "@/components/DemoBoard";


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
        {/* Mask — smaller so Play button stays above the fold */}
        <div className="relative mb-1">
          <div
            className="absolute inset-0 -m-8 rounded-full blur-3xl opacity-60"
            style={{
              background:
                "radial-gradient(circle, oklch(0.95 0.18 85 / 0.7), oklch(0.78 0.20 65 / 0.3) 50%, transparent 70%)",
            }}
          />
          <img
            src={goldenSun}
            alt="Golden Talavera Sun"
            width={280}
            height={280}
            className="relative w-[140px] sm:w-[200px] md:w-[280px] drop-shadow-[0_20px_40px_oklch(0_0_0/0.6)]"
            style={{ animation: "sun-breathe 6s ease-in-out infinite" }}
          />
        </div>

        <div className="display text-[10px] sm:text-xs tracking-[0.5em] uppercase text-cream/80 mb-1">
          Cabo San Lucas · México
        </div>
        <h1
          className="display font-bold leading-[0.9] mb-2"
          style={{
            fontSize: "clamp(2.6rem, 11vw, 6rem)",
            background: "linear-gradient(180deg, oklch(0.96 0.12 85), oklch(0.7 0.20 50))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "0 4px 30px oklch(0.78 0.20 65 / 0.4)",
          }}
        >
          SOL <span className="italic font-normal">de</span> CABO
        </h1>
        <p className="display italic text-base sm:text-lg text-cream/90 mb-5 max-w-md">
          Match the Suns. Awaken the Light.
        </p>

        {/* Play button — above the fold on every phone */}
        <div className="flex flex-col gap-3 w-full max-w-xs mb-6">
          <Link
            to="/map"
            className="tile-gold px-8 py-5 display text-2xl font-bold tracking-wide uppercase text-center hover:scale-[1.03] active:scale-[0.98] transition-transform"
          >
            Play
          </Link>
          <Link
            to="/map"
            className="tile px-8 py-3 text-sm font-semibold tracking-wide uppercase text-center text-foreground/90 hover:scale-[1.02] transition-transform"
          >
            World Map
          </Link>
        </div>

        {/* Everything below is discoverable on scroll */}
        {champion && (
          <div className="mb-2 text-center">
            <div className="text-[9px] uppercase tracking-[0.3em] text-cream/50 mb-1">
              👑 World Champion
            </div>
            <div
              className="display font-bold tabular-nums"
              style={{
                fontSize: "clamp(1.5rem, 7vw, 2.5rem)",
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
          <div className="mb-5 text-center">
            <div className="text-[9px] uppercase tracking-[0.3em] text-cream/40 mb-1">
              Your Career Score
            </div>
            <div className="display text-xl font-bold tabular-nums text-cream/60">
              {careerTotal.toLocaleString()}
            </div>
          </div>
        )}

        <div className="w-full mb-6">
          <DemoBoard />
        </div>

        <div className="text-[10px] tracking-[0.3em] uppercase text-cream/50">
          A handcrafted Match-3 experience
        </div>
      </div>
    </main>
  );
}
