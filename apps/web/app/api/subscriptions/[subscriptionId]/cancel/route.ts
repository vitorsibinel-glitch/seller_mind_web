import { withDB } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { BillingAccountModel } from "@workspace/mongodb/models/billing-account";
import {
  SubscriptionModel,
  SubscriptionStatus,
} from "@workspace/mongodb/models/subscription";
import { cancelSubscription } from "@workspace/billing";

const CANCELABLE_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatus.TRIALING,
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.PAST_DUE,
];

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ subscriptionId: string }> },
) {
  return withDB(async () => {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const { subscriptionId } = await params;

    const billingAccount = await BillingAccountModel.findOne({ userId });
    if (!billingAccount) {
      return NextResponse.json(
        { message: "Conta de billing não encontrada" },
        { status: 404 },
      );
    }

    const subscription = await SubscriptionModel.findOne({
      _id: subscriptionId,
      billingAccountId: billingAccount._id,
    });

    if (!subscription) {
      return NextResponse.json(
        { message: "Assinatura não encontrada" },
        { status: 404 },
      );
    }

    if (!CANCELABLE_STATUSES.includes(subscription.status)) {
      return NextResponse.json(
        { message: "Esta assinatura não pode ser cancelada" },
        { status: 400 },
      );
    }

    await cancelSubscription({
      subscriptionId,
      reason: "Cancelado pelo usuário",
      metadata: { gateway: subscription.gateway ?? "eduzz", userId },
    });

    return NextResponse.json(
      { message: "Assinatura cancelada com sucesso" },
      { status: 200 },
    );
  });
}
