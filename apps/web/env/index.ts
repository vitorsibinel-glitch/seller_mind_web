import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().default(""),
  NEXT_PUBLIC_API_URL: z.string().default(""),
  API_URL: z.string().default(""),
  RESEND_API_KEY: z.string().default(""),
  JWT_SECRET: z.string().default(""),
  LWA_CLIENT_ID: z.string().default(""),
  LWA_CLIENT_SECRET: z.string().default(""),
  SP_API_SANDBOX_CLIENT_ID: z.string().default(""),
  SP_API_SANDBOX_CLIENT_SECRET: z.string().default(""),
  SP_API_CLIENT_ID: z.string().default(""),
  SP_API_CLIENT_SECRET: z.string().default(""),
  REDIS_URL: z.string().default(""),
  SP_APPLICATION_ID: z.string().default(""),
  DIG2PAY_BASE_URL: z.string().default("https://payments.dig2pay.com"),
  ULTRALINKS_ACCESS_TOKEN: z.string().default(""),
  NODE_ENV: z.enum(["development", "production", "test"]).default("production"),
});

// Parse sempre vai funcionar por causa dos defaults
const _env = envSchema.parse(process.env);

// Verificar se temos valores reais (não defaults vazios)
const hasRequiredVars = _env.DATABASE_URL && _env.API_URL && _env.JWT_SECRET;

if (!hasRequiredVars) {
  console.warn(
    "⚠️  Variáveis de ambiente faltando - usando defaults para build",
  );
  console.warn("⚠️  Certifique-se de fornecer as variáveis em runtime!");
}

export const env = _env;

// Função helper para validar em runtime quando necessário
export function validateEnv() {
  if (!env.DATABASE_URL || !env.API_URL || !env.JWT_SECRET) {
    throw new Error("❌ Variáveis de ambiente críticas não configuradas");
  }
}
