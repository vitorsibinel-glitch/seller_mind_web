import { withDB } from "@/lib/mongoose";
import { expirePastDue } from "@workspace/billing/src/jobs/expire-past-due.job";
import { env } from "@/env";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = req.headers.get("x-cron-secret");
  if (!env.CRON_SECRET || secret !== env.CRON_SECRET) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  return withDB(async () => {
    const result = await expirePastDue();
    console.log(`[expire-past-due] expiredCount=${result.expiredCount}`);
    return NextResponse.json({ ok: true, ...result });
  });
}
