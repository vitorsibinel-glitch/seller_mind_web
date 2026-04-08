import { withDB } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { PartnerModel } from "@workspace/mongodb/models/partner";
import { PartnerReferralModel } from "@workspace/mongodb/models/partner-referral";
import { AuditLogModel, AuditAction, AuditSeverity } from "@workspace/mongodb/models/audit-log";

export async function GET(req: Request, { params }: { params: Promise<{ partnerId: string }> }) {
  return withDB(async () => {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const denied = await requireAdmin(userId);
    if (denied) return denied;

    const { partnerId } = await params;

    const partner = await PartnerModel.findById(partnerId).lean();
    if (!partner) {
      return NextResponse.json({ message: "Partner not found" }, { status: 404 });
    }

    const referrals = await PartnerReferralModel.find({ partnerId }).lean();

    const summary = {
      totalReferrals: referrals.length,
      totalCommissionAmount: referrals.reduce((sum, r) => sum + (r.commissionAmount || 0), 0),
      pendingPayout: partner.pendingPayout,
      totalPaid: partner.totalPaid,
    };

    return NextResponse.json({
      partner,
      referrals,
      summary,
    });
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ partnerId: string }> }) {
  return withDB(async () => {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const denied = await requireAdmin(userId);
    if (denied) return denied;

    const { partnerId } = await params;
    const body = await req.json();

    const partner = await PartnerModel.findById(partnerId);
    if (!partner) {
      return NextResponse.json({ message: "Partner not found" }, { status: 404 });
    }

    const changes: any = {};

    if (body.name !== undefined) {
      partner.name = body.name;
      changes.name = body.name;
    }
    if (body.commissionRate !== undefined) {
      if (body.commissionRate <= 0 || body.commissionRate > 1) {
        return NextResponse.json(
          { message: "Commission rate must be between 0 and 1" },
          { status: 400 }
        );
      }
      partner.commissionRate = body.commissionRate;
      changes.commissionRate = body.commissionRate;
    }
    if (body.pixKey !== undefined) {
      partner.pixKey = body.pixKey;
      changes.pixKey = body.pixKey;
    }
    if (body.status !== undefined) {
      if (!["active", "inactive"].includes(body.status)) {
        return NextResponse.json(
          { message: "Invalid status" },
          { status: 400 }
        );
      }
      partner.status = body.status;
      changes.status = body.status;
    }

    await partner.save();

    // Audit log
    await AuditLogModel.create({
      action: AuditAction.ADMIN_PARTNER_UPDATED,
      severity: AuditSeverity.INFO,
      entityType: "Partner",
      description: `Partner updated: ${partner.name}`,
      metadata: {
        partnerId: partner._id,
        changes,
      },
    });

    return NextResponse.json(partner);
  });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ partnerId: string }> }) {
  return withDB(async () => {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const denied = await requireAdmin(userId);
    if (denied) return denied;

    const { partnerId } = await params;

    const partner = await PartnerModel.findById(partnerId);
    if (!partner) {
      return NextResponse.json({ message: "Partner not found" }, { status: 404 });
    }

    if (partner.status === "inactive") {
      return NextResponse.json(
        { message: "Partner já está inativo" },
        { status: 409 }
      );
    }

    partner.status = "inactive";
    await partner.save();

    // Audit log
    await AuditLogModel.create({
      action: AuditAction.ADMIN_PARTNER_DELETED,
      severity: AuditSeverity.INFO,
      entityType: "Partner",
      description: `Partner deactivated: ${partner.name}`,
      metadata: {
        partnerId: partner._id,
      },
    });

    return NextResponse.json({ message: "Partner deactivated successfully" });
  });
}
