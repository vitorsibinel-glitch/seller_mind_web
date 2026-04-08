import { withDB } from "@/lib/mongoose";
import { requireAdmin } from "@/lib/require-admin";
import { GoalModel } from "@workspace/mongodb/models/goal";
import { GOAL_TIERS } from "@/app/config/goals.config";
import { NextResponse } from "next/server";

/**
 * GET /api/admin/gamification
 *
 * Retorna distribuição de gamificação por tier (por store e por user).
 * Estrutura preparada para visualização no admin com granularidade de:
 *   - contagem de stores únicas que atingiram cada tier
 *   - contagem de users únicos que atingiram cada tier
 *   - top 10 stores por tier mais alto atingido
 */
export async function GET(req: Request): Promise<NextResponse> {
  return withDB(async () => {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }

    const denied = await requireAdmin(userId);
    if (denied) return denied;

    // Distribuição por tier: stores únicas e users únicos que atingiram cada target
    const tierDistribution = await GoalModel.aggregate([
      {
        $group: {
          _id: "$targetAmount",
          uniqueStores: { $addToSet: "$storeId" },
          uniqueUsers: { $addToSet: "$userId" },
          totalAchievements: { $sum: 1 },
        },
      },
      {
        $project: {
          targetAmount: "$_id",
          storeCount: { $size: "$uniqueStores" },
          userCount: { $size: "$uniqueUsers" },
          totalAchievements: 1,
          _id: 0,
        },
      },
      { $sort: { targetAmount: 1 } },
    ]);

    // Top 10 stores por tier mais alto já atingido
    const topStores = await GoalModel.aggregate([
      {
        $group: {
          _id: "$storeId",
          highestTier: { $max: "$targetAmount" },
          userId: { $first: "$userId" },
        },
      },
      { $sort: { highestTier: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "stores",
          localField: "_id",
          foreignField: "_id",
          as: "store",
        },
      },
      { $unwind: "$store" },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          storeName: "$store.name",
          storeId: "$_id",
          highestTier: 1,
          ownerEmail: { $ifNull: ["$user.email", "—"] },
          _id: 0,
        },
      },
    ]);

    // Enriquecer tierDistribution com metadados do tier (nome, badge, cor)
    const enrichedTiers = GOAL_TIERS.map((tier) => {
      const found = tierDistribution.find(
        (t: { targetAmount: number }) => t.targetAmount === tier.targetAmount,
      );
      return {
        index: tier.index,
        targetAmount: tier.targetAmount,
        name: tier.name,
        badge: tier.badge,
        color: tier.color,
        storeCount: found?.storeCount ?? 0,
        userCount: found?.userCount ?? 0,
        totalAchievements: found?.totalAchievements ?? 0,
      };
    });

    return NextResponse.json({
      tiers: enrichedTiers,
      topStores,
    });
  });
}
