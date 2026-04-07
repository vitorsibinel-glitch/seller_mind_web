import { withDB } from "@/lib/mongoose";
<<<<<<< HEAD

import { NextResponse } from "next/server";
import argon2 from "argon2";
import { signupSchema } from "@/schemas/signupSchema";
import { UserModel } from "@workspace/mongodb/models/user";
import { BillingAccountModel } from "@workspace/mongodb/models/billing-account";
import { SubscriptionModel, SubscriptionStatus } from "@workspace/mongodb/models/subscription";
=======
import { NextResponse } from "next/server";
import argon2 from "argon2";
import mongoose from "mongoose";
import { signupSchema } from "@/schemas/signupSchema";
import { UserModel } from "@workspace/mongodb/models/user";
import { BillingAccountModel } from "@workspace/mongodb/models/billing-account";
import {
  SubscriptionModel,
  SubscriptionStatus,
} from "@workspace/mongodb/models/subscription";
import { env } from "@/env";
>>>>>>> origin/feat/fases-1-4

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

<<<<<<< HEAD
    const { firstName, lastName, email, password } = parsed.data;
=======
    const { firstName, lastName, email, password, referralCode } = parsed.data;
>>>>>>> origin/feat/fases-1-4

    const existing = await UserModel.findOne({ email });
    if (existing) {
      return NextResponse.json(
<<<<<<< HEAD
        {
          message: "Já existe um usuário registrado com esse e-mail",
        },
        {
          status: 400,
        },
=======
        { message: "Já existe um usuário registrado com esse e-mail" },
        { status: 400 },
>>>>>>> origin/feat/fases-1-4
      );
    }

    const passwordHash = await argon2.hash(password);

<<<<<<< HEAD
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
=======
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 20);

    const gateway = env.BILLING_GATEWAY;

    // Transação garante atomicidade: ou os três documentos são criados,
    // ou nenhum é. Requer MongoDB com replica set (Atlas ou rs local).
    const session = await mongoose.startSession();
    let userId: unknown;

    try {
      await session.withTransaction(async () => {
        const [user] = await UserModel.create(
          [{ firstName, lastName, email, passwordHash }],
          { session },
        );

        const [billingAccount] = await BillingAccountModel.create(
          [
            {
              userId: user._id,
              name: `${firstName} ${lastName}`,
              email,
              document: "",
              gateway,
              referralCode: referralCode ?? null,
            },
          ],
          { session },
        );

        await SubscriptionModel.create(
          [
            {
              billingAccountId: billingAccount._id,
              status: SubscriptionStatus.TRIALING,
              gateway,
              trialEnd,
            },
          ],
          { session },
        );

        userId = user._id;
      });
    } finally {
      await session.endSession();
    }

    return NextResponse.json(
      { message: "Usuário registrado com sucesso!", userId },
      { status: 201 },
>>>>>>> origin/feat/fases-1-4
    );
  });
}
