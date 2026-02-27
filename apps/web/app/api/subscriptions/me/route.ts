import { withDB } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import { SubscriptionModel } from "@workspace/mongodb/models/subscription";
import { BillingAccountModel } from "@workspace/mongodb/models/billing-account";

export async function GET(req: Request): Promise<NextResponse> {
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

    const billingAccountFromUserId = await BillingAccountModel.findOne({
      userId,
    });
    if (!billingAccountFromUserId) {
      return NextResponse.json(
        {
          message: "Usuário não identificado. Por favor, faça login novamente.",
        },
        { status: 403 },
      );
    }

    const subscription = await SubscriptionModel.findOne({
      billingAccountId: billingAccountFromUserId._id,
    })
      .populate("planId")
      .populate("billingAccountId")
      .lean();

    if (!subscription) {
      return NextResponse.json(
        { message: "Assinatura não encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: subscription }, { status: 200 });
  });
}
