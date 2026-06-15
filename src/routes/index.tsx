import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import goldenSun from "@/assets/sun-golden.png";
import { loadProgress } from "@/lib/game/storage";
import { getChampion, type Champion } from "@/lib/api/topScore.functions";
import { DemoBoard } from "@/components/DemoBoard";
import { TournamentBanner } from "@/components/TournamentBanner";

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
    getChampion()
      .then((c) => {
        if (c && typeof c.score === "number" && typeof c.initials === "string") {
          setChampion(c);
        }
      })
      .catch(() => null);
  }, []);

  return (
    <main className="scene-cabo min-h-screen w-full flex flex-col items-center justify-center px-6 py-12 relative">
      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl">

        {/* Compact header capsule */}
        <div
          className="flex items-center gap-4 px-5 py-4 rounded-[2rem] mb-5 w-full max-w-xs"
          style={{
            background: "oklch(0.12 0.04 30 / 0.55)",
            border: "1px solid oklch(0.78 0.18 65 / 0.3)",
            backdropFilter: "blur(12px)",
          }}
        >
          <img
            src={goldenSun}
            alt="Sol de Cabo"
            width={64}
            height={64}
            className="w-12 h-12 sm:w-16 sm:h-16 drop-shadow-[0_4px_12px_oklch(0_0_0/0.5)] flex-shrink-0"
            style={{ animation: "sun-breathe 6s ease-in-out infinite" }}
          />
          <div className="text-left flex-1 min-w-0">
            <div className="text-[9px] uppercase tracking-[0.4em] text-cream/60 leading-none mb-1">
              Cabo San Lucas · México
            </div>
            <div
              className="display font-bold leading-none whitespace-nowrap"
              style={{
                fontSize: "clamp(1.15rem, 5.5vw, 1.75rem)",
                background: "linear-gradient(180deg, oklch(0.96 0.12 85), oklch(0.7 0.20 50))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              SOL <span className="italic font-normal">de</span> CABO
            </div>
            <div className="display italic text-xs text-cream/70 mt-0.5 mb-2">
              Match the Suns. Awaken the Light.
            </div>
            {champion ? (
              <div
                className="text-[10px] font-semibold tracking-wide tabular-nums"
                style={{
                  background: "linear-gradient(90deg, oklch(0.96 0.12 85), oklch(0.78 0.20 65))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                👑 {champion.initials} — {champion.score.toLocaleString()}
              </div>
            ) : careerTotal > 0 ? (
              <div
                className="text-[10px] font-semibold tracking-wide tabular-nums"
                style={{
                  background: "linear-gradient(90deg, oklch(0.96 0.12 85), oklch(0.78 0.20 65))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Your score: {careerTotal.toLocaleString()}
              </div>
            ) : null}
          </div>
        </div>

        <Link
          to="/map"
          className="tile-gold w-full max-w-xs px-8 py-5 display text-2xl font-bold tracking-wide uppercase text-center hover:scale-[1.03] active:scale-[0.98] transition-transform mb-5"
        >
          Play
        </Link>

        <TournamentBanner />

        <div className="w-full mt-4 mb-6">
          <DemoBoard />
        </div>

        <div className="text-[10px] tracking-[0.3em] uppercase text-cream/50">
          A handcrafted Match-3 experience
        </div>
        <Link
          to="/privacy"
          className="mt-2 text-[9px] tracking-[0.2em] uppercase text-cream/25 hover:text-cream/55 transition-colors"
        >
          Privacy Policy
        </Link>
      </div>
    </main>
  );
}
