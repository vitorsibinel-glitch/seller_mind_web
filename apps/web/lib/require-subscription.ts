import { BillingAccountModel } from "@workspace/mongodb/models/billing-account";
import { SubscriptionModel } from "@workspace/mongodb/models/subscription";
import { checkAccess } from "@workspace/billing";
import { NextResponse } from "next/server";

/**
 * Verifica se o userId tem assinatura com acesso ativo (inclui períodos de tolerância).
 * Retorna NextResponse 403 se sem acesso, null se liberado.
 */
export async function requireSubscription(
  userId: string,
): Promise<NextResponse | null> {
  const billingAccount = await BillingAccountModel.findOne({ userId }).lean();
  if (!billingAccount) {
    return NextResponse.json(
      { message: "Conta de cobrança não encontrada" },
      { status: 403 },
    );
  }

  const subscription = await SubscriptionModel.findOne({
    billingAccountId: billingAccount._id,
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!subscription) {
    return NextResponse.json(
      { message: "Assinatura não encontrada" },
      { status: 403 },
    );
  }

  const access = checkAccess(subscription as any);
  if (!access.hasAccess) {
    return NextResponse.json(
      { message: "Acesso negado", accessStatus: access.status },
      { status: 403 },
    );
  }

  return null;
}
