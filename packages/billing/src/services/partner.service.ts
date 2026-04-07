import { PartnerModel } from "@workspace/mongodb/models/partner";
import { PartnerReferralModel } from "@workspace/mongodb/models/partner-referral";
import { BillingAccountModel } from "@workspace/mongodb/models/billing-account";
import {
  AuditLogModel,
  AuditAction,
  AuditSeverity,
} from "@workspace/mongodb/models/audit-log";

export interface CreateReferralParams {
  billingAccountId: string;
  subscriptionId: string;
  /** Valor pago em centavos (ou unidade monetária do amount de activateSubscription) */
  amount: number;
}

export interface ProcessPayoutParams {
  partnerId: string;
  payoutReference: string;
}

export interface ProcessPayoutResult {
  paidCount: number;
  totalAmount: number;
}

/**
 * Cria um PartnerReferral se a BillingAccount tiver referralCode válido.
 * Idempotente: só cria uma vez por billingAccountId.
 */
export async function createReferral({
  billingAccountId,
  subscriptionId,
  amount,
}: CreateReferralParams): Promise<void> {
  const existing = await PartnerReferralModel.findOne({
    billingAccountId,
    subscriptionId,
  });
  if (existing) return;

  const billingAccount = await BillingAccountModel.findById(billingAccountId);
  if (!billingAccount?.referralCode) return;

  const partner = await PartnerModel.findOne({
    code: billingAccount.referralCode,
    isActive: true,
  });
  if (!partner) return;

  const commissionAmount = Math.round(
    amount * (partner.commissionRate / 100),
  );

  await PartnerReferralModel.create({
    partnerId: partner._id,
    userId: billingAccount.userId,
    billingAccountId,
    subscriptionId,
    commissionRate: partner.commissionRate,
    commissionAmount,
    status: "pending",
  });

  await PartnerModel.findByIdAndUpdate(partner._id, {
    $inc: { pendingPayout: commissionAmount },
  });

  await AuditLogModel.create({
    action: AuditAction.PARTNER_REFERRAL_CREATED,
    severity: AuditSeverity.INFO,
    entityType: "PartnerReferral",
    billingAccountId,
    description: `Referral criado para parceiro ${partner.name} (${partner.code})`,
    metadata: {
      partnerId: partner._id,
      commissionRate: partner.commissionRate,
      commissionAmount,
    },
  });
}

/**
 * Processa payout de todos os referrals pendentes de um parceiro.
 * Marca como "paid", atualiza pendingPayout e registra auditoria.
 */
export async function processPayout({
  partnerId,
  payoutReference,
}: ProcessPayoutParams): Promise<ProcessPayoutResult> {
  const pendingReferrals = await PartnerReferralModel.find({
    partnerId,
    status: "pending",
  });

  if (pendingReferrals.length === 0) {
    return { paidCount: 0, totalAmount: 0 };
  }

  const totalAmount = pendingReferrals.reduce(
    (sum, r) => sum + r.commissionAmount,
    0,
  );
  const now = new Date();

  await PartnerReferralModel.updateMany(
    { partnerId, status: "pending" },
    { status: "paid", paidAt: now, payoutReference },
  );

  await PartnerModel.findByIdAndUpdate(partnerId, {
    $inc: { pendingPayout: -totalAmount },
  });

  await AuditLogModel.create({
    action: AuditAction.PARTNER_PAYOUT_PROCESSED,
    severity: AuditSeverity.INFO,
    entityType: "Partner",
    description: `Payout processado: ${pendingReferrals.length} referral(s), total ${totalAmount}`,
    metadata: {
      partnerId,
      payoutReference,
      totalAmount,
      paidCount: pendingReferrals.length,
    },
  });

  return { paidCount: pendingReferrals.length, totalAmount };
}
