import { withDB } from "@/lib/mongoose";
import { getRedis } from "@/lib/redis";
import { StoreModel } from "@workspace/mongodb/models/store";
import { Queue } from "bullmq";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  return withDB(async () => {
    const url = new URL(req.url);
    const storeId = url.searchParams.get("storeId");

    const store = await StoreModel.findById(storeId);

    if (!store) {
      return NextResponse.json(
        {
          message: "Loja não encontrada",
        },
        {
          status: 404,
        }
      );
    }

    const redis = getRedis();

    const fetch7daysQueue = new Queue("sync-7days-orders", {
      connection: redis,
    });

    fetch7daysQueue.add("sync-7days-orders", {
      store: {
        id: store._id,
        name: store.name,
      },
    });

    console.log("ok");

    return NextResponse.json({ status: "ok" });
  });
}
