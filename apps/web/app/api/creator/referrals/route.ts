import { withDB } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import { requireCreator } from "@/lib/require-creator";
import { UserModel } from "@workspace/mongodb/models/user";
import { PartnerModel } from "@workspace/mongodb/models/partner";
import { PartnerReferralModel } from "@workspace/mongodb/models/partner-referral";

export async function GET(req: Request) {
  return withDB(async () => {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Check creator role + active status
    const denied = await requireCreator(userId);
    if (denied) return denied;

    // Get user
    const user = await UserModel.findOne({ _id: userId }).lean();
    if (!user) {
      return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });
    }

    // Get partner linked to this creator
    const partner = await PartnerModel.findOne({ userId }).lean();
    if (!partner) {
      return NextResponse.json({ message: "Criador não encontrado" }, { status: 404 });
    }

    // Parse query params
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const status = url.searchParams.get("status");

    // Build query
    let query: any = { partnerId: partner._id };
    if (status && ["pending", "paid", "refunded"].includes(status)) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    const total = await PartnerReferralModel.countDocuments(query);
    const referrals = await PartnerReferralModel.find(query)
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      referrals: referrals.map((ref: any) => ({
        _id: ref._id.toString(),
        payoutId: ref.payoutId ? ref.payoutId.toString() : null,
        referralCode: ref.referralCode,
        subscriptionValue: ref.subscriptionValue || null,
        commissionAmount: ref.commissionAmount || null,
        commissionRate: ref.commissionRate,
        status: ref.status,
        paidAt: ref.paidAt,
        createdAt: ref.createdAt,
      })),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  });
}
