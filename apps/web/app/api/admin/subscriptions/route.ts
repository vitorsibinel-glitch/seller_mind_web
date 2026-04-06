import { withDB } from "@/lib/mongoose";
import { requireAdmin } from "@/lib/require-admin";
import { SubscriptionModel } from "@workspace/mongodb/models/subscription";
import { checkAccess } from "@workspace/billing";
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
    const limit = Math.min(100, parseInt(url.searchParams.get("limit") ?? "50"));
    const skip = (page - 1) * limit;
    const status = url.searchParams.get("status");

    const filter = status ? { status } : {};

    const [subscriptions, total] = await Promise.all([
      SubscriptionModel.find(filter)
        .populate("billingAccountId", "name email document gateway")
        .populate("planId", "name slug tier")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SubscriptionModel.countDocuments(filter),
    ]);

    const enriched = subscriptions.map((sub) => {
      const access = checkAccess(sub as any);
      return { ...sub, accessStatus: access.status, hasAccess: access.hasAccess };
    });

    return NextResponse.json({ subscriptions: enriched, total, page, limit });
  });
}
