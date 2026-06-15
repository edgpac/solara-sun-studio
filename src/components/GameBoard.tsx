import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  type Board,
  type Cell,
  type Pos,
  SIZE,
  createBoard,
  findHint,
  findMatches,
  isAdjacent,
  resolveStep,
  swap,
} from "@/lib/game/engine";
import { SunPiece } from "./SunPiece";
import { SUN_AURA, SUN_IMAGES } from "@/lib/game/art";
import { playMatch, playSwap, playLevelComplete, playSpecial } from "@/lib/game/audio";

const SWAP_MS = 180;
const POP_MS = 380;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

interface ExitingCell {
  uid: number;
  cell: Cell;
  pos: Pos;
}
interface Spark {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
}

interface Props {
  moves: number;
  targetThree: number;
  bonusMoves?: number;
  hintSignal?: number;
  shuffleSignal?: number;
  onComplete: (result: { score: number; stars: number; cleared: boolean }) => void;
  onStats?: (s: { score: number; moves: number; combo: number }) => void;
}

export function GameBoard({ moves: initialMoves, targetThree, bonusMoves = 0, hintSignal = 0, shuffleSignal = 0, onComplete, onStats }: Props) {
  // Empty placeholder on first render so SSR & client hydration agree.
  const [board, setBoard] = useState<Board>(() =>
    Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => null)),
  );
  useEffect(() => {
    setBoard(createBoard());
  }, []);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(initialMoves);
  const [selected, setSelected] = useState<Pos | null>(null);
  const [hintPair, setHintPair] = useState<[Pos, Pos] | null>(null);
  const [busy, setBusy] = useState(false);
  const [combo, setCombo] = useState(0);
  const [comboFlash, setComboFlash] = useState<{ key: number; text: string } | null>(null);
  const [exiting, setExiting] = useState<ExitingCell[]>([]);
  const [sparks, setSparks] = useState<Spark[]>([]);
  const sparkCounter = useRef(0);
  const exitCounter = useRef(0);

  useEffect(() => {
    onStats?.({ score, moves, combo });
  }, [score, moves, combo, onStats]);

  const boardRef = useRef<HTMLDivElement>(null);
  const [cellPx, setCellPx] = useState(48);
  const completedRef = useRef(false);
  const prevBonusRef = useRef(0);

  // When the parent grants bonus moves (e.g. after a rewarded ad), reset the
  // completion gate and inject the extra moves so the game continues.
  useEffect(() => {
    if (bonusMoves > prevBonusRef.current) {
      const added = bonusMoves - prevBonusRef.current;
      prevBonusRef.current = bonusMoves;
      completedRef.current = false;
      setMoves((m) => m + added);
    }
  }, [bonusMoves]);

  // Responsive cell size.
  useLayoutEffect(() => {
    if (!boardRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      setCellPx(Math.floor(w / SIZE));
    });
    ro.observe(boardRef.current);
    return () => ro.disconnect();
  }, []);

  // Hint after inactivity.
  useEffect(() => {
    if (busy) return;
    const t = setTimeout(() => {
      const h = findHint(board);
      if (h) setHintPair(h);
    }, 5000);
    return () => clearTimeout(t);
  }, [board, busy]);

  // Immediate hint on demand from booster bar.
  useEffect(() => {
    if (hintSignal === 0) return;
    const h = findHint(board);
    if (h) setHintPair(h);
  }, [hintSignal]); // eslint-disable-line react-hooks/exhaustive-deps

  // Shuffle board on demand from booster bar.
  useEffect(() => {
    if (shuffleSignal === 0) return;
    setBoard(createBoard());
    setSelected(null);
    setHintPair(null);
  }, [shuffleSignal]); // eslint-disable-line react-hooks/exhaustive-deps

  // End-of-level check.
  useEffect(() => {
    if (busy || completedRef.current) return;
    if (moves <= 0) {
      completedRef.current = true;
      const stars = score >= targetThree ? 3 : score >= targetThree * 0.6 ? 2 : score >= targetThree * 0.35 ? 1 : 0;
      console.log(`[SOL] GameBoard out-of-moves — score:${score} target:${targetThree} stars:${stars}`);
      playLevelComplete();
      setTimeout(() => onComplete({ score, stars, cleared: stars >= 1 }), 350);
    }
  }, [moves, score, busy, targetThree, onComplete]);

  const spawnSparks = useCallback((positions: Pos[], colors: number[]) => {
    if (!boardRef.current) return;
    const next: Spark[] = [];
    positions.forEach(([r, c], i) => {
      const color = SUN_AURA[colors[i] ?? 0];
      const cx = c * cellPx + cellPx / 2;
      const cy = r * cellPx + cellPx / 2;
      for (let k = 0; k < 6; k++) {
        const a = Math.random() * Math.PI * 2;
        const d = 30 + Math.random() * 40;
        next.push({
          id: ++sparkCounter.current,
          x: cx,
          y: cy,
          dx: Math.cos(a) * d,
          dy: Math.sin(a) * d,
          color,
        });
      }
    });
    setSparks((s) => [...s, ...next]);
    setTimeout(() => {
      setSparks((s) => s.filter((sp) => !next.some((n) => n.id === sp.id)));
    }, 900);
  }, [cellPx]);

  const performSwap = useCallback(
    async (a: Pos, b: Pos) => {
      if (busy || moves <= 0 || !isAdjacent(a, b)) return;
      setBusy(true);
      setHintPair(null);
      setSelected(null);

      // Capture special status before swap so we know what moved where.
      const aWasSpecial = board[a[0]][a[1]]?.special !== "none";
      const bWasSpecial = board[b[0]][b[1]]?.special !== "none";

      let curr = swap(board, a, b);
      setBoard(curr);
      await sleep(SWAP_MS);

      // After swap: aCell sits at b, bCell sits at a.
      const forced: Pos[] = [];
      if (aWasSpecial) forced.push(b);
      if (bWasSpecial) forced.push(a);

      // Reject if no normal match and no specials to activate.
      if (findMatches(curr).length === 0 && forced.length === 0) {
        curr = swap(curr, a, b);
        setBoard(curr);
        await sleep(SWAP_MS);
        setBusy(false);
        return;
      }

      setMoves((m) => m - 1);
      playSwap();

      let chain = 0;
      let chainScore = 0;
      let pivot: Pos | undefined = b;
      let pendingForce: Pos[] | undefined = forced.length > 0 ? forced : undefined;
      while (true) {
        const step = resolveStep(curr, pivot, pendingForce);
        pendingForce = undefined;
        if (!step.hadMatch) break;
        chain++;

        // Play special sound for any specials that fired this step.
        const firedSpecial = step.cleared.find(({ cell }) => cell.special !== "none");
        if (firedSpecial) {
          playSpecial(firedSpecial.cell.special as "beam-h" | "beam-v" | "bomb" | "eclipse");
        }
        playMatch(chain);
        pivot = undefined;

        const exits: ExitingCell[] = step.cleared.map(({ pos, cell }) => ({
          uid: ++exitCounter.current,
          pos,
          cell,
        }));
        setExiting((p) => [...p, ...exits]);

        spawnSparks(
          exits.map((e) => e.pos),
          exits.map((e) => e.cell.color),
        );

        const gained = step.scored * Math.max(1, chain);
        chainScore += gained;
        setScore((s) => s + gained);
        setCombo(chain);

        if (chain >= 2) {
          setComboFlash({
            key: Date.now(),
            text:
              chain >= 5
                ? "ECLIPSE!"
                : chain >= 4
                ? "DELICIOSO!"
                : chain >= 3
                ? "SUBLIME!"
                : "¡COMBO!",
          });
        }

        curr = step.board;
        setBoard(curr);
        await sleep(POP_MS);

        setExiting((p) => p.filter((e) => !exits.some((x) => x.uid === e.uid)));
      }

      setCombo(0);
      setComboFlash(null);
      setBusy(false);

      // Cascade replenishment: each chain step earns back 1 move.
      // chain=1 (single match) → net 0 moves spent.
      // chain=2 (one cascade) → net +1 move.
      // chain=3+ → the player gains moves, letting skilled play run indefinitely.
      if (chain > 0) {
        setMoves((m) => m + chain);
      }

      // Early victory: hit max stars threshold.
      if (!completedRef.current && score + chainScore >= targetThree && moves - 1 > 0) {
        completedRef.current = true;
        console.log(`[SOL] GameBoard early-victory — score:${score + chainScore} movesLeft:${moves - 1}`);
        playLevelComplete();
        setTimeout(
          () => onComplete({ score: score + chainScore, stars: 3, cleared: true }),
          400,
        );
      }
    },
    [board, busy, moves, score, targetThree, spawnSparks, onComplete],
  );

  // Pointer handling.
  const dragRef = useRef<{
    pos: Pos;
    x: number;
    y: number;
    moved: boolean;
    pid: number;
  } | null>(null);

  const handlePointerDown = (r: number, c: number) => (e: React.PointerEvent) => {
    if (busy || moves <= 0) return;
    dragRef.current = {
      pos: [r, c],
      x: e.clientX,
      y: e.clientY,
      moved: false,
      pid: e.pointerId,
    };
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || d.moved) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    const threshold = cellPx * 0.35;
    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;
    let target: Pos | null = null;
    if (Math.abs(dx) > Math.abs(dy)) {
      target = [d.pos[0], d.pos[1] + (dx > 0 ? 1 : -1)];
    } else {
      target = [d.pos[0] + (dy > 0 ? 1 : -1), d.pos[1]];
    }
    if (target[0] < 0 || target[0] >= SIZE || target[1] < 0 || target[1] >= SIZE) return;
    d.moved = true;
    void performSwap(d.pos, target);
  };
  const handlePointerUp = (r: number, c: number) => (_e: React.PointerEvent) => {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d || d.moved) return;
    // Tap-to-select / tap-second-to-swap.
    if (!selected) {
      setSelected([r, c]);
    } else if (selected[0] === r && selected[1] === c) {
      setSelected(null);
    } else if (isAdjacent(selected, [r, c])) {
      void performSwap(selected, [r, c]);
    } else {
      setSelected([r, c]);
    }
  };

  // Flat list of cells for stable-key absolute positioning.
  const flatCells = useMemo(() => {
    const out: { cell: Cell; r: number; c: number }[] = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const cell = board[r][c];
        if (cell) out.push({ cell, r, c });
      }
    }
    return out;
  }, [board]);

  const boardPx = cellPx * SIZE;
  const hintSet = useMemo(() => {
    if (!hintPair) return new Set<string>();
    return new Set(hintPair.map(([r, c]) => `${r},${c}`));
  }, [hintPair]);

  return (
    <div className="h-full w-full flex items-center justify-center">
      <div
        ref={boardRef}
        className="relative rounded-3xl overflow-hidden"
        style={{
          aspectRatio: "1 / 1",
          height: "100%",
          maxWidth: "100%",
          background:
            "radial-gradient(ellipse at 50% 30%, oklch(0.28 0.08 60 / 0.8), oklch(0.16 0.04 30 / 0.95))",
          boxShadow:
            "inset 0 2px 0 oklch(1 0 0 / 0.1), inset 0 -2px 0 oklch(0 0 0 / 0.4), 0 20px 50px -10px oklch(0 0 0 / 0.6), 0 0 0 1px oklch(0.78 0.18 65 / 0.3)",
        }}
        onPointerMove={handlePointerMove}
      >
        {/* Subtle grid lines for the Talavera-tile feel */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.78 0.18 65 / 0.18) 1px, transparent 1px), linear-gradient(90deg, oklch(0.78 0.18 65 / 0.18) 1px, transparent 1px)",
            backgroundSize: `${cellPx}px ${cellPx}px`,
          }}
        />

        {/* Board playfield */}
        <div className="absolute inset-0" style={{ width: boardPx, height: boardPx }}>
          {/* Active cells */}
          {flatCells.map(({ cell, r, c }) => {
            const isSel = selected?.[0] === r && selected?.[1] === c;
            const isHint = hintSet.has(`${r},${c}`);
            return (
              <div
                key={cell.id}
                className="absolute is-fall"
                style={{
                  width: cellPx,
                  height: cellPx,
                  transform: `translate(${c * cellPx}px, ${r * cellPx}px)`,
                  transition: "transform 220ms cubic-bezier(0.5, 0, 0.4, 1.1)",
                  padding: Math.max(2, cellPx * 0.04),
                }}
                onPointerDown={handlePointerDown(r, c)}
                onPointerUp={handlePointerUp(r, c)}
                onPointerCancel={() => (dragRef.current = null)}
              >
                <SunPiece cell={cell} selected={isSel} hint={isHint} />
              </div>
            );
          })}

          {/* Exiting cells (pop animation) */}
          {exiting.map((e) => (
            <div
              key={`x-${e.uid}`}
              className="absolute pointer-events-none"
              style={{
                width: cellPx,
                height: cellPx,
                transform: `translate(${e.pos[1] * cellPx}px, ${e.pos[0] * cellPx}px)`,
                padding: Math.max(2, cellPx * 0.04),
              }}
            >
              <div className="sun-piece is-pop">
                <img
                  className="sun-piece-img"
                  src={SUN_IMAGES[e.cell.color]}
                  alt=""
                  draggable={false}
                />
              </div>
            </div>
          ))}

          {/* Sparks */}
          {sparks.map((s) => (
            <div
              key={s.id}
              className="spark"
              style={{
                left: s.x - 4,
                top: s.y - 4,
                background: `radial-gradient(circle, oklch(1 0.1 85), ${s.color} 60%, transparent)`,
                ["--dx" as string]: `${s.dx}px`,
                ["--dy" as string]: `${s.dy}px`,
              }}
            />
          ))}
        </div>

        {/* Combo burst */}
        {comboFlash && (
          <div
            key={comboFlash.key}
            className="combo-burst"
            style={{ fontSize: `clamp(2.5rem, 12vw, 5rem)` }}
          >
            {comboFlash.text}
          </div>
        )}
      </div>
    </div>
  );
}
