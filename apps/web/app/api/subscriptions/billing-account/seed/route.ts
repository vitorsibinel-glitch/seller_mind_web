import { withDB } from "@/lib/mongoose";
import { UserModel } from "@workspace/mongodb/models/user";
import { BillingAccountModel } from "@workspace/mongodb/models/billing-account";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  return withDB(async () => {
    const created: string[] = [];
    const skipped: string[] = [];

    const users = await UserModel.find({}).lean();

    for (const user of users) {
      const exists = await BillingAccountModel.findOne({
        userId: user._id,
      }).lean();

      if (exists) {
        skipped.push(user.email);
        continue;
      }

      await BillingAccountModel.create({
        userId: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        document: "",
      });

      created.push(user.email);
    }

    return NextResponse.json(
      {
        message: "Seed finalizado",
        created,
        skipped,
      },
      { status: 201 },
    );
  });
}
