import { withDB } from "@/lib/mongoose";
import { StoreModel } from "@workspace/mongodb/models/store";
import { NextResponse } from "next/server";

interface Params {
  storeId: string;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  return withDB(async () => {
    const { storeId } = await params;
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        {
          message: "Usuário não identificado.",
        },
        { status: 403 }
      );
    }

    const store = await StoreModel.findOne({ _id: storeId, userId });

    if (!store) {
      return NextResponse.json(
        { message: "Loja não encontrada." },
        { status: 404 }
      );
    }

    store.active = false;
    await store.save();

    return NextResponse.json(
      {
        message: "Loja desativada com sucesso.",
      },
      { status: 200 }
    );
  });
}
