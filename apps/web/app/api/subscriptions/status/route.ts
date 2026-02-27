import { withDB } from "@/lib/mongoose";
import { BillingAccountModel } from "@workspace/mongodb/models/billing-account";
import {
  SubscriptionModel,
  SubscriptionStatus,
} from "@workspace/mongodb/models/subscription";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  return withDB(async () => {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const billingAccount = await BillingAccountModel.findOne({
      userId,
      isActive: true,
    }).lean();

    if (!billingAccount) {
      return NextResponse.json({ hasActiveSubscription: false });
    }

    const now = new Date();

    const subscription = await SubscriptionModel.findOne({
      billingAccountId: billingAccount._id,
      $or: [
        {
          status: {
            $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
          },
        },
        { status: SubscriptionStatus.CANCELED, currentPeriodEnd: { $gt: now } },
      ],
    });

    return NextResponse.json({ hasActiveSubscription: !!subscription });
  });
}
