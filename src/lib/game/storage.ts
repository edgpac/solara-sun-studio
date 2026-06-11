// Local-storage progression. SSR-safe.
const KEY = "sol-de-cabo-progress-v1";

export interface LevelProgress {
  stars: number;
  bestScore: number;
}
export interface Progress {
  levels: Record<number, LevelProgress>;
}

const empty: Progress = { levels: {} };

export function loadProgress(): Progress {
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Progress;
    return { levels: parsed.levels ?? {} };
  } catch {
    return empty;
  }
}

export function saveLevelResult(id: number, stars: number, score: number): Progress {
  const p = loadProgress();
  const prev = p.levels[id];
  p.levels[id] = {
    stars: Math.max(stars, prev?.stars ?? 0),
    bestScore: Math.max(score, prev?.bestScore ?? 0),
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(p));
  }
  return p;
}

export function isLevelUnlocked(_id: number, _p?: Progress): boolean {
  return true;
}

export function totalStars(p: Progress = loadProgress()): number {
  return Object.values(p.levels).reduce((sum, l) => sum + l.stars, 0);
}
