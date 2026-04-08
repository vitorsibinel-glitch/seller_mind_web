import { withDB } from "@/lib/mongoose";
import { requireAdmin } from "@/lib/require-admin";
import { UserModel } from "@workspace/mongodb/models/user";
import { AdminMembershipModel } from "@workspace/mongodb/models/admin-membership";
import { UserStoreAccessModel } from "@workspace/mongodb/models/user-store-access";
import {
  AuditLogModel,
  AuditAction,
  AuditSeverity,
} from "@workspace/mongodb/models/audit-log";
import { NextResponse } from "next/server";

const VALID_ROLES = ["user", "manager", "creator"] as const;
type ValidRole = (typeof VALID_ROLES)[number];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
): Promise<NextResponse> {
  return withDB(async () => {
    const adminUserId = req.headers.get("x-user-id");

    if (!adminUserId) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }

    const denied = await requireAdmin(adminUserId);
    if (denied) return denied;

    const { userId } = await params;

    let body: { role?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: "Body inválido" }, { status: 400 });
    }

    const { role } = body;

    if (!role || !VALID_ROLES.includes(role as ValidRole)) {
      return NextResponse.json(
        { message: `Role inválida. Valores aceitos: ${VALID_ROLES.join(", ")}` },
        { status: 400 },
      );
    }

    const targetUser = await UserModel.findById(userId).lean();
    if (!targetUser) {
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    // Segurança: não permite alterar role de um admin (controlado por AdminMembership)
    const adminMembership = await AdminMembershipModel.findOne({
      userId,
      isActive: true,
    }).lean();

    if (adminMembership) {
      return NextResponse.json(
        {
          message:
            "Não é possível alterar a role de um admin. Gerencie admins via AdminMembership.",
        },
        { status: 403 },
      );
    }

    const oldRole = targetUser.role ?? "user";
    const newRole = role as ValidRole;

    // Nada a fazer se a role já é a mesma
    if (oldRole === newRole) {
      return NextResponse.json({ success: true, role: newRole, changed: false });
    }

    // Atualizar role
    await UserModel.updateOne({ _id: userId }, { role: newRole });

    // Se estava saindo de manager, desativar todos os acessos de loja
    if (oldRole === "manager") {
      await UserStoreAccessModel.updateMany(
        { managerId: userId },
        { isActive: false },
      );
    }

    // Registrar no audit log
    await AuditLogModel.create({
      action: AuditAction.ADMIN_USER_ROLE_CHANGED,
      severity: AuditSeverity.INFO,
      entityType: "User",
      entityId: targetUser._id,
      description: `Role alterada de "${oldRole}" para "${newRole}" pelo admin ${adminUserId}`,
      metadata: { oldRole, newRole, changedBy: adminUserId },
    });

    return NextResponse.json({ success: true, role: newRole, changed: true });
  });
}
