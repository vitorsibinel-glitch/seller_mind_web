import { withDB } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import { requireCreator } from "@/lib/require-creator";
import { UserModel } from "@workspace/mongodb/models/user";
import { PartnerModel } from "@workspace/mongodb/models/partner";

export async function GET(req: Request) {
  return withDB(async () => {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Check creator role + active status
    const denied = await requireCreator(userId);
    if (denied) return denied;

    // Get user to ensure they're a creator
    const user = await UserModel.findOne({ _id: userId }).lean();
    if (!user) {
      return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });
    }

    // Get partner linked to this creator
    const partner = await PartnerModel.findOne({ userId }).lean();
    if (!partner) {
      return NextResponse.json({ message: "Criador não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      partner: {
        _id: partner._id.toString(),
        name: partner.name,
        email: partner.email,
        code: partner.code,
        commissionRate: partner.commissionRate,
        pendingPayout: partner.pendingPayout,
        totalPaid: partner.totalPaid,
        pixKey: partner.pixKey || null,
        status: partner.status,
        createdAt: partner.createdAt,
        updatedAt: partner.updatedAt,
      },
    });
  });
}
