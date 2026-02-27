import { withDB } from "@/lib/mongoose";
import { UserModel } from "@workspace/mongodb/models/user";
import { NextResponse } from "next/server";
import { updateProfileSchema } from "@/schemas/updateProfileSchema";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
  return withDB(async () => {
    const userIdFromHeader = req.headers.get("x-user-id");
    const { userId } = await params;

    if (!userIdFromHeader) {
      return NextResponse.json(
        {
          message: "Usuário não identificado. Por favor, faça login novamente.",
        },
        { status: 403 }
      );
    }

    if (userIdFromHeader !== userId) {
      return NextResponse.json(
        {
          message: "Você não tem permissão para editar este perfil.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Dados inválidos",
          errors: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const { firstName, lastName, phone, email, document, avatarUrl } =
      parsed.data;

    const existingUser = await UserModel.findOne({
      email,
      _id: { $ne: userIdFromHeader },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          message: "Este email já está em uso.",
        },
        { status: 400 }
      );
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      userIdFromHeader,
      {
        firstName,
        lastName,
        phone,
        email,
        document,
        avatarUrl,
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        {
          message: "Usuário não encontrado.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      userId: updatedUser._id,
      message: "Perfil atualizado com sucesso!",
    });
  });
}
