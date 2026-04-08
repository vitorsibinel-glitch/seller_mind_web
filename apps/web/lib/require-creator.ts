import { NextResponse } from "next/server";
import { UserModel } from "@workspace/mongodb/models/user";

/**
 * Guard: Valida que o user autenticado é um creator
 * - role === "creator"
 *
 * Retorna null se válido, NextResponse de erro caso contrário
 */
export async function requireCreator(userId: string): Promise<NextResponse | null> {
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await UserModel.findOne({ _id: userId }).lean();

  if (!user) {
    return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });
  }

  if (user.role !== "creator") {
    return NextResponse.json(
      { message: "Acesso restrito a creators" },
      { status: 403 }
    );
  }

  return null;
}
