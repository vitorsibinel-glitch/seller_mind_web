export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { withDB } from "@/lib/mongoose";
import { getInventoryHealth } from "@/services/get-inventory-health";
import { validateStoreFromRequest } from "@/lib/validate-store-from-request";

export async function GET(req: Request): Promise<NextResponse> {
  return withDB(async () => {
    const url = new URL(req.url);
    const days = url.searchParams.get("days");
    const analysisPeriod = days ? parseInt(days) : 30;

    const { store } = await validateStoreFromRequest(req);

    const storeIdStr = store._id.toString();

    const result = await getInventoryHealth(storeIdStr, analysisPeriod);

    if (result.error) {
      return NextResponse.json(
        { message: result.message },
        { status: result.status ?? 500 },
      );
    }

    return NextResponse.json({
      items: result.items,
      inventoryDetails: result.inventoryDetails,
    });
  });
}
