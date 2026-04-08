import { withDB } from "@/lib/mongoose";
import { requireAdmin } from "@/lib/require-admin";
import { GoalModel } from "@workspace/mongodb/models/goal";
import { GOAL_TARGETS } from "@/app/config/goals.config";
import { NextResponse } from "next/server";

/**
 * GET /api/admin/gamification/users?targetAmount=10000
 *
 * Retorna os usuários únicos que atingiram um determinado nível de gamificação,
 * com contagem de lojas e o maior nível já alcançado.
 */
export async function GET(req: Request): Promise<NextResponse> {
  return withDB(async () => {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }

    const denied = await requireAdmin(userId);
    if (denied) return denied;

    const url = new URL(req.url);
    const targetAmountParam = url.searchParams.get("targetAmount");

    if (!targetAmountParam) {
      return NextResponse.json(
        { message: "targetAmount é obrigatório" },
        { status: 400 },
      );
    }

    const targetAmount = parseInt(targetAmountParam, 10);
    if (!GOAL_TARGETS.includes(targetAmount as (typeof GOAL_TARGETS)[number])) {
      return NextResponse.json(
        { message: "targetAmount inválido" },
        { status: 400 },
      );
    }

    // Usuarios únicos que atingiram este tier em qualquer mês
    const usersInTier = await GoalModel.aggregate([
      { $match: { targetAmount } },
      {
        $group: {
          _id: "$userId",
          storeIds: { $addToSet: "$storeId" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      // Maior tier já alcançado por este user em qualquer loja
      {
        $lookup: {
          from: "goals",
          let: { uid: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$userId", "$$uid"] } } },
            { $group: { _id: null, highest: { $max: "$targetAmount" } } },
          ],
          as: "allGoals",
        },
      },
      {
        $project: {
          userId: "$_id",
          userEmail: { $ifNull: ["$user.email", "—"] },
          storeCount: { $size: "$storeIds" },
          highestAchievement: {
            $ifNull: [{ $arrayElemAt: ["$allGoals.highest", 0] }, targetAmount],
          },
          _id: 0,
        },
      },
      { $sort: { highestAchievement: -1, storeCount: -1 } },
    ]);

    return NextResponse.json({
      users: usersInTier,
      total: usersInTier.length,
      targetAmount,
    });
  });
}
