import { UserModel } from "@workspace/mongodb/models/user";
import { NextResponse } from "next/server";

/**
 * Bloqueia a ação se o userId não for um proprietário (owner/user).
 * Managers e creators são somente leitura — não podem executar operações de escrita.
 * Retorna NextResponse 403 se for manager ou creator, null caso contrário.
 */
export async function requireOwnerOnly(
  userId: string,
): Promise<NextResponse | null> {
  const user = await UserModel.findOne({ _id: userId }).lean();
  if (user?.role === "manager" || user?.role === "creator") {
    return NextResponse.json(
      { message: "Acesso negado: apenas proprietários podem executar esta ação" },
      { status: 403 },
    );
  }
  return null;
}
