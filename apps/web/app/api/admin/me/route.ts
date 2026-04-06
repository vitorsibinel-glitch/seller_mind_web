import { withDB } from "@/lib/mongoose";
import { requireAdmin } from "@/lib/require-admin";
import { NextResponse } from "next/server";

export async function GET(req: Request): Promise<NextResponse> {
  return withDB(async () => {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }

    const denied = await requireAdmin(userId);
    if (denied) return denied;

    return NextResponse.json({ isAdmin: true });
  });
}
