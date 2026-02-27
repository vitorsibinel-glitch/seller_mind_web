import { withDB } from "@/lib/mongoose";
import { getRedis } from "@/lib/redis";
import { IntegrationModel } from "@workspace/mongodb/models/integration";
import { StoreModel } from "@workspace/mongodb/models/store";
import { Queue } from "bullmq";
import { NextResponse } from "next/server";
import z from "zod";

const createStoreSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  taxRate: z.coerce.number().min(0, "Alíquota deve ser maior ou igual a 0"),
});

export type CreateStoreFormData = z.infer<typeof createStoreSchema>;

export async function POST(req: Request) {
  return withDB(async () => {
    const body = await req.json();
    const userId = req.headers.get("x-user-id");

    const redis = getRedis();

    const createDefaultAccounts = new Queue("default-accounts", {
      connection: redis,
    });

    const parsed = createStoreSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Dados inválidos", errors: parsed.error.format() },
        { status: 400 },
      );
    }

    if (!userId) {
      return NextResponse.json(
        {
          message: "Usuário não identificado.",
        },
        { status: 403 },
      );
    }

    const { name, taxRate } = parsed.data;

    const existingStore = await StoreModel.findOne({
      userId,
      name,
      active: true,
    });

    if (existingStore) {
      return NextResponse.json(
        { message: "Já existe uma loja com este nome." },
        { status: 409 },
      );
    }

    const newStore = await StoreModel.create({
      name,
      taxRate,
      userId,
    });

    await createDefaultAccounts.add("default-accounts", {
      storeId: newStore._id,
    });

    return NextResponse.json({}, { status: 201 });
  });
}

export async function GET(req: Request): Promise<Response> {
  return withDB(async () => {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        {
          message: "Usuário não identificado.",
        },
        { status: 403 },
      );
    }

    const stores = await StoreModel.find({ userId, active: true });

    const storeIds = stores.map((store) => store._id);
    const integrations = await IntegrationModel.find({
      storeId: { $in: storeIds },
    });

    const storeDTOs = stores.map((store) => {
      const storeIntegrations = integrations.filter(
        (intg) => intg.storeId.toString() === store._id.toString(),
      );

      return {
        _id: store._id.toString(),
        name: store.name,
        logoUrl: store.logoUrl,
        userId,
        integrations: storeIntegrations.map((integration) => ({
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
    });

    return NextResponse.json({ stores: storeDTOs }, { status: 200 });
  });
}
