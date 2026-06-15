import { memo } from "react";
import type { Cell } from "@/lib/game/engine";
import { SUN_IMAGES, SUN_NAMES, SUN_AURA } from "@/lib/game/art";

interface Props {
  cell: Cell;
  selected?: boolean;
  hint?: boolean;
}

function SunPieceBase({ cell, selected, hint }: Props) {
  const img = SUN_IMAGES[cell.color];
  const aura = SUN_AURA[cell.color];
  const special = cell.special !== "none";

  return (
    <div
      className={[
        "sun-piece",
        selected && "is-selected",
        hint && "is-hint",
        special && `is-special is-special-${cell.special}`,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ ["--aura" as string]: aura }}
    >
      {/* Rotating ray halo behind the sculpture — the SVG side of the hybrid */}
      <svg
        className="sun-piece-halo absolute"
        viewBox="-50 -50 100 100"
        aria-hidden
      >
        <defs>
          <radialGradient id={`g-${cell.color}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={aura} stopOpacity="0.55" />
            <stop offset="100%" stopColor={aura} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle r="48" fill={`url(#g-${cell.color})`} />
        <g className="halo-rays" stroke={aura} strokeWidth="1.5" strokeLinecap="round" opacity="0.85">
          {Array.from({ length: 16 }).map((_, i) => {
            const a = (i * Math.PI * 2) / 16;
            const r1 = 38;
            const r2 = 46;
            return (
              <line
                key={i}
                x1={Math.cos(a) * r1}
                y1={Math.sin(a) * r1}
                x2={Math.cos(a) * r2}
                y2={Math.sin(a) * r2}
              />
            );
          })}
        </g>
      </svg>

      <img
        className="sun-piece-img"
        src={img}
        alt={SUN_NAMES[cell.color]}
        draggable={false}
        loading="lazy"
        width={256}
        height={256}
      />

      {special && <SpecialBadge type={cell.special} />}
    </div>
  );
}

function SpecialBadge({ type }: { type: Cell["special"] }) {
  if (type === "none") return null;

  const label = type === "beam-h" ? "↔" : type === "beam-v" ? "↕" : type === "bomb" ? "✸" : "◉";

  // Each special gets a distinct color so players learn to recognize them at a glance.
  const [glowColor, textColor] =
    type === "bomb"
      ? ["oklch(0.80 0.25 25)", "oklch(1 0.20 30)"]       // red-orange
      : type === "eclipse"
      ? ["oklch(0.80 0.22 300)", "oklch(0.95 0.16 300)"]   // violet
      : ["oklch(0.80 0.22 230)", "oklch(0.95 0.20 220)"];  // electric blue (beams)

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden>
      {/* Directional streak overlay makes beam orientation obvious */}
      {type === "beam-h" && (
        <div
          className="absolute inset-x-0"
          style={{
            height: "26%",
            top: "37%",
            background: `linear-gradient(90deg, transparent 8%, ${glowColor.replace(")", " / 0.45)")} 40%, ${glowColor.replace(")", " / 0.45)")} 60%, transparent 92%)`,
            borderRadius: "3px",
          }}
        />
      )}
      {type === "beam-v" && (
        <div
          className="absolute inset-y-0"
          style={{
            width: "26%",
            left: "37%",
            background: `linear-gradient(180deg, transparent 8%, ${glowColor.replace(")", " / 0.45)")} 40%, ${glowColor.replace(")", " / 0.45)")} 60%, transparent 92%)`,
            borderRadius: "3px",
          }}
        />
      )}
      <div className="absolute inset-0 grid place-items-center">
        <div
          className="display"
          style={{
            fontSize: "1.5em",
            fontWeight: 700,
            color: textColor,
            textShadow: `0 0 12px ${glowColor}, 0 2px 4px oklch(0 0 0 / 0.6)`,
            mixBlendMode: "screen",
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

export const SunPiece = memo(SunPieceBase);
