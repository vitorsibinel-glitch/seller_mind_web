import { getRedis } from "@/lib/redis";

interface CacheOptions {
  ttl?: number;
  prefix?: string;
}

const TTL = 300; // 5 min

export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {},
): Promise<T> {
  const { ttl = TTL, prefix = "cache" } = options;
  const redis = getRedis();
  const cacheKey = `${prefix}:${key}`;

  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log(`[Cache] Hit: ${cacheKey}`);
    return JSON.parse(cached) as T;
  }

  console.log(`[Cache] Miss: ${cacheKey}`);

  const data = await fetcher();

  await redis.set(cacheKey, JSON.stringify(data), "EX", ttl);

  return data;
}

export async function invalidateCache(
  pattern: string,
  prefix: string = "cache",
): Promise<void> {
  const redis = getRedis();
  const cachePattern = `${prefix}:${pattern}`;
  const keys = await redis.keys(cachePattern);

  if (keys.length > 0) {
    await redis.del(...keys);
    console.log(
      `[Cache] Invalidated ${keys.length} keys matching: ${cachePattern}`,
    );
  }
}

export function buildCacheKey(
  ...parts: (string | number | null | undefined)[]
): string {
  return parts.filter(Boolean).join(":");
}
