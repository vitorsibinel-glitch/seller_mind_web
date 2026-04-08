import { withDB } from "@/lib/mongoose";
import { requireAdmin } from "@/lib/require-admin";
import { StoreModel } from "@workspace/mongodb/models/store";
import { UserModel } from "@workspace/mongodb/models/user";
import { NextResponse } from "next/server";

/**
 * GET /api/admin/stores/search?q=searchTerm
 *
 * Busca stores por nome para uso na UI de admin (p.ex., ao gerenciar acessos de managers).
 * Retorna stores ativas com nome do proprietário.
 */
export async function GET(req: Request): Promise<NextResponse> {
  return withDB(async () => {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }

    const denied = await requireAdmin(userId);
    if (denied) return denied;

    const url = new URL(req.url);
    const q = url.searchParams.get("q") || "";

    if (q.length < 2) {
      return NextResponse.json(
        { stores: [] },
        { status: 200 },
      );
    }

    // Busca case-insensitive por nome da loja
    const stores = await StoreModel.find({
      name: { $regex: q, $options: "i" },
      active: true,
    })
      .select("_id name userId")
      .limit(20)
      .lean();

    // Enriquecer com email do proprietário
    const userIds = stores.map((s) => s.userId);
    const users = await UserModel.find({ _id: { $in: userIds } })
      .select("_id email")
      .lean();
    const userMap = new Map(users.map((u) => [u._id.toString(), u.email]));

    const result = stores.map((store) => ({
      _id: store._id.toString(),
      name: store.name,
      ownerEmail: userMap.get(store.userId.toString()) || "—",
    }));

    return NextResponse.json({ stores: result });
  });
}
