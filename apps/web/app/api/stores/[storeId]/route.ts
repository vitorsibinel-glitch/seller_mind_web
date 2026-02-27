import { withDB } from "@/lib/mongoose";
import { IntegrationModel } from "@workspace/mongodb/models/integration";
import { StoreModel } from "@workspace/mongodb/models/store";
import { updateStoreSchema } from "@/schemas/storeSchema";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
): Promise<Response> {
  return withDB(async () => {
    const userId = req.headers.get("x-user-id");
    const { storeId } = await params;

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

    const integrations = await IntegrationModel.find({ storeId: store._id });

    const storeDTO = {
      _id: store._id.toString(),
      name: store.name,
      logoUrl: store.logoUrl,
      userId,
      taxRate: store.taxRate,
      integrations: integrations.map((integration) => ({
        status:
          integration.status === "connected"
            ? "Conectado"
            : integration.status === "error"
              ? "Erro"
              : "Desconectado",
        provider: integration.provider ?? null,
        lastSync: integration.lastSync
          ? new Date(integration.lastSync).toLocaleString("pt-BR")
          : null,
      })),
    };

    return NextResponse.json({ store: storeDTO }, { status: 200 });
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  return withDB(async () => {
    const body = await req.json();

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

    const parsed = updateStoreSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Dados inválidos.",
          errors: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    Object.assign(store, parsed.data);

    await store.save();

    return NextResponse.json(
      { message: "Loja atualizada com sucesso" },
      { status: 200 }
    );
  });
}
