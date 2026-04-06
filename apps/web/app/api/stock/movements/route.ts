import { withDB } from "@/lib/mongoose";
import { StockMovementModel } from "@workspace/mongodb/models/stock-movement";
import { fromZonedTime } from "date-fns-tz";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export function GET(request: Request): Promise<NextResponse> {
  return withDB(async () => {
    const url = new URL(request.url);
    const storeId = url.searchParams.get("storeId");
    const customStartDate = url.searchParams.get("startDate");
    const customEndDate = url.searchParams.get("endDate");

    if (!storeId) {
      return NextResponse.json(
        { error: "Loja não encontrada" },
        { status: 404 },
      );
    }

    let fromDate: Date | null = null;
    let toDate: Date | null = null;

    if (customStartDate && customEndDate) {
      fromDate = fromZonedTime(
        `${customStartDate} 00:00:00`,
        "America/Sao_Paulo",
      );
      toDate = fromZonedTime(
        `${customEndDate} 23:59:59.999`,
        "America/Sao_Paulo",
      );
    }

    const matchQuery: any = {
      storeId: new mongoose.Types.ObjectId(storeId),
    };

    if (fromDate && toDate) {
      matchQuery.createdAt = {
        $gte: fromDate,
        $lte: toDate,
      };
    }

    const movements = await StockMovementModel.aggregate([
      {
        $match: matchQuery,
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $lookup: {
          from: "products",
          let: { productSku: "$productSku", storeId: "$storeId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$sku", "$$productSku"] },
                    { $eq: ["$storeId", "$$storeId"] },
                  ],
                },
              },
            },
          ],
          as: "product",
        },
      },
      {
        $unwind: {
          path: "$product",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    return NextResponse.json({ movements });
  });
}
