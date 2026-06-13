import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — SOL DE CABO™" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="min-h-screen scene-cabo px-6 py-12">
      <div className="max-w-2xl mx-auto relative z-10">
        <Link
          to="/"
          className="text-[10px] uppercase tracking-[0.3em] text-cream/50 hover:text-cream/80 transition-colors mb-8 inline-block"
        >
          ← Back
        </Link>

        <h1
          className="display font-bold mb-2"
          style={{
            fontSize: "clamp(2rem, 8vw, 3.5rem)",
            background: "linear-gradient(180deg, oklch(0.96 0.12 85), oklch(0.7 0.20 50))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Privacy Policy
        </h1>
        <p className="text-cream/50 text-sm mb-10">SOL DE CABO™ · Last updated June 2026</p>

        <div className="space-y-8 text-cream/80 text-sm leading-relaxed">

          <section>
            <h2 className="display text-lg font-bold text-primary mb-2">The short version</h2>
            <p>
              SOL DE CABO is a match-3 puzzle game. We do not collect your name, email address,
              phone number, or any personal information. No account is required to play.
            </p>
          </section>

          <section>
            <h2 className="display text-lg font-bold text-primary mb-2">What we store on your device</h2>
            <p className="mb-3">
              The game saves a small amount of data in your device's local storage so your progress
              is remembered between sessions:
            </p>
            <ul className="list-disc list-inside space-y-1 text-cream/70">
              <li>Your career score and level progress</li>
              <li>Your sound preference (on or off)</li>
            </ul>
            <p className="mt-3">
              This data never leaves your device and is not transmitted to any server.
              You can clear it at any time by clearing your browser or app storage.
            </p>
          </section>

          <section>
            <h2 className="display text-lg font-bold text-primary mb-2">World leaderboard</h2>
            <p>
              If you beat the world record score, you are given the option to enter up to
              3 initials (e.g. "HAL"). Only those initials and your score are stored on our
              server. No name, email, device ID, or IP address is retained alongside them.
              You are never required to submit initials — it is always optional.
            </p>
          </section>

          <section>
            <h2 className="display text-lg font-bold text-primary mb-2">Analytics & third parties</h2>
            <p>
              We do not use Google Analytics, Facebook Pixel, or any other third-party
              tracking or advertising service. No data is sold or shared with any third party.
            </p>
          </section>

          <section>
            <h2 className="display text-lg font-bold text-primary mb-2">Children</h2>
            <p>
              SOL DE CABO does not knowingly collect any information from children under 13.
              The game contains no advertising, no in-app purchases, and no social features
              that require personal information.
            </p>
          </section>

          <section>
            <h2 className="display text-lg font-bold text-primary mb-2">Changes to this policy</h2>
            <p>
              If we make material changes to this policy, we will update the date at the top
              of this page. Continued use of the game after changes are posted constitutes
              acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="display text-lg font-bold text-primary mb-2">Contact</h2>
            <p>
              Questions about this privacy policy? Reach us at{" "}
              <a
                href="mailto:tiktok.eddy6six@gmail.com"
                className="text-primary underline underline-offset-2"
              >
                tiktok.eddy6six@gmail.com
              </a>
            </p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-cream/10 text-center">
          <Link
            to="/"
            className="tile-gold px-8 py-3 display text-base font-bold tracking-wide uppercase inline-block hover:scale-[1.02] transition-transform"
          >
            Back to Game
          </Link>
        </div>
      </div>
    </main>
  );
}
