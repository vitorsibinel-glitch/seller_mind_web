import { withDB } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import mongoose from "mongoose";
import { PartnerModel } from "@workspace/mongodb/models/partner";
import { PartnerReferralModel } from "@workspace/mongodb/models/partner-referral";
import { PayoutModel } from "@workspace/mongodb/models/payout";
import { AuditLogModel, AuditAction, AuditSeverity } from "@workspace/mongodb/models/audit-log";

const PAYOUT_THRESHOLD = 100;

export async function GET(req: Request) {
  return withDB(async () => {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const denied = await requireAdmin(userId);
    if (denied) return denied;

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const status = url.searchParams.get("status");

    let query: any = {};
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const total = await PayoutModel.countDocuments(query);
    const payouts = await PayoutModel.find(query)
      .skip(skip)
      .limit(limit)
      .lean();

    const payoutsWithRefCount = payouts.map((payout: any) => ({
      ...payout,
      referralCount: payout.referralIds?.length || 0,
    }));

    // Summary stats
    const pending = await PayoutModel.aggregate([
      { $match: { status: "pending" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const processing = await PayoutModel.aggregate([
      { $match: { status: "processing" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const completed = await PayoutModel.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    return NextResponse.json({
      payouts: payoutsWithRefCount,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      summary: {
        totalPending: pending[0]?.total || 0,
        totalProcessing: processing[0]?.total || 0,
        totalCompleted: completed[0]?.total || 0,
      },
    });
  });
}

export async function POST(req: Request) {
  return withDB(async () => {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const denied = await requireAdmin(userId);
    if (denied) return denied;

    const body = await req.json();
    const { partnerId } = body;

    if (!partnerId) {
      return NextResponse.json({ message: "Missing partnerId" }, { status: 400 });
    }

    const partner = await PartnerModel.findById(partnerId);
    if (!partner) {
      return NextResponse.json({ message: "Partner not found" }, { status: 404 });
    }

    // VALIDATION: Threshold
    if (partner.pendingPayout < PAYOUT_THRESHOLD) {
      return NextResponse.json(
        {
          message: "Saldo insuficiente. Mínimo R$ 100 para solicitar pagamento",
          current: partner.pendingPayout,
          required: PAYOUT_THRESHOLD,
        },
        { status: 400 }
      );
    }

    // VALIDATION: pixKey obrigatório
    if (!partner.pixKey) {
      return NextResponse.json(
        { message: "Configure a chave PIX do parceiro antes de solicitar pagamento" },
        { status: 400 }
      );
    }

    // Get paid referrals WITHOUT payout (idempotent, prevents double-payment)
    const referrals = await PartnerReferralModel.find({
      partnerId,
      status: "paid",
      payoutId: { $exists: false }, // only unlinked referrals
    });

    if (referrals.length === 0) {
      return NextResponse.json(
        { message: "Nenhuma comissão pendente para este parceiro" },
        { status: 400 }
      );
    }

    const referralIds = referrals.map((r) => r._id);

    // Create Payout record and link referrals atomically
    const session = await mongoose.startSession();
    let payout: any;

    try {
      await session.withTransaction(async () => {
        // Create Payout (DO NOT decrement pendingPayout yet)
        const payouts = await PayoutModel.create(
          [
            {
              partnerId: partner._id,
              partnerName: partner.name,
              partnerCode: partner.code,
              amount: partner.pendingPayout,
              pixKey: partner.pixKey,
              referralIds,
              status: "pending",
              requestedAt: new Date(),
            },
          ],
          { session }
        );
        payout = payouts[0];

        // Link referrals to payout
        await PartnerReferralModel.updateMany(
          { _id: { $in: referralIds } },
          { $set: { payoutId: payout._id } },
          { session }
        );

        // Audit log
        await AuditLogModel.create(
          [
            {
              action: AuditAction.PAYOUT_REQUESTED,
              severity: AuditSeverity.INFO,
              entityType: "Payout",
              description: `Payout requested: ${partner.name} - R$ ${partner.pendingPayout.toFixed(2)}`,
              metadata: {
                payoutId: payout._id,
                partnerId: partner._id,
                amount: partner.pendingPayout,
                referralCount: referralIds.length,
              },
            },
          ],
          { session }
        );
      });
    } finally {
      await session.endSession();
    }

    return NextResponse.json({
      _id: payout._id,
      partnerId: payout.partnerId,
      partnerName: payout.partnerName,
      partnerCode: payout.partnerCode,
      amount: payout.amount,
      pixKey: payout.pixKey,
      referralIds: payout.referralIds,
      status: payout.status,
      requestedAt: payout.requestedAt,
      createdAt: payout.createdAt,
    }, { status: 201 });
  });
}
