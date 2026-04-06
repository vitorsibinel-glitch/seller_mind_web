import { env } from "@/env";
import { withDB } from "@/lib/mongoose";
import { getRedis } from "@/lib/redis";
import { IntegrationModel } from "@workspace/mongodb/models/integration";
import { UserModel } from "@workspace/mongodb/models/user";
import axios from "axios";
import { NextResponse } from "next/server";
import z from "zod";

const callbackSchema = z.object({
  state: z.string(),
  code: z.string(),
});

export type CallbackFormData = z.infer<typeof callbackSchema>;

export async function POST(req: Request) {
  return withDB(async () => {
    const body = await req.json();
    const userId = req.headers.get("x-user-id");

    const parsed = callbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Dados inválidos", errors: parsed.error.format() },
        { status: 400 }
      );
    }

    const { code, state } = parsed.data;

    let storeId: string | null = null;

    const decodedState = Buffer.from(state, "base64").toString("utf-8");
    const parsedState = JSON.parse(decodedState);
    storeId = parsedState.storeId;

    const tokenUrl = "https://api.amazon.com/auth/o2/token";

    const url = env.API_URL;

    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${url}/integrations/amazon-ads/callback`, // criar talvez uma variavel de ambiente para isso
      client_id: env.LWA_CLIENT_ID,
      client_secret: env.LWA_CLIENT_SECRET,
    });

    const tokenRes = await axios.post(tokenUrl, params);

    if (tokenRes.status !== 200) {
      return NextResponse.json(
        { message: "Falha ao obter tokens da Amazon Ads" },
        { status: tokenRes.status }
      );
    }

    const { refresh_token, access_token, expires_in } = tokenRes.data;

    const profilesRes = await axios.get(
      "https://advertising-api.amazon.com/v2/profiles",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Amazon-Advertising-API-ClientId": env.LWA_CLIENT_ID,
        },
      }
    );

    const profiles = profilesRes.data;
    if (!Array.isArray(profiles) || profiles.length === 0) {
      return NextResponse.json(
        { message: "Nenhum profile encontrado para este token" },
        { status: 500 }
      );
    }

    const chosenProfile =
      profiles.find((p: any) => p.countryCode === "US") || profiles[0];

    const profileId = chosenProfile.profileId;

    console.log("PROFILE ID", profileId);

    await IntegrationModel.findOneAndUpdate(
      { storeId, provider: "amazon_ads" },
      {
        $set: {
          status: "connected",
          refreshToken: refresh_token,
          profileId,
          lastSync: new Date(),
        },
      },
      { upsert: true }
    );

    // talvez adicionar eventos para fazer essas mudanças, mas deixar assim por enquanto
    await UserModel.findOneAndUpdate(
      {
        _id: userId,
      },
      {
        $set: {
          isStoreIntegrated: true,
        },
      }
    );

    const redis = getRedis();

    const redisKey = `amazon_ads:access_token:${storeId}`;
    await redis.set(redisKey, access_token, "EX", expires_in || 3600); // 3600 segundos = 60 min

    return NextResponse.json({ success: true });
  });
}
