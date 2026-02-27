import { withDB } from "@/lib/mongoose";
import { BillingService } from "@workspace/billing/src/services/billing-service";
import { BillingAccountModel } from "@workspace/mongodb/models/billing-account";
import { SubscriptionModel } from "@workspace/mongodb/models/subscription";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ subscriptionId: string }> },
) {
  return withDB(async () => {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        {
          message: "Usuário não identificado. Por favor, faça login novamente.",
        },
        { status: 403 },
      );
    }

    const { subscriptionId } = await params;

    const billingAccount = await BillingAccountModel.findOne({ userId });
    if (!billingAccount) {
      return NextResponse.json(
        { message: "Conta de cobrança não encontrada." },
        { status: 404 },
      );
    }

    const subscription = await SubscriptionModel.findOne({
      _id: subscriptionId,
      billingAccountId: billingAccount._id,
    });
    if (!subscription) {
      return NextResponse.json(
        { message: "Assinatura não encontrada." },
        { status: 404 },
      );
    }

    const canceledSubscription = await BillingService.cancelSubscription(
      subscriptionId,
      "Cancelamento solicitado pelo usuário",
    );

    return NextResponse.json(
      {
        message: "Assinatura cancelada com sucesso",
        subscriptionId: canceledSubscription._id,
      },
      { status: 200 },
    );
  });
}
