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
    <main
      className="scene-cabo min-h-screen w-full flex flex-col items-center justify-center px-5 relative"
      style={{
        paddingTop: "calc(var(--sat, env(safe-area-inset-top, 0px)) + 2rem)",
        paddingBottom: "calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 2rem)",
      }}
    >
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm sm:max-w-md">

        {/* ── Sun "album art" — large, centered, floating ── */}
        <div className="relative mb-6">
          {/* Glow ring behind the sun */}
          <div
            className="absolute inset-0 rounded-full blur-3xl"
            style={{ background: "oklch(0.82 0.20 75 / 0.45)", transform: "scale(1.3)" }}
          />
          <img
            src={goldenSun}
            alt="Sol de Cabo"
            width={180}
            height={180}
            className="relative w-36 h-36 sm:w-44 sm:h-44 drop-shadow-[0_8px_32px_oklch(0_0_0/0.7)]"
            style={{ animation: "sun-breathe 6s ease-in-out infinite" }}
          />
        </div>

        {/* ── Title block — Spotify-style content-first text ── */}
        <div className="text-center mb-1">
          <div className="text-[10px] uppercase tracking-[0.55em] text-cream/50 mb-2">
            Cabo San Lucas · México
          </div>
          <h1
            className="display font-bold leading-none mb-2"
            style={{
              fontSize: "clamp(2.4rem, 12vw, 3.8rem)",
              background: "linear-gradient(180deg, oklch(0.98 0.06 85) 0%, oklch(0.82 0.20 65) 60%, oklch(0.65 0.22 45) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.02em",
            }}
          >
            SOL <span className="italic font-light">de</span> CABO
          </h1>
          <p className="display italic text-sm sm:text-base text-cream/60 tracking-wide">
            Match the Suns. Awaken the Light.
          </p>
        </div>

        {/* Champion or career score badge */}
        {(champion?.score != null || careerTotal > 0) && (
          <div
            className="mt-3 mb-5 px-4 py-1.5 text-xs font-semibold tracking-widest uppercase tabular-nums"
            style={{
              background: "oklch(0.10 0.02 30 / 0.7)",
              border: "1px solid oklch(0.78 0.18 65 / 0.4)",
              borderRadius: "9999px",
              color: "oklch(0.88 0.14 80)",
            }}
          >
            {champion?.score != null
              ? `👑 ${champion.initials} · ${champion.score.toLocaleString()}`
              : `Your best · ${careerTotal.toLocaleString()}`}
          </div>
        )}

        {/* ── PLAY — the hero CTA ── */}
        <Link
          to="/map"
          className="tile-gold w-full py-5 sm:py-6 display text-3xl sm:text-4xl font-bold tracking-widest uppercase text-center hover:scale-[1.03] active:scale-[0.97] transition-transform mt-4 mb-3"
        >
          Play
        </Link>

        <TournamentBanner />

        {/* Demo board */}
        <div className="w-full mt-5 mb-4">
          <DemoBoard />
        </div>

        <div className="text-[9px] tracking-[0.35em] uppercase text-cream/35">
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
