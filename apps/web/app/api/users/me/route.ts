import { withDB } from "@/lib/mongoose";
import { UserModel } from "@workspace/mongodb/models/user";
import { BillingAccountModel } from "@workspace/mongodb/models/billing-account";
import { SubscriptionModel } from "@workspace/mongodb/models/subscription";
import { NextResponse } from "next/server";

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

    const userFromId = await UserModel.findOne({ _id: userId }).lean();
    if (!userFromId) {
      return NextResponse.json(
        {
          message: "Usuário não identificado. Por favor, faça login novamente.",
        },
        { status: 403 },
      );
    }

    const billingAccount = await BillingAccountModel.findOne({ userId });

    const subscription = billingAccount
      ? await SubscriptionModel.findOne({
          billingAccountId: billingAccount._id,
        })
          .populate("planId")
          .lean()
      : null;

    return NextResponse.json({
      user: {
        ...userFromId,
        planName: (subscription?.planId as any)?.name ?? null,
        billingAccount: billingAccount
          ? { gateway: billingAccount.gateway ?? null }
          : null,
      },
    });
  });
}
