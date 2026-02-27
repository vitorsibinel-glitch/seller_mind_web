import { HttpError } from "@/app/core/http-error";
import { env } from "@/env";
import { connectMongo } from "@workspace/mongodb";
import { NextResponse } from "next/server";

export async function mongooseDB() {
  await connectMongo(env.DATABASE_URL);
}

export async function withDB<T>(
  callback: () => Promise<T>,
): Promise<T | NextResponse> {
  try {
    await mongooseDB();
    return await callback();
  } catch (error: any) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error("Unhandled error:", error);

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
