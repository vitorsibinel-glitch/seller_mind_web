import { withDB } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { PayoutModel } from "@workspace/mongodb/models/payout";
import { PartnerModel } from "@workspace/mongodb/models/partner";
import { PartnerReferralModel } from "@workspace/mongodb/models/partner-referral";
import { AuditLogModel, AuditAction, AuditSeverity } from "@workspace/mongodb/models/audit-log";

const VALID_TRANSITIONS: Record<string, string[]> = {
  "pending": ["processing", "completed", "failed"],
  "processing": ["completed", "failed"],
  "completed": [],
  "failed": ["pending"],
};

export async function GET(req: Request, { params }: { params: Promise<{ payoutId: string }> }) {
  return withDB(async () => {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const denied = await requireAdmin(userId);
    if (denied) return denied;

    const { payoutId } = await params;

    const payout = await PayoutModel.findById(payoutId).lean();
    if (!payout) {
      return NextResponse.json({ message: "Payout not found" }, { status: 404 });
    }

    const referrals = await PartnerReferralModel.find({
      _id: { $in: payout.referralIds },
    }).lean();

    return NextResponse.json({
      payout: {
        ...payout,
        referralCount: payout.referralIds?.length || 0,
      },
      referrals,
    });
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ payoutId: string }> }) {
  return withDB(async () => {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const denied = await requireAdmin(userId);
    if (denied) return denied;

    const { payoutId } = await params;
    const body = await req.json();
    const { status: newStatus, transactionId } = body;

    const payout = await PayoutModel.findById(payoutId);
    if (!payout) {
      return NextResponse.json({ message: "Payout not found" }, { status: 404 });
    }

    const currentStatus = payout.status;

    // STATUS TRANSITION VALIDATION
    if (!VALID_TRANSITIONS[currentStatus]?.includes(newStatus)) {
      // Specific error messages
      if (currentStatus === newStatus) {
        return NextResponse.json(
          { message: `Pagamento já está em ${currentStatus}` },
          { status: 409 }
        );
      }
      if (currentStatus === "completed") {
        return NextResponse.json(
          { message: "Pagamento já foi finalizado. Não pode ser alterado" },
          { status: 403 }
        );
      }
      if (currentStatus === "processing" && newStatus === "pending") {
        return NextResponse.json(
          { message: "Não é permitido voltar para pendente" },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { message: `Transição inválida: ${currentStatus} → ${newStatus}` },
        { status: 400 }
      );
    }

    // If completing, require transactionId
    if (newStatus === "completed" && !transactionId) {
      return NextResponse.json(
        { message: "Transaction ID required for completed status" },
        { status: 400 }
      );
    }

    // Update payout
    payout.status = newStatus;
    if (transactionId) {
      payout.transactionId = transactionId;
    }
    if (newStatus === "completed") {
      payout.completedAt = new Date();

      // PAYOUT_COMPLETED: Decrement pendingPayout + Increment totalPaid
      await PartnerModel.findByIdAndUpdate(payout.partnerId, {
        $inc: {
          pendingPayout: -payout.amount,
          totalPaid: +payout.amount,
        },
      });

      // Audit log
      await AuditLogModel.create({
        action: AuditAction.PAYOUT_COMPLETED,
        severity: AuditSeverity.INFO,
        entityType: "Payout",
        description: `Payout completed: ${payout.partnerName} - R$ ${payout.amount.toFixed(2)}`,
        metadata: {
          payoutId: payout._id,
          partnerId: payout.partnerId,
          amount: payout.amount,
          transactionId,
        },
      });
    }

    await payout.save();

    return NextResponse.json({
      _id: payout._id,
      partnerId: payout.partnerId,
      status: payout.status,
      transactionId: payout.transactionId,
      completedAt: payout.completedAt,
    });
  });
}
