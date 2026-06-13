import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRedis, CHAMPION_KEY } from "./redis.server";

export interface Champion {
  score: number;
  initials: string;
  date: string;
}

export const getChampion = createServerFn({ method: "GET" }).handler(
  async (): Promise<Champion | null> => {
    try {
      const raw = await getRedis().get(CHAMPION_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as Champion;
    } catch {
      return null;
    }
  },
);

export const submitScore = createServerFn({ method: "POST" })
  .inputValidator(z.object({ score: z.number().int().positive(), initials: z.string().min(1).max(3) }))
  .handler(async ({ data }): Promise<{ isNewRecord: boolean; champion: Champion }> => {
    const redis = getRedis();
    const raw = await redis.get(CHAMPION_KEY);
    const current: Champion | null = raw ? (JSON.parse(raw) as Champion) : null;

    if (!current || data.score > current.score) {
      const champion: Champion = {
        score: data.score,
        initials: data.initials.toUpperCase().slice(0, 3),
        date: new Date().toISOString().slice(0, 10),
      };
      await redis.set(CHAMPION_KEY, JSON.stringify(champion));
      return { isNewRecord: true, champion };
    }

    return { isNewRecord: false, champion: current };
  });
