import { withDB } from "@/lib/mongoose";
import { OrderModel } from "@workspace/mongodb/models/order";
import { StoreModel } from "@workspace/mongodb/models/store";
import { GoalModel } from "@workspace/mongodb/models/goal";
import { endOfMonth, getMonth, getYear, startOfMonth } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { NextResponse } from "next/server";
import {
  getCurrentTierIndex,
  getNextGoalTarget,
  GOAL_TARGETS,
} from "@/app/config/goals.config";

export async function GET(req: Request): Promise<NextResponse> {
  return withDB(async () => {
    const url = new URL(req.url);
    const storeId = url.searchParams.get("storeId");
    const userId = req.headers.get("x-user-id");

    if (!storeId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const store = await StoreModel.findOne({
      _id: storeId,
      userId,
      active: true,
    }).lean();

    if (!store) {
      return NextResponse.json(
        { error: "Loja não encontrada" },
        { status: 404 },
      );
    }

    const now = toZonedTime(new Date(), "America/Sao_Paulo");
    const currentMonth = getMonth(now) + 1; // 1-12
    const currentYear = getYear(now);
    const firstDayOfMonth = startOfMonth(now);
    const lastDayOfMonth = endOfMonth(now);

    const currentMonthRevenue = await OrderModel.aggregate([
      {
        $match: {
          storeId: store._id,
          createdAt: {
            $gte: firstDayOfMonth,
            $lte: lastDayOfMonth,
          },
          "financialSummary.totalRevenue": { $gt: 0 },
          orderStatus: {
            $nin: ["Canceled", "Refunded", "Returned", "PendingCancellation"],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$financialSummary.totalRevenue" },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    const currentRevenue = currentMonthRevenue[0]?.totalRevenue || 0;
    const currentProfit = currentMonthRevenue[0]?.totalProfit || 0;
    const totalOrders = currentMonthRevenue[0]?.totalOrders || 0;

    const lastAchievement = await GoalModel.findOne({
      storeId: store._id,
      userId: store.userId,
    })
      .sort({ targetAmount: -1 })
      .lean();

    const highestAchievedTarget = lastAchievement?.targetAmount || 0;

    const nextTarget =
      getNextGoalTarget(highestAchievedTarget) ||
      (GOAL_TARGETS[GOAL_TARGETS.length - 1] as number);

    const achievementsThisMonth = await GoalModel.find({
      storeId: store._id,
      userId: store.userId,
      achievedMonth: currentMonth,
      achievedYear: currentYear,
    }).lean();

    const achievedTargetThisMonth = new Set(
      achievementsThisMonth!.map((a) => a.targetAmount),
    );

    const missedAchievements: (typeof GOAL_TARGETS)[number][] = [];

    for (const target of GOAL_TARGETS) {
      if (
        currentRevenue >= target &&
        !achievedTargetThisMonth.has(target) &&
        target > highestAchievedTarget
      ) {
        missedAchievements.push(target);
      }
    }

    let newlyAchieved: number[] = [];

    if (missedAchievements.length > 0) {
      const newAchievements = missedAchievements.map((targetAmount) => ({
        storeId: store._id,
        userId: store.userId,
        targetAmount,
        achievedMonth: currentMonth,
        achievedYear: currentYear,
        revenue: currentRevenue,
        achievedAt: now,
      }));

      try {
        const inserted = await GoalModel.insertMany(newAchievements, {
          ordered: false,
        });

        newlyAchieved = inserted.map((a) => a.targetAmount);
      } catch (error: any) {
        if (error.code !== 11000) {
          console.error("Erro ao salvar conquistas:", error);
        }
      }
    }

    const progressPercentage = Math.min(
      Math.round((currentRevenue / nextTarget) * 100),
      100,
    );

    const currentTierIndex = getCurrentTierIndex(currentRevenue);

    const allAchievements = await GoalModel.find({
      storeId: store._id,
      userId: store.userId,
    })
      .sort({ achievedAt: -1 })
      .lean();

    return NextResponse.json({
      currentRevenue,
      currentProfit,
      totalOrders,

      newlyAchievedTargets: newlyAchieved,

      currentTier: Math.max(0, currentTierIndex),
      nextTierTarget: nextTarget,
      progressPercentage,

      achievements: allAchievements.map((achievement) => ({
        targetAmount: achievement.targetAmount,
        achievedAt: achievement.achievedAt,
        month: achievement.achievedMonth,
        year: achievement.achievedYear,
        revenue: achievement.revenue,
      })),

      tiers: GOAL_TARGETS,

      period: {
        start: firstDayOfMonth,
        end: lastDayOfMonth,
        month: currentMonth,
        year: currentYear,
      },
    });
  });
}
