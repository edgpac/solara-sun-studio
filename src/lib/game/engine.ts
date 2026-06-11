// Match-3 engine — pure functions, no React.
// Board: 8×8 of Cell|null. Pieces have stable ids for animation continuity.

export type Color = 0 | 1 | 2 | 3 | 4 | 5;
export type Special = "none" | "beam-h" | "beam-v" | "eclipse" | "bomb";

export interface Cell {
  id: number;
  color: Color;
  special: Special;
}

export type Board = (Cell | null)[][];
export type Pos = [number, number];

export const SIZE = 8;
export const COLORS: readonly Color[] = [0, 1, 2, 3, 4, 5] as const;

let _id = 1;
export const newCell = (color: Color, special: Special = "none"): Cell => ({
  id: _id++,
  color,
  special,
});
const rnd = (): Color => COLORS[Math.floor(Math.random() * COLORS.length)] as Color;

const inBounds = (r: number, c: number) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;

export function createBoard(): Board {
  let b: Board;
  let safety = 0;
  do {
    b = Array.from({ length: SIZE }, () =>
      Array.from({ length: SIZE }, () => newCell(rnd())),
    );
    safety++;
  } while (findMatches(b).length > 0 && safety < 50);
  return b;
}

interface MatchGroup {
  cells: Pos[];
  dir: "h" | "v";
  color: Color;
}

export function findMatches(b: Board): MatchGroup[] {
  const groups: MatchGroup[] = [];
  // Horizontal runs
  for (let r = 0; r < SIZE; r++) {
    let start = 0;
    for (let c = 1; c <= SIZE; c++) {
      const continues =
        c < SIZE &&
        b[r][c] !== null &&
        b[r][start] !== null &&
        b[r][c]!.color === b[r][start]!.color;
      if (!continues) {
        const len = c - start;
        if (len >= 3) {
          const cells: Pos[] = [];
          for (let k = start; k < c; k++) cells.push([r, k]);
          groups.push({ cells, dir: "h", color: b[r][start]!.color });
        }
        start = c;
      }
    }
  }
  // Vertical runs
  for (let c = 0; c < SIZE; c++) {
    let start = 0;
    for (let r = 1; r <= SIZE; r++) {
      const continues =
        r < SIZE &&
        b[r][c] !== null &&
        b[start][c] !== null &&
        b[r][c]!.color === b[start][c]!.color;
      if (!continues) {
        const len = r - start;
        if (len >= 3) {
          const cells: Pos[] = [];
          for (let k = start; k < r; k++) cells.push([k, c]);
          groups.push({ cells, dir: "v", color: b[start][c]!.color });
        }
        start = r;
      }
    }
  }
  return groups;
}

export const isAdjacent = (a: Pos, b: Pos) =>
  Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;

export function swap(b: Board, a: Pos, c: Pos): Board {
  const nb = b.map((row) => row.slice());
  const tmp = nb[a[0]][a[1]];
  nb[a[0]][a[1]] = nb[c[0]][c[1]];
  nb[c[0]][c[1]] = tmp;
  return nb;
}

export interface StepResult {
  board: Board;
  cleared: { pos: Pos; cell: Cell }[];
  scored: number;
  spawned?: { pos: Pos; type: Special; color: Color };
  hadMatch: boolean;
}

const key = (r: number, c: number) => `${r},${c}`;

