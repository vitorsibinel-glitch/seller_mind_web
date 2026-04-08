import { withDB } from "@/lib/mongoose";
import { requireAdmin } from "@/lib/require-admin";
import { UserModel } from "@workspace/mongodb/models/user";
import { AdminMembershipModel } from "@workspace/mongodb/models/admin-membership";
import { StoreModel } from "@workspace/mongodb/models/store";
import { SubscriptionModel, SubscriptionStatus } from "@workspace/mongodb/models/subscription";
import { NextResponse } from "next/server";

export async function GET(req: Request): Promise<NextResponse> {
  return withDB(async () => {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }

    const denied = await requireAdmin(userId);
    if (denied) return denied;

    const [
      totalUsers,
      managerCount,
      creatorCount,
      adminCount,
      totalStores,
      activeSubscriptions,
    ] = await Promise.all([
      UserModel.countDocuments(),
      UserModel.countDocuments({ role: "manager" }),
      UserModel.countDocuments({ role: "creator" }),
      AdminMembershipModel.countDocuments({ isActive: true }),
      StoreModel.countDocuments({ active: true }),
      SubscriptionModel.countDocuments({
        status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
      }),
    ]);

    // Usuários pagantes = total menos managers, creators e admins
    const payingUsers = totalUsers - managerCount - creatorCount;

    return NextResponse.json({
      totalUsers,
      breakdown: {
        paying: Math.max(0, payingUsers),
        manager: managerCount,
        creator: creatorCount,
        admin: adminCount,
      },
      totalStores,
      activeSubscriptions,
    });
  });
}
