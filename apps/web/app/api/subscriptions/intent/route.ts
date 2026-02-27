import { env } from "@/env";
import { withDB } from "@/lib/mongoose";
import { getRedis } from "@/lib/redis";
import { createIntentSchema } from "@/schemas/createIntentSchema";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  return withDB(async () => {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();

    const parsed = createIntentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Dados inválidos",
          errors: parsed.error.format(),
        },
        { status: 400 },
      );
    }

    const { planId, billingCycle } = parsed.data;
    const hash = env.ULTRALINKS_ACCESS_TOKEN;

    const intentKey = `intent:${userId}:${planId}:${billingCycle}`;

    const redis = getRedis();

    let intentId = await redis.get(intentKey);

    if (intentId) {
      return NextResponse.json({ intentId, hash }, { status: 200 });
    }

    intentId = randomUUID();
    await redis.set(intentKey, intentId, "EX", 15 * 60); // Expira em 15 minutos

    return NextResponse.json({ intentId, hash }, { status: 201 });
  });
}
