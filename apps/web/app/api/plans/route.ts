import { withDB } from "@/lib/mongoose";
import { PlanModel } from "@workspace/mongodb/models/plan";
import { NextResponse } from "next/server";

export async function GET(req: Request): Promise<NextResponse> {
  return withDB(async () => {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const plans = await PlanModel.find({}).sort({ sortOrder: 1 }).lean();

    return NextResponse.json({ plans }, { status: 200 });
  });
}
