import { withDB } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { BillingAccountModel } from "@workspace/mongodb/models/billing-account";
import { SubscriptionModel, SubscriptionStatus } from "@workspace/mongodb/models/subscription";

export async function GET(req: NextRequest) {
  return withDB(async () => {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const billingAccount = await BillingAccountModel.findOne({ userId });
    if (!billingAccount) {
      return NextResponse.json({ hasAccess: false, status: "no_account" });
    }

    const subscription = await SubscriptionModel.findOne({
      billingAccountId: billingAccount._id,
    }).sort({ createdAt: -1 });

    if (!subscription) {
      return NextResponse.json({ hasAccess: false, status: "no_subscription" });
    }

    const now = new Date();

    if (
      subscription.status === SubscriptionStatus.TRIALING &&
      subscription.trialEnd &&
      subscription.trialEnd > now
    ) {
      return NextResponse.json({
        hasAccess: true,
        status: "trialing",
        trialEnd: subscription.trialEnd,
        planId: subscription.planId || null,
      });
    }

    if (subscription.status === SubscriptionStatus.ACTIVE) {
      return NextResponse.json({
        hasAccess: true,
        status: "active",
        planId: subscription.planId,
        currentPeriodEnd: subscription.currentPeriodEnd,
      });
    }

    return NextResponse.json({
      hasAccess: false,
      status: subscription.status,
      planId: subscription.planId || null,
    });
  });
}
