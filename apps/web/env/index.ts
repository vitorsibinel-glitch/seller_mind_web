import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().default(""),
  NEXT_PUBLIC_API_URL: z.string().default(""),
  NEXT_PUBLIC_APP_URL: z.string().default(""),
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
  EDUZZ_API_TOKEN: z.string().default(""),
  EDUZZ_WEBHOOK_SECRET: z.string().default(""),
  ASAAS_API_KEY: z.string().default(""),
  ASAAS_WEBHOOK_TOKEN: z.string().default(""),
  BILLING_GATEWAY: z.enum(["eduzz", "asaas"]).default("eduzz"),
  CRON_SECRET: z.string().default(""),
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
