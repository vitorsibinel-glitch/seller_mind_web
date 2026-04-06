import { withDB } from "@/lib/mongoose";
import { requireAdmin } from "@/lib/require-admin";
import { AuditLogModel } from "@workspace/mongodb/models/audit-log";
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
    const severity = url.searchParams.get("severity");
    const action = url.searchParams.get("action");

    const filter: Record<string, unknown> = {};
    if (severity) filter.severity = severity;
    if (action) filter.action = action;

    const [logs, total] = await Promise.all([
      AuditLogModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLogModel.countDocuments(filter),
    ]);

    return NextResponse.json({ logs, total, page, limit });
  });
}
