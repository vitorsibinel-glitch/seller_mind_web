import { HttpError } from "@/app/core/http-error";
import { StoreModel, type Store } from "@workspace/mongodb/models/store";
import { Types } from "mongoose";

interface StoreWithId extends Store {
  _id: Types.ObjectId;
}

export async function validateStoreFromRequest(
  req: Request,
): Promise<{ store: StoreWithId; userId: string }> {
  const userId = req.headers.get("x-user-id");
  const url = new URL(req.url);
  const storeId = url.searchParams.get("storeId");

  if (!userId) {
    throw new HttpError("Não autorizado", 401);
  }

  if (!storeId) {
    throw new HttpError("Não autorizado", 401);
  }

  const store = await StoreModel.findOne({
    _id: storeId,
    userId,
    active: true,
  }).lean();

  if (!store) {
    throw new HttpError("Loja não encontrada ou usuário não autorizado.", 404);
  }

  return { store, userId };
}
