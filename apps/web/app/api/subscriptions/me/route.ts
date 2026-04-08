import { withDB } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { BillingAccountModel } from "@workspace/mongodb/models/billing-account";
import { SubscriptionModel } from "@workspace/mongodb/models/subscription";

export async function GET(req: NextRequest) {
  return withDB(async () => {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const billingAccount = await BillingAccountModel.findOne({ userId });
    if (!billingAccount) {
      return NextResponse.json({ message: "Conta não encontrada" }, { status: 404 });
    }

    const subscription = await SubscriptionModel.findOne({
      billingAccountId: billingAccount._id,
    })
      .sort({ createdAt: -1 })
      .populate("planId")
      .lean();

    if (!subscription) {
      return NextResponse.json({ message: "Assinatura não encontrada" }, { status: 404 });
    }

    return NextResponse.json({ data: subscription });
  });
}
