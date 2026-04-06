import { withDB } from "@/lib/mongoose";
import { NextResponse } from "next/server";

export async function GET() {
  return withDB(async () => {
    return NextResponse.json({ status: "healthy" });
  });
}
