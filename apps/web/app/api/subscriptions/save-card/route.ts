import { withDB } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import { BillingAccountModel } from "@workspace/mongodb/models/billing-account";
import { checkoutSchema } from "@/schemas/checkoutSchema";

// PROVISÓRIO !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
export async function POST(req: Request): Promise<NextResponse> {
  return withDB(async () => {
    const userId = req.headers.get("x-user-id");
    const body = await req.json();

    if (!userId) {
      return NextResponse.json(
        {
          message: "Usuário não identificado. Por favor, faça login novamente.",
        },
        { status: 403 },
      );
    }

    const billingAccountFromUserId = await BillingAccountModel.findOne({
      userId,
    });
    if (!billingAccountFromUserId) {
      return NextResponse.json(
        {
          message: "Usuário não identificado. Por favor, faça login novamente.",
        },
        { status: 403 },
      );
    }

    const parsed = await checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Dados inválidos", errors: parsed.error.format() },
        { status: 400 },
      );
    }

    const {
      cardHolderName,
      cardNumber,
      expirationMonth,
      expirationYear,
      cvv,
      docNumber,
    } = parsed.data;

    billingAccountFromUserId.paymentMethod = {
      provider: "ultralinks",
      card: {
        holder: cardHolderName,
        number: cardNumber,
        expiry_month: expirationMonth,
        expiry_year: expirationYear,
        cvv: cvv,
        doc_number: docNumber,
      },
    };

    await billingAccountFromUserId.save();

    return NextResponse.json({ message: "Cartão salvo com sucesso!" });
  });
}
