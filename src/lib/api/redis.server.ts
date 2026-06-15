import Redis from "ioredis";

let client: Redis | null = null;

export function getRedis(): Redis {
  if (!client) {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error("REDIS_URL is not set");
    client = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 2 });
  }
  return client;
}

export const CHAMPION_KEY = "sol:champion";
export const HOUSE_COINS_KEY = "sol:house:coins";

// Global hash: uid (UUID) → display initials. Persists across weeks.
export const PLAYERS_KEY = "sol:players";

export function tournamentKey(weekId: number, suffix: "scores" | "distributed"): string {
  return `sol:tournament:${weekId}:${suffix}`;
}

// Coins and prize notifications are keyed by uid (UUID), not initials.
// This prevents collisions between players who choose the same initials.
export function coinsKey(uid: string): string {
  return `sol:coins:${uid}`;
}

export function prizeNotifKey(weekId: number, uid: string): string {
  return `sol:tournament:${weekId}:prize:${uid}`;
}
