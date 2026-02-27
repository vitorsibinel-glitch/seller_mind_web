import { env } from "@/env";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);

  const storeId = url.searchParams.get("storeId");
  if (!storeId) {
    return NextResponse.json(
      { error: "loja não identificada" },
      { status: 400 }
    );
  }

  const appUrl = env.API_URL;

  const clientId = env.LWA_CLIENT_ID;
  const redirectUri = `${appUrl}/integrations/amazon-ads/callback`; // colocar um variavel app url

  const baseUrl = "https://www.amazon.com/ap/oa";

  const state = Buffer.from(JSON.stringify({ storeId })).toString("base64");

  const params = new URLSearchParams({
    client_id: clientId!,
    scope: "advertising::campaign_management",
    response_type: "code",
    redirect_uri: redirectUri,
    state,
  });

  const authUrl = `${baseUrl}?${params.toString()}`;

  return NextResponse.json({ url: authUrl });
}
