import type { CheckoutFormData } from "@/schemas/checkoutSchema";
import axios from "axios";
import { useState } from "react";
import { toast } from "sonner";

type SubmitParams = {
  data: CheckoutFormData;
  hash: string;
  total: number;
  customerEmail: string;
  hasTrial: boolean;
};

export function useUltralinksPayment() {
  const [isProcessing, setIsProcessing] = useState(false);

  async function submit({
    data,
    hash,
    total,
    customerEmail,
    hasTrial,
  }: SubmitParams): Promise<{ paymentId: string; cardToken: string } | null> {
    const orderId = crypto.randomUUID().slice(0, 9);

    try {
      setIsProcessing(true);

      const { data: response } = await axios.post(
        "https://payments.dig2pay.com/payments/creditcard",
        {
          payment: {
            card: {
              holder: data.cardHolderName,
              number: data.cardNumber.replace(/\s/g, ""),
              expiry_month: data.expirationMonth,
              expiry_year: `20${data.expirationYear}`,
              cvv: data.cvv,
            },
            type: "credit",
            installments: 1,
            capture: !hasTrial,
            softdescriptor: "DRO*MPE",
            currency_code: "BRL",
          },
          customer: {
            name: data.cardHolderName,
            document: data.docNumber,
            email: customerEmail,
            phone: "0000000000",
          },
          amount: hasTrial ? "100" : (total * 100).toString(), // R$1,00 para validar no trial
          order_id: orderId,
          online_id: orderId,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: hash,
          },
        },
      );

      if (response.status === 7) {
        toast.error("Pagamento recusado. Tente outro cartão.");
        return null;
      }

      if (response.status === 3) {
        return {
          paymentId: response.paymentId,
          cardToken: response.cardToken, // salvar para cobranças futuras
        };
      }

      toast.error("Resposta inesperada do gateway.");
      return null;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Erro Ultralinks:", error.response?.data);
      }
      toast.error("Erro inesperado. Tente novamente.");
      return null;
    } finally {
      setIsProcessing(false);
    }
  }

  return { submit, isProcessing };
}
