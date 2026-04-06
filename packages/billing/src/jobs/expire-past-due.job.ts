import {
  SubscriptionModel,
  SubscriptionStatus,
} from "@workspace/mongodb/models/subscription";
import {
  AuditLogModel,
  AuditAction,
  AuditSeverity,
} from "@workspace/mongodb/models/audit-log";
import { BillingAccountModel } from "@workspace/mongodb/models/billing-account";
import { UserModel } from "@workspace/mongodb/models/user";
import { sendSubscriptionSuspended } from "../emails/billing.emails";

export interface ExpirePastDueResult {
  expiredCount: number;
}

/**
 * Expira assinaturas em PAST_DUE cujo tolerancePeriodEnd já passou.
 * O tolerancePeriodEnd é definido em markPastDue() como now + 5 dias.
 * Idempotente: a query nunca retorna assinaturas já expiradas.
 */
export async function expirePastDue(): Promise<ExpirePastDueResult> {
  const now = new Date();

  const candidates = await SubscriptionModel.find({
    status: SubscriptionStatus.PAST_DUE,
    tolerancePeriodEnd: { $lt: now },
  })
    .select("_id billingAccountId tolerancePeriodEnd")
    .lean();

  if (candidates.length === 0) {
    return { expiredCount: 0 };
  }

  const ids = candidates.map((s) => s._id);

  await SubscriptionModel.updateMany(
    { _id: { $in: ids }, status: SubscriptionStatus.PAST_DUE },
    { $set: { status: SubscriptionStatus.SUSPENDED } },
  );

  await AuditLogModel.insertMany(
    candidates.map((s) => ({
      action: AuditAction.TOLERANCE_EXPIRED,
      severity: AuditSeverity.WARN,
      entityType: "Subscription",
      entityId: s._id,
      billingAccountId: s.billingAccountId,
      description: "Assinatura suspensa após tolerância de 5 dias sem pagamento",
      metadata: { tolerancePeriodEnd: s.tolerancePeriodEnd },
    })),
  );

  // Envia emails (best-effort, não bloqueia o job)
  try {
    const billingAccountIds = candidates.map((s) => s.billingAccountId);
    const billingAccounts = await BillingAccountModel.find({
      _id: { $in: billingAccountIds },
    })
      .select("_id userId")
      .lean();

    const userIds = billingAccounts.map((b) => b.userId);
    const users = await UserModel.find({ _id: { $in: userIds } })
      .select("_id email firstName")
      .lean();

    const userById = new Map(users.map((u) => [u._id.toString(), u]));
    const userByBillingAccount = new Map(
      billingAccounts.map((b) => [
        b._id.toString(),
        userById.get(b.userId.toString()),
      ]),
    );

    await Promise.allSettled(
      candidates.map((s) => {
        const user = userByBillingAccount.get(s.billingAccountId.toString());
        if (!user) return Promise.resolve();
        return sendSubscriptionSuspended(user.email, user.firstName);
      }),
    );
  } catch (err) {
    console.warn("[expire-past-due] sendSubscriptionSuspended falhou (não-bloqueante):", err);
  }

  return { expiredCount: candidates.length };
}
