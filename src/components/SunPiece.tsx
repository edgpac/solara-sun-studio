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
        special && "is-special",
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
  // Subtle glyph stamped on top of the ceramic sun to mark a special piece.
  const label =
    type === "beam-h" ? "↔" : type === "beam-v" ? "↕" : type === "bomb" ? "✸" : "◉";
  return (
    <div
      className="absolute inset-0 grid place-items-center pointer-events-none"
      aria-hidden
    >
      <div
        className="display"
        style={{
          fontSize: "1.6em",
          fontWeight: 700,
          color: "var(--cream)",
          textShadow:
            "0 0 14px oklch(0.95 0.18 85 / 0.9), 0 2px 4px oklch(0 0 0 / 0.6)",
          mixBlendMode: "screen",
        }}
      >
        {label}
      </div>
    </div>
  );
}

export const SunPiece = memo(SunPieceBase);
