import { withDB } from "@/lib/mongoose";

import { NextResponse } from "next/server";
import argon2 from "argon2";
import { signupSchema } from "@/schemas/signupSchema";
import { UserModel } from "@workspace/mongodb/models/user";
import { BillingAccountModel } from "@workspace/mongodb/models/billing-account";
import { SubscriptionModel, SubscriptionStatus } from "@workspace/mongodb/models/subscription";

export async function POST(req: Request) {
  return withDB(async () => {
    const body = await req.json();

    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Dados inválidos", errors: parsed.error.format() },
        { status: 400 },
      );
    }

    const { firstName, lastName, email, password } = parsed.data;

    const existing = await UserModel.findOne({ email });
    if (existing) {
      return NextResponse.json(
        {
          message: "Já existe um usuário registrado com esse e-mail",
        },
        {
          status: 400,
        },
      );
    }

    const passwordHash = await argon2.hash(password);

    const user = await UserModel.create({
      firstName,
      lastName,
      email,
      passwordHash,
    });

    const billingAccount = await BillingAccountModel.create({
      userId: user._id,
      name: `${firstName} ${lastName}`,
      email,
      document: "", // pode ser preenchido depois pelo usuário
    });

    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 20);

    await SubscriptionModel.create({
      billingAccountId: billingAccount._id,
      status: SubscriptionStatus.TRIALING,
      trialEnd,
    });

    return NextResponse.json(
      {
        message: "Usuário registrado com sucesso!",
        userId: user._id,
      },
      {
        status: 201,
      },
    );
  });
}
