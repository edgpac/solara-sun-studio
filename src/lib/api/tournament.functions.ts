import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Redis } from "ioredis";
import {
  getRedis,
  tournamentKey,
  coinsKey,
  prizeNotifKey,
  HOUSE_COINS_KEY,
  PLAYERS_KEY,
} from "./redis.server";

// Gross prizes per rank 1st–10th. House takes HOUSE_RAKE_PCT of each.
const PRIZE_RANKS = [200, 100, 50, 15, 15, 15, 15, 15, 15, 15];

// The "back door" — 20% of every prize credited to sol:house:coins.
export const HOUSE_RAKE_PCT = 0.2;

// Prize zone: players within this rank win coins.
const PRIZE_ZONE = PRIZE_RANKS.length; // 10

export interface TournamentPlayer {
  initials: string;
  score: number;
  rank: number;
}

export interface TournamentStatus {
  weekId: number;
  endsAt: number;
  topPlayers: TournamentPlayer[];
  myRank: number | null;
  myScore: number | null;
  myCoins: number;
  lastWeekPrize: number;
  netPrizes: number[];
  totalPlayers: number;
  spotsFromPrize: number | null; // how many ranks to climb to reach prize zone; null if already there or unranked
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Unix epoch (Jan 1 1970) was a Thursday. Shift forward 3 days so week
// boundaries land on Monday 00:00 UTC instead of the arbitrary Thursday.
const MONDAY_OFFSET_MS = 3 * 24 * 60 * 60 * 1000;

export function currentWeekId(): number {
  return Math.floor((Date.now() + MONDAY_OFFSET_MS) / WEEK_MS);
}

// Returns the Unix ms timestamp when this weekId ends (Monday 00:00 UTC).
export function weekEndsAt(weekId: number): number {
  return (weekId + 1) * WEEK_MS - MONDAY_OFFSET_MS;
}

async function distributeWeek(redis: Redis, weekId: number): Promise<void> {
  const scoresKey = tournamentKey(weekId, "scores");
  const topRaw = await redis.zrevrange(scoresKey, 0, PRIZE_ZONE - 1, "WITHSCORES");
  if (topRaw.length === 0) return;

  const multi = redis.multi();
  for (let i = 0; i < topRaw.length; i += 2) {
    const uid = topRaw[i];
    const rankIndex = i / 2;
    const gross = PRIZE_RANKS[rankIndex] ?? 0;
    const rake = Math.floor(gross * HOUSE_RAKE_PCT);
    const net = gross - rake;

    multi.incrby(coinsKey(uid), net);
    multi.incrby(HOUSE_COINS_KEY, rake);
    // Atomic get-and-delete notification — each player sees it exactly once.
    multi.set(prizeNotifKey(weekId, uid), String(net), "EX", 30 * 24 * 60 * 60);
  }
  await multi.exec();
}

export const getTournamentStatus = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      uid: z.string().uuid().optional(),
      initials: z.string().max(3).optional(),
    }),
  )
  .handler(async ({ data }): Promise<TournamentStatus> => {
    const redis = getRedis();
    const weekId = currentWeekId();

    // Lazy distribution: SETNX means only the first caller of the new week distributes.
    const lastWeekId = weekId - 1;
    const distKey = tournamentKey(lastWeekId, "distributed");
    const won = await redis.setnx(distKey, "1");
    if (won === 1) {
      await redis.expire(distKey, 30 * 24 * 60 * 60);
      await distributeWeek(redis, lastWeekId);
    }

    // Check for unclaimed prize notification from last week.
    let lastWeekPrize = 0;
    if (data?.uid) {
      const raw = await redis.getdel(prizeNotifKey(lastWeekId, data.uid));
      if (raw) lastWeekPrize = parseInt(raw, 10);
    }

    // This week's leaderboard — top 10.
    const scoresKey = tournamentKey(weekId, "scores");
    const topRaw = await redis.zrevrange(scoresKey, 0, PRIZE_ZONE - 1, "WITHSCORES");

    // Batch-fetch display initials for all top UIDs.
    const topUids = topRaw.filter((_, i) => i % 2 === 0);
    const displayNames =
      topUids.length > 0 ? await redis.hmget(PLAYERS_KEY, ...topUids) : [];

    const topPlayers: TournamentPlayer[] = [];
    for (let i = 0; i < topRaw.length; i += 2) {
      topPlayers.push({
        initials: displayNames[i / 2] ?? "???",
        score: parseInt(topRaw[i + 1], 10),
        rank: topPlayers.length + 1,
      });
    }

    // My position this week.
    let myRank: number | null = null;
    let myScore: number | null = null;
    let spotsFromPrize: number | null = null;

    if (data?.uid) {
      const scoreRaw = await redis.zscore(scoresKey, data.uid);
      if (scoreRaw !== null) {
        myScore = parseInt(scoreRaw, 10);
        const zrank = await redis.zrevrank(scoresKey, data.uid);
        myRank = zrank !== null ? zrank + 1 : null;
        if (myRank !== null && myRank > PRIZE_ZONE) {
          spotsFromPrize = myRank - PRIZE_ZONE;
        }
      }
    }

    // Total entrants this week.
    const totalPlayers = await redis.zcard(scoresKey);

    // Coin balance.
    const myCoins = data?.uid
      ? parseInt((await redis.get(coinsKey(data.uid))) ?? "0", 10)
      : 0;

    const endsAt = weekEndsAt(weekId);
    const netPrizes = PRIZE_RANKS.map((p) => p - Math.floor(p * HOUSE_RAKE_PCT));

    return {
      weekId,
      endsAt,
      topPlayers,
      myRank,
      myScore,
      myCoins,
      lastWeekPrize,
      netPrizes,
      totalPlayers,
      spotsFromPrize,
    };
  });

export const submitTournamentScore = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      score: z.number().int().positive(),
      uid: z.string().uuid(),
      initials: z.string().min(1).max(3),
    }),
  )
  .handler(async ({ data }): Promise<void> => {
    const redis = getRedis();
    const weekId = currentWeekId();
    const scoresKey = tournamentKey(weekId, "scores");
    const normalized = data.initials.toUpperCase().slice(0, 3);

    // Associate uid → display initials (idempotent, updates if initials change).
    await redis.hset(PLAYERS_KEY, data.uid, normalized);

    // Only update if this score beats the player's own best this week.
    const current = await redis.zscore(scoresKey, data.uid);
    if (current === null || data.score > parseInt(current, 10)) {
      await redis.zadd(scoresKey, data.score, data.uid);
      await redis.expire(scoresKey, 21 * 24 * 60 * 60);
    }
  });
