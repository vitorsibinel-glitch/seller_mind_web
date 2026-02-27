import { withDB } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import { BillingService } from "@workspace/billing/src/services/billing-service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ billingAccountId: string }> },
) {
  const { billingAccountId } = await params;

  return withDB(async () => {
    const subscriptions =
      await BillingService.getSubscriptionsByCustomer(billingAccountId);

    return NextResponse.json({ data: subscriptions }, { status: 200 });
  });
}
