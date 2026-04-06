import { withDB } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import { SubscriptionModel } from "@workspace/mongodb/models/subscription";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ subscriptionId: string }> },
): Promise<NextResponse> {
  return withDB(async () => {
    const { subscriptionId } = await params;
    const subscription = await SubscriptionModel.findById(subscriptionId)
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
