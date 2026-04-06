import { withDB } from "@/lib/mongoose";
import { otpSchema } from "@/schemas/otpSchema";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { env } from "@/env";
import { validateOTP } from "@/services/otp-service";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  return withDB(async () => {
    const body = await req.json();

    const parsed = otpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Dados inválidos", errors: parsed.error.format() },
        { status: 400 }
      );
    }

    const { otpCode, userId } = parsed.data;

    const verified = await validateOTP(userId, otpCode);

    if (!verified) {
      return NextResponse.json(
        { message: "OTP inválido ou expirado." },
        { status: 400 }
      );
    }

    const token = jwt.sign({ userId }, env.JWT_SECRET, {
      expiresIn: "7d",
    });

    (await cookies()).set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });

    return NextResponse.json({ message: "OTP verificado com sucesso" });
  });
}
