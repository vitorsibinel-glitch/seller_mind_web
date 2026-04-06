import { getRedis } from "@/lib/redis";
import { randomInt } from "crypto";

export async function generateOTP(userId: string) {
  const redis = getRedis();
  const ttl = 600; // 10 minutos em segundos

  const otpCode = randomInt(100000, 999999).toString();

  const otpData = {
    code: otpCode,
    verified: false,
  };

  const redisKey = `otp:${userId}`;
  await redis.set(redisKey, JSON.stringify(otpData), "EX", ttl);

  return otpCode;
}

export async function validateOTP(userId: string, code: string) {
  const redis = getRedis();
  const redisKey = `otp:${userId}`;
  const data = await redis.get(redisKey);

  if (!data) {
    console.error("Código expirado ou não encontrado.");
    return false;
  }

  const otpData = JSON.parse(data);

  if (otpData.verified) {
    console.error("##### Código já utilizado.");
    return false;
  }

  if (otpData.code !== code) {
    console.error("##### Código inválido.");
    return false;
  }

  otpData.verified = true; // usar como uma camada extra de segurança ... faz sentido?

  await invalidateOTP(userId);
  return true;
}

async function invalidateOTP(userId: string) {
  const redis = getRedis();
  const redisKey = `otp:${userId}`;
  await redis.del(redisKey);
}
