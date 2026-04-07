import { AdminMembershipModel } from "@workspace/mongodb/models/admin-membership";
import { NextResponse } from "next/server";

/**
 * Verifica se o userId possui AdminMembership ativa.
 * Retorna NextResponse 403 se não for admin, null se for.
 */
export async function requireAdmin(
  userId: string,
): Promise<NextResponse | null> {
  const membership = await AdminMembershipModel.findOne({
    userId,
    isActive: true,
  }).lean();

  if (!membership) {
    return NextResponse.json({ message: "Acesso negado" }, { status: 403 });
  }

  return null;
}
