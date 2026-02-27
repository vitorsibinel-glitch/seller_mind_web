import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();

  cookieStore.delete("auth_token");

  return NextResponse.json(
    { message: "Logout realizado com sucesso" },
    {
      status: 200,
      headers: {
        "Set-Cookie": "auth_token=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax",
      },
    }
  );
}
