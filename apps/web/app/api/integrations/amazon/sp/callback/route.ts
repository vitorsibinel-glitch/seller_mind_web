import { env } from "@/env";
import { withDB } from "@/lib/mongoose";
import { IntegrationModel } from "@workspace/mongodb/models/integration";
import { UserModel } from "@workspace/mongodb/models/user";
import axios from "axios";
import { NextResponse } from "next/server";
import { Queue } from "bullmq";

import { StoreModel } from "@workspace/mongodb/models/store";
import { getRedis } from "@/lib/redis";

export async function GET(req: Request) {
  return withDB(async () => {
    const url = new URL(req.url);
    const code = url.searchParams.get("spapi_oauth_code");
    const state = url.searchParams.get("state");
    const sellingPartnerId = url.searchParams.get("selling_partner_id");
    const userId = req.headers.get("x-user-id");

    const redis = getRedis();
    //REFATORAR DEPOIS
    const fetch7daysQueue = new Queue("sync-7days-orders", {
      connection: redis,
    });

    const syncProductQueue = new Queue("product-sync", {
      connection: redis,
    });

    if (!code || !state || !sellingPartnerId) {
      return NextResponse.json(
        {
          message: "Parâmetros inválidos",
          received: { code, state, sellingPartnerId },
        },
        { status: 400 },
      );
    }

    let storeId: string | null = null;

    const decodedState = Buffer.from(state, "base64").toString("utf-8");
    const parsedState = JSON.parse(decodedState);
    storeId = parsedState.storeId;

    const store = await StoreModel.findById(storeId);

    try {
      const tokenResponse = await axios.post(
        "https://api.amazon.com/auth/o2/token",
        {
          grant_type: "authorization_code",
          code,
          client_id: env.SP_API_CLIENT_ID,
          client_secret: env.SP_API_CLIENT_SECRET,
          redirect_uri: `${env.NEXT_PUBLIC_API_URL}/api/integrations/amazon/sp/callback`,
        },
      );

      const { refresh_token } = tokenResponse.data;

      await IntegrationModel.findOneAndUpdate(
        { storeId, provider: "amazon_sp", sellerId: sellingPartnerId },
        {
          $set: {
            status: "connected",
            refreshToken: refresh_token,
          },
        },
        { upsert: true },
      );

      fetch7daysQueue.add("sync-7days-orders", {
        store: {
          id: store?._id,
          name: store?.name,
        },
      });

      syncProductQueue.add("sync-store-products", {
        storeId: store?._id,
        sellerId: sellingPartnerId,
      });

      // talvez adicionar eventos para fazer essas mudanças, mas deixar assim por enquanto
      await UserModel.findOneAndUpdate(
        {
          _id: userId,
        },
        {
          $set: {
            isStoreIntegrated: true,
          },
        },
      );

      if (userId) {
        await UserModel.findOneAndUpdate(
          { _id: userId },
          { $set: { isStoreIntegrated: true } },
        );
      }

      return NextResponse.redirect(
        `${env.NEXT_PUBLIC_API_URL}/dashboard/settings/integrations/${storeId}?success=true`,
      );
    } catch (error: any) {
      console.error(
        "Erro ao trocar código pelo token:",
        error.response?.data || error.message,
      );

      return NextResponse.json(
        {
          message: "Erro ao trocar o código pelo token",
          error: error.response?.data || error.message,
        },
        { status: 500 },
      );
    }
  });
}
