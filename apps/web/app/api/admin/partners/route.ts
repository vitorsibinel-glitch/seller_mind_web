import { withDB } from "@/lib/mongoose";
import { requireAdmin } from "@/lib/require-admin";
import { PartnerModel } from "@workspace/mongodb/models/partner";
import { NextResponse } from "next/server";

export async function GET(req: Request): Promise<NextResponse> {
  return withDB(async () => {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }

    const denied = await requireAdmin(userId);
    if (denied) return denied;

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
    const limit = Math.min(
      100,
      parseInt(url.searchParams.get("limit") ?? "50"),
    );
    const skip = (page - 1) * limit;

    const [partners, total] = await Promise.all([
      PartnerModel.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PartnerModel.countDocuments(),
    ]);

    return NextResponse.json({ partners, total, page, limit });
  });
}
