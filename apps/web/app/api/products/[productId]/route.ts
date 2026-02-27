import { withDB } from "@/lib/mongoose";
import { ProductModel } from "@workspace/mongodb/models/product";
import { productSchemaUpdate } from "@/schemas/productSchema";
import { NextResponse } from "next/server";

interface Params {
  productId: string;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  return withDB(async () => {
    const { productId } = await params;
    const userIdFromHeader = req.headers.get("x-user-id");

    if (!userIdFromHeader) {
      return NextResponse.json(
        {
          message: "Usuário não identificado. Por favor, faça login novamente.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    const parsed = productSchemaUpdate.safeParse(body);
    if (!parsed.success) {
      console.error(parsed.error);

      return NextResponse.json(
        { message: "Dados inválidos", errors: parsed.error.format() },
        { status: 400 }
      );
    }

    const productFromId = await ProductModel.findById(productId);

    if (!productFromId) {
      return new Response(
        JSON.stringify({ message: "Produto não encontrado." }),
        { status: 404 }
      );
    }

    Object.assign(productFromId, parsed.data);

    await productFromId.save();

    return NextResponse.json(
      { message: "Produto atualizado com sucesso" },
      { status: 200 }
    );
  });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ productId: string }> }
): Promise<Response> {
  return withDB(async () => {
    const { productId } = await params;

    const productFromId = await ProductModel.findById(productId);

    if (!productFromId) {
      return new Response(
        JSON.stringify({ message: "Produto não encontrado." }),
        { status: 404 }
      );
    }

    await productFromId.deleteOne();

    return NextResponse.json(
      { message: "Produto deletado com sucesso" },
      { status: 200 }
    );
  });
}
