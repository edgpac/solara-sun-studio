import { useEffect, useMemo, useRef, useState } from "react";
import {
  type Board,
  type Cell,
  type Pos,
  SIZE,
  createBoard,
  findHint,
  resolveStep,
  swap,
} from "@/lib/game/engine";

// Show only a 5×5 window of the 8×8 board — bigger pieces, clearer demo
const DEMO_SIZE = 5;
import { SUN_AURA, SUN_IMAGES } from "@/lib/game/art";

const SWAP_MS = 120;
const POP_MS = 200;
const MOVE_INTERVAL = 700;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

interface ExitingCell { uid: number; cell: Cell; pos: Pos }
interface Spark { id: number; x: number; y: number; dx: number; dy: number; color: string }

export function DemoBoard() {
  const [board, setBoard] = useState<Board>(() =>
    Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => null)),
  );
  useEffect(() => { setBoard(createBoard()); }, []);

  const [exiting, setExiting] = useState<ExitingCell[]>([]);
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [swapPair, setSwapPair] = useState<[Pos, Pos] | null>(null);
  const exitCounter = useRef(0);
  const sparkCounter = useRef(0);
  const boardRef = useRef<HTMLDivElement>(null);
  const [cellPx, setCellPx] = useState(36);
  const busyRef = useRef(false);

  useEffect(() => {
    if (!boardRef.current) return;
    const ro = new ResizeObserver((e) => {
      setCellPx(Math.floor(e[0].contentRect.width / DEMO_SIZE));
    });
    ro.observe(boardRef.current);
    return () => ro.disconnect();
  }, []);

  function spawnSparks(positions: Pos[], colors: number[]) {
    const next: Spark[] = [];
    positions.forEach(([r, c], i) => {
      const color = SUN_AURA[colors[i] ?? 0];
      const cx = c * cellPx + cellPx / 2;
      const cy = r * cellPx + cellPx / 2;
      for (let k = 0; k < 5; k++) {
        const a = Math.random() * Math.PI * 2;
        const d = 20 + Math.random() * 30;
        next.push({ id: ++sparkCounter.current, x: cx, y: cy, dx: Math.cos(a) * d, dy: Math.sin(a) * d, color });
      }
    });
    setSparks((s) => [...s, ...next]);
    setTimeout(() => setSparks((s) => s.filter((sp) => !next.some((n) => n.id === sp.id))), 800);
  }

  useEffect(() => {
    let cancelled = false;

    async function autoPlay() {
      while (!cancelled) {
        await sleep(MOVE_INTERVAL);
        if (cancelled) break;
        if (busyRef.current) continue;

        setBoard((curr) => {
          const hint = findHint(curr);
          if (!hint) {
            // Reset board if no moves
            setTimeout(() => { if (!cancelled) setBoard(createBoard()); }, 100);
            return curr;
          }

          const [a, b] = hint;
          busyRef.current = true;
          setSwapPair([a, b]);

          (async () => {
            let current = swap(curr, a, b);
            setBoard(current);
            await sleep(SWAP_MS);
            setSwapPair(null);

            let pivot: Pos | undefined = b;
            while (!cancelled) {
              const step = resolveStep(current, pivot);
              if (!step.hadMatch) break;
              pivot = undefined;

              const exits: ExitingCell[] = step.cleared.map(({ pos, cell }) => ({
                uid: ++exitCounter.current, pos, cell,
              }));
              setExiting((p) => [...p, ...exits]);
              spawnSparks(exits.map((e) => e.pos), exits.map((e) => e.cell.color));

              current = step.board;
              setBoard(current);
              await sleep(POP_MS);
              setExiting((p) => p.filter((e) => !exits.some((x) => x.uid === e.uid)));
            }
            busyRef.current = false;
          })();

          return curr;
        });
      }
    }

    void autoPlay();
    return () => { cancelled = true; };
  }, [cellPx]);

  const flatCells = useMemo(() => {
    const out: { cell: Cell; r: number; c: number }[] = [];
    for (let r = 0; r < DEMO_SIZE; r++)
      for (let c = 0; c < DEMO_SIZE; c++) {
        const cell = board[r][c];
        if (cell) out.push({ cell, r, c });
      }
    return out;
  }, [board]);

  // Only show exiting cells within the demo window
  const visibleExiting = exiting.filter(
    (e) => e.pos[0] < DEMO_SIZE && e.pos[1] < DEMO_SIZE,
  );

  const boardPx = cellPx * DEMO_SIZE;

  return (
    <div className="w-full max-w-sm mx-auto px-3 relative">
      {/* Label */}
      <div className="text-center mb-2">
        <span className="text-[9px] uppercase tracking-[0.35em] text-cream/40">
          How to play — swap suns to match 3 or more
        </span>
      </div>

      <div
        ref={boardRef}
        className="relative w-full aspect-square rounded-2xl overflow-hidden opacity-85"
        style={{
          background: "radial-gradient(ellipse at 50% 30%, oklch(0.28 0.08 60 / 0.8), oklch(0.16 0.04 30 / 0.95))",
          boxShadow: "inset 0 2px 0 oklch(1 0 0 / 0.08), 0 12px 40px -8px oklch(0 0 0 / 0.5), 0 0 0 1px oklch(0.78 0.18 65 / 0.2)",
        }}
      >
        {/* Grid lines */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: "linear-gradient(oklch(0.78 0.18 65 / 0.18) 1px, transparent 1px), linear-gradient(90deg, oklch(0.78 0.18 65 / 0.18) 1px, transparent 1px)",
            backgroundSize: `${cellPx}px ${cellPx}px`,
          }}
        />

        <div className="absolute inset-0 pointer-events-none" style={{ width: boardPx, height: boardPx }}>
          {flatCells.map(({ cell, r, c }) => {
            const isSwapping = swapPair?.some(([sr, sc]) => sr === r && sc === c);
            return (
              <div
                key={cell.id}
                className="absolute is-fall"
                style={{
                  width: cellPx, height: cellPx,
                  transform: `translate(${c * cellPx}px, ${r * cellPx}px)`,
                  transition: "transform 220ms cubic-bezier(0.5, 0, 0.4, 1.1)",
                  padding: Math.max(1, cellPx * 0.04),
                  filter: isSwapping ? "brightness(1.3)" : undefined,
                }}
              >
                <div className="sun-piece" style={{ width: "100%", height: "100%" }}>
                  <img className="sun-piece-img" src={SUN_IMAGES[cell.color]} alt="" draggable={false} />
                </div>
              </div>
            );
          })}

          {visibleExiting.map((e) => (
            <div
              key={`x-${e.uid}`}
              className="absolute pointer-events-none"
              style={{
                width: cellPx, height: cellPx,
                transform: `translate(${e.pos[1] * cellPx}px, ${e.pos[0] * cellPx}px)`,
                padding: Math.max(1, cellPx * 0.04),
              }}
            >
              <div className="sun-piece is-pop">
                <img className="sun-piece-img" src={SUN_IMAGES[e.cell.color]} alt="" draggable={false} />
              </div>
            </div>
          ))}

          {sparks.map((s) => (
            <div
              key={s.id}
              className="spark"
              style={{
                left: s.x - 4, top: s.y - 4,
                background: `radial-gradient(circle, oklch(1 0.1 85), ${s.color} 60%, transparent)`,
                ["--dx" as string]: `${s.dx}px`,
                ["--dy" as string]: `${s.dy}px`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
