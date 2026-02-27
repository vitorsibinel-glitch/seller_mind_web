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

  const spApiApplicationId = env.SP_APPLICATION_ID;

  const baseUrl = "https://sellercentral.amazon.com/apps/authorize/consent";

  const state = Buffer.from(JSON.stringify({ storeId })).toString("base64");

  const params = new URLSearchParams({
    application_id: spApiApplicationId!,
    state,
    version: "beta",
  });

  const authUrl = `${baseUrl}?${params.toString()}`;

  return NextResponse.json({ url: authUrl });
}
