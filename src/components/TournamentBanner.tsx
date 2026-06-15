import { useEffect, useRef, useState } from "react";
import { getTournamentStatus, type TournamentStatus } from "@/lib/api/tournament.functions";

export const INITIALS_KEY = "sol:initials";
export const UID_KEY = "sol:uid";

function getOrCreateUid(): string {
  let uid = localStorage.getItem(UID_KEY);
  if (!uid) {
    uid = crypto.randomUUID();
    localStorage.setItem(UID_KEY, uid);
  }
  return uid;
}

interface TimeLeft {
  label: string;       // display string e.g. "3d 14h left"
  hoursLeft: number;   // raw hours remaining (for late-entry logic)
}

function calcTimeLeft(endsAt: number): TimeLeft {
  const ms = endsAt - Date.now();
  if (ms <= 0) return { label: "Ending…", hoursLeft: 0 };
  const days = Math.floor(ms / 86_400_000);
  const hrs = Math.floor((ms % 86_400_000) / 3_600_000);
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  const totalHours = days * 24 + hrs;
  if (days > 0) return { label: `${days}d ${hrs}h left`, hoursLeft: totalHours };
  if (hrs > 0)  return { label: `${hrs}h ${mins}m left`, hoursLeft: totalHours };
  return { label: `${mins}m left`, hoursLeft: 0 };
}

const MEDALS = ["🥇", "🥈", "🥉"];

