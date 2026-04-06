import { withDB } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { BillingAccountModel } from "@workspace/mongodb/models/billing-account";
import { SubscriptionModel } from "@workspace/mongodb/models/subscription";
import { checkAccess } from "@workspace/billing";

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

    const result = checkAccess(subscription as any);

    return NextResponse.json({
      hasAccess: result.hasAccess,
      status: result.status,
      planId: result.planId ?? null,
      // Campos de tolerância — presentes apenas quando relevantes
      ...(result.trialEnd ? { trialEnd: result.trialEnd } : {}),
      ...(result.gracePeriodEnd ? { gracePeriodEnd: result.gracePeriodEnd } : {}),
      ...(result.tolerancePeriodEnd
        ? { tolerancePeriodEnd: result.tolerancePeriodEnd }
        : {}),
      ...(result.currentPeriodEnd
        ? { currentPeriodEnd: result.currentPeriodEnd }
        : {}),
    });
  });
}