export function resolveStep(b: Board, swapPoint?: Pos): StepResult {
  const matches = findMatches(b);
  if (matches.length === 0) {
    return { board: b, cleared: [], scored: 0, hadMatch: false };
  }

  // T/L detection: cells appearing in BOTH a horizontal and vertical match.
  const hSet = new Set<string>();
  const vSet = new Set<string>();
  for (const g of matches) {
    for (const [r, c] of g.cells) (g.dir === "h" ? hSet : vSet).add(key(r, c));
  }
  const intersects: Pos[] = [];
  hSet.forEach((k) => {
    if (vSet.has(k)) {
      const [r, c] = k.split(",").map(Number);
      intersects.push([r, c]);
    }
  });

  // Pick the dominant group for special spawning.
  const longest = matches.reduce((a, m) => (m.cells.length > a.cells.length ? m : a), matches[0]);
  const spawnPos: Pos =
    swapPoint &&
    matches.some((m) => m.cells.some(([r, c]) => r === swapPoint[0] && c === swapPoint[1]))
      ? swapPoint
      : longest.cells[Math.floor(longest.cells.length / 2)];

  let spawned: StepResult["spawned"];
  if (intersects.length > 0) {
    spawned = { pos: intersects[0], type: "bomb", color: longest.color };
  } else if (longest.cells.length >= 5) {
    spawned = { pos: spawnPos, type: "eclipse", color: longest.color };
  } else if (longest.cells.length === 4) {
    spawned = {
      pos: spawnPos,
      type: longest.dir === "h" ? "beam-v" : "beam-h",
      color: longest.color,
    };
  }

  // BFS clearing — specials inside the cleared set trigger their blasts.
  const toClear = new Set<string>();
  const queue: Pos[] = [];
  for (const g of matches) {
    for (const p of g.cells) {
      const k = key(p[0], p[1]);
      if (!toClear.has(k)) {
        toClear.add(k);
        queue.push(p);
      }
    }
  }
  while (queue.length) {
    const [r, c] = queue.shift()!;
    const cell = b[r][c];
    if (!cell || cell.special === "none") continue;
    const blast: Pos[] = [];
    if (cell.special === "beam-h") for (let cc = 0; cc < SIZE; cc++) blast.push([r, cc]);
    else if (cell.special === "beam-v") for (let rr = 0; rr < SIZE; rr++) blast.push([rr, c]);
    else if (cell.special === "bomb") {
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr,
            nc = c + dc;
          if (inBounds(nr, nc)) blast.push([nr, nc]);
        }
    } else if (cell.special === "eclipse") {
      for (let rr = 0; rr < SIZE; rr++)
        for (let cc = 0; cc < SIZE; cc++)
          if (b[rr][cc] && b[rr][cc]!.color === cell.color) blast.push([rr, cc]);
    }
    for (const p of blast) {
      const k = key(p[0], p[1]);
      if (!toClear.has(k)) {
        toClear.add(k);
        queue.push(p);
      }
    }
  }

  // Snapshot cleared cells (for pop animation), then null them out.
  const cleared: StepResult["cleared"] = [];
  const nb: Board = b.map((row) => row.slice());
  toClear.forEach((k) => {
    const [r, c] = k.split(",").map(Number);
    const cell = nb[r][c];
    if (cell) cleared.push({ pos: [r, c], cell });
    nb[r][c] = null;
  });

  // Place spawned special at its spot (overrides clear).
  if (spawned) {
    const [r, c] = spawned.pos;
    nb[r][c] = newCell(spawned.color, spawned.type);
  }

  // Gravity per column.
  for (let c = 0; c < SIZE; c++) {
    let write = SIZE - 1;
    for (let r = SIZE - 1; r >= 0; r--) {
      if (nb[r][c]) {
        if (write !== r) {
          nb[write][c] = nb[r][c];
          nb[r][c] = null;
        }
        write--;
      }
    }
    for (let r = write; r >= 0; r--) nb[r][c] = newCell(rnd());
  }

  const scored = cleared.length * 30 + (spawned ? 120 : 0);
  return { board: nb, cleared, scored, hadMatch: true, spawned };
}

export function findHint(b: Board): [Pos, Pos] | null {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      for (const [dr, dc] of [
        [0, 1],
        [1, 0],
      ] as const) {
        const r2 = r + dr,
          c2 = c + dc;
        if (!inBounds(r2, c2)) continue;
        const t = swap(b, [r, c], [r2, c2]);
        if (findMatches(t).length > 0) return [[r, c], [r2, c2]];
      }
    }
  }
  return null;
}
