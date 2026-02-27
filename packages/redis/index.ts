import { Redis } from "ioredis";
import type { Redis as IRedis } from "ioredis";

export const createRedisClient = (url: string): IRedis => {
  const redis = new Redis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    keepAlive: 10000,

    retryStrategy(times) {
      // backoff progressivo
      return Math.min(times * 100, 2000);
    },

    reconnectOnError(err) {
      // força reconexão para erros de rede
      return true;
    },
  });
  return redis;
};

export { IRedis };
