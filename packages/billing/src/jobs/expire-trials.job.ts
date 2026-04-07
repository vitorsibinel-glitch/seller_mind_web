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
import { sendTrialExpired } from "../emails/billing.emails";

const TRIAL_GRACE_DAYS = 3;

export interface ExpireTrialsResult {
  expiredCount: number;
  skippedCount: number;
}

/**
 * Expira assinaturas em TRIALING cujo trialEnd passou há mais de TRIAL_GRACE_DAYS dias.
 * Idempotente: a query nunca retorna assinaturas já expiradas.
 */
export async function expireTrials(): Promise<ExpireTrialsResult> {
  const cutoff = new Date(
    Date.now() - TRIAL_GRACE_DAYS * 24 * 60 * 60 * 1000,
  );

  const candidates = await SubscriptionModel.find({
    status: SubscriptionStatus.TRIALING,
    trialEnd: { $lt: cutoff },
  })
    .select("_id billingAccountId trialEnd")
    .lean();

  if (candidates.length === 0) {
    return { expiredCount: 0, skippedCount: 0 };
  }

  const ids = candidates.map((s) => s._id);

  await SubscriptionModel.updateMany(
    { _id: { $in: ids }, status: SubscriptionStatus.TRIALING },
    { $set: { status: SubscriptionStatus.EXPIRED } },
  );

  await AuditLogModel.insertMany(
    candidates.map((s) => ({
      action: AuditAction.TRIAL_EXPIRED,
      severity: AuditSeverity.WARN,
      entityType: "Subscription",
      entityId: s._id,
      billingAccountId: s.billingAccountId,
      description: `Trial expirado após ${TRIAL_GRACE_DAYS} dias de tolerância`,
      metadata: { trialEnd: s.trialEnd, graceDays: TRIAL_GRACE_DAYS },
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
        return sendTrialExpired(user.email, user.firstName);
      }),
    );
  } catch (err) {
    console.warn("[expire-trials] sendTrialExpired falhou (não-bloqueante):", err);
  }

  return { expiredCount: candidates.length, skippedCount: 0 };
}
