import { PlanModel } from "@workspace/mongodb/models/plan";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ planSlug: string }> },
): Promise<NextResponse> {
  const { planSlug } = await params;
  console.log("opa");

  const plan = await PlanModel.findOne({ slug: planSlug });

  if (!plan) {
    return NextResponse.json(
      { message: "Plano não encontrado" },
      { status: 404 },
    );
  }

  return NextResponse.json({ plan });
}
