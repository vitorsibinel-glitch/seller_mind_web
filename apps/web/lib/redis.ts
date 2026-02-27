import { env } from "@/env";
import { createRedisClient } from "@workspace/redis";
import type { Redis as IRedis } from "ioredis";

let redis: IRedis | null = null;

export function getRedis(): IRedis {
  if (typeof window !== "undefined") {
    throw new Error("Redis client cannot be used on the client");
  }

  if (!env.REDIS_URL) {
    console.warn("⚠ Redis indisponível no build. Ignorando cache.");
    return {
      get: async () => null,
      set: async () => null,
      del: async () => null,
    } as unknown as IRedis;
  }

  if (!redis) {
    redis = createRedisClient(env.REDIS_URL);

    redis.on("connect", () => console.log("✅ Redis conectado"));
    redis.on("error", (err) => console.error("❌ Erro Redis:", err));
  }

  return redis;
}
