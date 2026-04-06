import { withDB } from "@/lib/mongoose";
import { UserModel } from "@workspace/mongodb/models/user";
import { NextResponse } from "next/server";
import argon2 from "argon2";
import { loginSchema } from "@/schemas/loginSchema";
import { generateOTP } from "@/services/otp-service";
import { send } from "@/utils/mail";
import { buildOtpTemplate } from "@/templates/otp-email-template";

export async function POST(req: Request) {
  return withDB(async () => {
    const body = await req.json();

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Dados inválidos", errors: parsed.error.format() },
        { status: 400 },
      );
    }

    const { email, password } = parsed.data;

    const existing = await UserModel.findOne({ email }).select("+passwordHash");
    if (!existing) {
      return NextResponse.json(
        {
          message: "Credenciais inválidas",
        },
        {
          status: 422,
        },
      );
    }

    const passwordMatches = await argon2.verify(
      existing.passwordHash,
      password,
    );

    if (!passwordMatches) {
      return NextResponse.json(
        {
          message: "Credenciais inválidas",
        },
        {
          status: 422,
        },
      );
    }

    const otp = await generateOTP(existing._id as string);

    send({
      to: email,
      subject: "Seu código OTP para login",
      htmlContent: buildOtpTemplate(otp),
    });

    return NextResponse.json(
      {
        message: "Código OTP enviado. Verifique seu e-mail.",
        userId: existing._id,
      },
      {
        status: 200,
      },
    );
  });
}
