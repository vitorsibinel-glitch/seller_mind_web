import { withDB } from "@/lib/mongoose";
import { requireAdmin } from "@/lib/require-admin";
import { UserModel } from "@workspace/mongodb/models/user";
import { StoreModel } from "@workspace/mongodb/models/store";
import { UserStoreAccessModel } from "@workspace/mongodb/models/user-store-access";
import {
  AuditLogModel,
  AuditAction,
  AuditSeverity,
} from "@workspace/mongodb/models/audit-log";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ userId: string }> };

/**
 * GET /api/admin/users/[userId]/store-access
 * Lista todas as lojas que um manager tem acesso.
 */
export async function GET(
  req: Request,
  { params }: RouteContext,
): Promise<NextResponse> {
  return withDB(async () => {
    const adminUserId = req.headers.get("x-user-id");
    if (!adminUserId) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }

    const denied = await requireAdmin(adminUserId);
    if (denied) return denied;

    const { userId } = await params;

    const accesses = await UserStoreAccessModel.find({
      managerId: userId,
      isActive: true,
    }).lean();

    if (accesses.length === 0) {
      return NextResponse.json({ stores: [] });
    }

    const storeIds = accesses.map((a) => a.storeId);
    const stores = await StoreModel.find({ _id: { $in: storeIds } })
      .select("name active")
      .lean();

    const result = accesses.map((access) => {
      const store = stores.find(
        (s) => s._id.toString() === access.storeId.toString(),
      );
      return {
        storeId: access.storeId.toString(),
        storeName: store?.name ?? "—",
        storeActive: store?.active ?? false,
        grantedByAdminId: access.grantedByAdminId.toString(),
        createdAt: access.createdAt,
      };
    });

    return NextResponse.json({ stores: result });
  });
}

/**
 * POST /api/admin/users/[userId]/store-access
 * Concede acesso de manager a uma loja.
 * Body: { storeId: string }
 */
export async function POST(
  req: Request,
  { params }: RouteContext,
): Promise<NextResponse> {
  return withDB(async () => {
    const adminUserId = req.headers.get("x-user-id");
    if (!adminUserId) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }

    const denied = await requireAdmin(adminUserId);
    if (denied) return denied;

    const { userId } = await params;

    let body: { storeId?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: "Body inválido" }, { status: 400 });
    }

    const { storeId } = body;
    if (!storeId || typeof storeId !== "string") {
      return NextResponse.json(
        { message: "storeId é obrigatório" },
        { status: 400 },
      );
    }

    // Validar que o userId tem role manager
    const targetUser = await UserModel.findById(userId).lean();
    if (!targetUser) {
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 },
      );
    }
    if (targetUser.role !== "manager") {
      return NextResponse.json(
        { message: "Acesso só pode ser concedido a usuários com role manager" },
        { status: 400 },
      );
    }

    // Validar que a loja existe
    const store = await StoreModel.findById(storeId).lean();
    if (!store) {
      return NextResponse.json(
        { message: "Loja não encontrada" },
        { status: 404 },
      );
    }

    // Upsert: reativa se já existia, cria se não existia
    await UserStoreAccessModel.updateOne(
      { managerId: userId, storeId },
      { managerId: userId, storeId, grantedByAdminId: adminUserId, isActive: true },
      { upsert: true },
    );

    await AuditLogModel.create({
      action: AuditAction.ADMIN_STORE_ACCESS_GRANTED,
      severity: AuditSeverity.INFO,
      entityType: "User",
      entityId: targetUser._id,
      description: `Acesso à loja "${store.name}" concedido ao manager ${targetUser.email} pelo admin ${adminUserId}`,
      metadata: { managerId: userId, storeId, storeName: store.name, grantedBy: adminUserId },
    });

    return NextResponse.json({ success: true });
  });
}

/**
 * DELETE /api/admin/users/[userId]/store-access
 * Revoga acesso de manager a uma loja.
 * Body: { storeId: string }
 */
export async function DELETE(
  req: Request,
  { params }: RouteContext,
): Promise<NextResponse> {
  return withDB(async () => {
    const adminUserId = req.headers.get("x-user-id");
    if (!adminUserId) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }

    const denied = await requireAdmin(adminUserId);
    if (denied) return denied;

    const { userId } = await params;

    let body: { storeId?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: "Body inválido" }, { status: 400 });
    }

    const { storeId } = body;
    if (!storeId || typeof storeId !== "string") {
      return NextResponse.json(
        { message: "storeId é obrigatório" },
        { status: 400 },
      );
    }

    const updated = await UserStoreAccessModel.updateOne(
      { managerId: userId, storeId, isActive: true },
      { isActive: false },
    );

    if (updated.matchedCount === 0) {
      return NextResponse.json(
        { message: "Acesso não encontrado ou já revogado" },
        { status: 404 },
      );
    }

    const store = await StoreModel.findById(storeId).select("name").lean();
    const targetUser = await UserModel.findById(userId).select("email").lean();

    await AuditLogModel.create({
      action: AuditAction.ADMIN_STORE_ACCESS_REVOKED,
      severity: AuditSeverity.INFO,
      entityType: "User",
      entityId: userId,
      description: `Acesso à loja "${store?.name ?? storeId}" revogado do manager ${targetUser?.email ?? userId} pelo admin ${adminUserId}`,
      metadata: { managerId: userId, storeId, revokedBy: adminUserId },
    });

    return NextResponse.json({ success: true });
  });
}