export function TournamentBanner() {
  const [uid] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return getOrCreateUid();
  });
  const [initials, setInitials] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(INITIALS_KEY) ?? "";
  });
  const [inputVal, setInputVal] = useState("");
  const [status, setStatus] = useState<TournamentStatus | null>(null);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ label: "", hoursLeft: 168 });
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    getTournamentStatus({ data: { uid, initials: initials || undefined } })
      .then((s) => {
        if (
          s &&
          typeof s.endsAt === "number" &&
          Array.isArray(s.topPlayers) &&
          typeof s.totalPlayers === "number" &&
          Array.isArray(s.netPrizes)
        ) {
          setStatus(s);
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [uid, initials]);

  useEffect(() => {
    if (!status) return;
    const update = () => setTimeLeft(calcTimeLeft(status.endsAt));
    update();
    const t = setInterval(update, 60_000);
    return () => clearInterval(t);
  }, [status?.endsAt]);

  function saveInitials() {
    const v = inputVal.trim().toUpperCase().slice(0, 3);
    if (!v) return;
    localStorage.setItem(INITIALS_KEY, v);
    setInitials(v);
    setInputVal("");
  }

  if (loading || !status) return null;

  const showPrizeBanner = status.lastWeekPrize > 0;
  const showJoinForm = !initials;
  const top3 = status.topPlayers.slice(0, 3);
  const inPrizeZone = status.myRank !== null && status.myRank <= 10;
  const isLastDay = timeLeft.hoursLeft > 0 && timeLeft.hoursLeft <= 24;
  const isNewEntrant = status.myRank === null && initials;

  // Late-entry nudge: has initials but no score yet, and less than 24h remain
  const showLateEntryNudge = isLastDay && isNewEntrant;
  // Final-hours warning for players already competing
  const showFinalPush = isLastDay && !isNewEntrant && status.myRank !== null;

  return (
    <div
      className="w-full max-w-xs rounded-2xl overflow-hidden mt-1"
      style={{
        background: "oklch(0.12 0.04 30 / 0.55)",
        border: "1px solid oklch(0.78 0.18 65 / 0.25)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Prize won notification */}
      {showPrizeBanner && (
        <div
          className="px-4 py-2.5 text-center text-[11px] font-semibold tracking-wide"
          style={{
            background: "linear-gradient(90deg, oklch(0.68 0.18 75 / 0.35), oklch(0.62 0.20 50 / 0.35))",
            borderBottom: "1px solid oklch(0.78 0.18 65 / 0.3)",
            color: "oklch(0.96 0.12 85)",
          }}
        >
          🪙 You won {status.lastWeekPrize} coins last week!
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span
          className="display text-[11px] uppercase tracking-[0.3em] font-semibold"
          style={{ color: "oklch(0.82 0.16 82)" }}
        >
          🏆 Weekly Tournament
        </span>
        <span
          className="text-[9px] tracking-wide font-medium"
          style={{ color: isLastDay ? "oklch(0.72 0.20 25)" : "oklch(0.65 0.04 70)" }}
        >
          {timeLeft.label}
        </span>
      </div>

      {/* Top 3 */}
      {top3.length > 0 ? (
        <div className="px-4 pb-2 space-y-1">
          {top3.map((p) => (
            <div key={`${p.rank}-${p.initials}`} className="flex items-center gap-2 text-[11px]">
              <span>{MEDALS[p.rank - 1]}</span>
              <span
                className="font-bold tracking-widest flex-shrink-0"
                style={{ color: p.initials === initials ? "oklch(0.96 0.12 85)" : "oklch(0.75 0.03 70)" }}
              >
                {p.initials}
              </span>
              <span className="flex-1 text-right tabular-nums" style={{ color: "oklch(0.65 0.03 70)" }}>
                {p.score.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 pb-2 text-[10px]" style={{ color: "oklch(0.55 0.03 70)" }}>
          No scores yet — be the first!
        </div>
      )}

      <div style={{ borderTop: "1px solid oklch(0.78 0.18 65 / 0.12)" }} />

      {/* My status or join form */}
      <div className="px-4 py-2.5 space-y-1.5">
        {showJoinForm ? (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value.toUpperCase().slice(0, 3))}
              onKeyDown={(e) => e.key === "Enter" && saveInitials()}
              maxLength={3}
              placeholder="AAA"
              className="w-16 text-center display text-sm font-bold bg-transparent border rounded-lg py-1 tracking-[0.3em] outline-none focus:ring-0"
              style={{ borderColor: "oklch(0.78 0.18 65 / 0.4)", color: "oklch(0.96 0.12 85)" }}
            />
            <button
              onClick={saveInitials}
              disabled={!inputVal.trim()}
              className="flex-1 text-[10px] uppercase tracking-wide font-semibold py-1 rounded-lg transition-opacity disabled:opacity-40"
              style={{
                background: "oklch(0.68 0.14 75 / 0.35)",
                color: "oklch(0.96 0.12 85)",
                border: "1px solid oklch(0.78 0.18 65 / 0.3)",
              }}
            >
              Join tournament
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between text-[10px]">
            {status.myRank !== null ? (
              <span>
                <span style={{ color: "oklch(0.82 0.16 82)" }}>{initials}</span>
                <span style={{ color: "oklch(0.55 0.03 70)" }}> · </span>
                <span style={{ color: "oklch(0.96 0.12 85)", fontWeight: 600 }}>
                  #{status.myRank}
                </span>
                <span style={{ color: "oklch(0.55 0.03 70)" }}>
                  {" "}of {status.totalPlayers.toLocaleString()} players
                </span>
              </span>
            ) : (
              <span style={{ color: "oklch(0.55 0.03 70)" }}>
                <span style={{ color: "oklch(0.82 0.16 82)" }}>{initials}</span>
                {" · Play to enter"}
              </span>
            )}
            <span style={{ color: "oklch(0.82 0.16 82)" }}>🪙 {status.myCoins}</span>
          </div>
        )}

        {/* Spots from prize */}
        {status.spotsFromPrize !== null && (
          <div className="text-[9px] tracking-wide" style={{ color: "oklch(0.72 0.16 82)" }}>
            {status.spotsFromPrize === 1
              ? "1 spot from a prize — one more good run!"
              : `${status.spotsFromPrize} spots from the prize zone 🪙`}
          </div>
        )}

        {/* Already in prize zone */}
        {inPrizeZone && (
          <div className="text-[9px] tracking-wide" style={{ color: "oklch(0.72 0.20 145)" }}>
            You're in the prize zone — defend your rank!
          </div>
        )}

        {/* Final-hours push for active players */}
        {showFinalPush && (
          <div className="text-[9px] tracking-wide" style={{ color: "oklch(0.72 0.20 25)" }}>
            Final day! This is your last chance to move up before Monday reset.
          </div>
        )}

        {/* Late-entry nudge: registered but no score yet, last day */}
        {showLateEntryNudge && (
          <div className="text-[9px] leading-snug" style={{ color: "oklch(0.68 0.04 70)" }}>
            Only {timeLeft.hoursLeft}h left in this week's tournament.
            Play now for a shot, or Monday starts a fresh one.
          </div>
        )}
      </div>

      {/* Prize pool + reset schedule */}
      <div
        className="px-4 pt-1.5 pb-1 text-center text-[8px] tracking-[0.18em] uppercase"
        style={{ borderTop: "1px solid oklch(0.78 0.18 65 / 0.12)", color: "oklch(0.50 0.03 70)" }}
      >
        1st {status.netPrizes[0]}🪙 · 2nd {status.netPrizes[1]}🪙 · 3rd {status.netPrizes[2]}🪙
      </div>
      <div
        className="px-4 pb-1.5 text-center text-[8px] tracking-[0.14em]"
        style={{ color: "oklch(0.44 0.03 70)" }}
      >
        Resets every Monday at midnight UTC
      </div>

      {/* Browser data warning */}
      <div
        className="px-4 py-2 text-center text-[8px] leading-snug"
        style={{ borderTop: "1px solid oklch(0.78 0.18 65 / 0.10)", color: "oklch(0.48 0.03 70)" }}
      >
        ⚠ Your rank &amp; coins live in this browser.
        <br />
        Do not clear your site data — you will lose your spot.
      </div>
    </div>
  );
}
