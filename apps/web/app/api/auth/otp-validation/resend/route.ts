import { withDB } from "@/lib/mongoose";
import { UserModel } from "@workspace/mongodb/models/user";
import { NextResponse } from "next/server";
import { generateOTP } from "@/services/otp-service";
import { send } from "@/utils/mail";
import { buildOtpTemplate } from "@/templates/otp-email-template";
import { z } from "zod";

const resendOtpSchema = z.object({
  userId: z.string().min(1),
});

export async function POST(req: Request) {
  return withDB(async () => {
    const body = await req.json();

    const parsed = resendOtpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Dados inválidos", errors: parsed.error.format() },
        { status: 400 },
      );
    }

    const { userId } = parsed.data;

    const user = await UserModel.findById(userId).select("email");
    if (!user) {
      return NextResponse.json(
        { message: "Usuário não encontrado." },
        { status: 404 },
      );
    }

    const otp = await generateOTP(userId);

    send({
      to: user.email,
      subject: "Seu novo código OTP para login",
      htmlContent: buildOtpTemplate(otp),
    });

    return NextResponse.json(
      { message: "Novo código OTP enviado. Verifique seu e-mail." },
      { status: 200 },
    );
  });
}
