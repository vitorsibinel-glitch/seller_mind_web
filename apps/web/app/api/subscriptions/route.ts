import { withDB } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import { BillingCycle } from "@workspace/mongodb/models/subscription";
import { createSubscriptionSchema } from "@/schemas/createSubscriptionSchema";
import { BillingAccountModel } from "@workspace/mongodb/models/billing-account";
import { BillingInvoiceModel } from "@workspace/mongodb/models/billing-invoice";
import { BillingService } from "@workspace/billing/src/services/billing-service";
import { getRedis } from "@/lib/redis";
import { findCreditCardPayment } from "@/services/billing/ultralinks";
import { env } from "@/env";

export async function POST(req: Request) {
  return withDB(async () => {
    const userId = req.headers.get("x-user-id");
    const redis = getRedis();

    if (!userId) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();

    const parsed = createSubscriptionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Dados inválidos",
          errors: parsed.error.format(),
        },
        { status: 400 },
      );
    }

    const { planId, billingCycle, intentId } = parsed.data;

    const intentKey = `intent:${userId}:${planId}:${billingCycle}`;
    const storedIntentId = await redis.get(intentKey);

    if (!storedIntentId || storedIntentId !== intentId) {
      return NextResponse.json(
        { message: "Intent inválido ou expirado" },
        { status: 422 },
      );
    }

    const lockKey = `lock:${intentId}`;
    const lockAcquired = await redis.set(lockKey, "1", "EX", 60, "NX");

    if (!lockAcquired) {
      const processedKey = `processed:${intentId}`;
      const cached = await redis.get(processedKey);

      if (cached) {
        return NextResponse.json(JSON.parse(cached), { status: 200 });
      }

      return NextResponse.json(
        { message: "Assinatura já está sendo processada" },
        { status: 409 },
      );
    }

    const processedKey = `processed:${intentId}`;
    const cached = await redis.get(processedKey);

    if (cached) {
      return NextResponse.json(JSON.parse(cached), { status: 200 });
    }

    const billingAccount = await BillingAccountModel.findOne({ userId }).lean();

    if (!billingAccount) {
      return NextResponse.json(
        { message: "Cliente não encontrado" },
        { status: 404 },
      );
    }

    const customerId = billingAccount._id.toString();

    const subscription = await BillingService.createSubscription(
      customerId,
      planId,
      billingCycle as BillingCycle,
    );

    let invoice = null;

    const subId = (subscription._id ?? subscription.id)?.toString();
    if (subId) {
      invoice = await BillingInvoiceModel.findOne({ subscriptionId: subId })
        .sort({ createdAt: -1 })
        .lean()
        .exec();
    }

    const responseBody = {
      message: "Assinatura criada com sucesso!",
      subscription,
      invoice,
    };

    await Promise.all([
      redis.set(
        processedKey,
        JSON.stringify(responseBody),
        "EX",
        60 * 60 * 24, // 24 horas — cobre retries do cliente após sucesso
      ),
      redis.del(intentKey),
    ]);

    return NextResponse.json(responseBody, { status: 201 });
  });
}
