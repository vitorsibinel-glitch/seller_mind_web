import z from "zod";

export const checkoutSchema = z.object({
  cardHolderName: z.string().min(3, "Nome obrigatório"),
  cardNumber: z.string().min(19, "Número inválido").max(19, "Número inválido"),
  expirationMonth: z
    .string()
    .length(2, "Mês inválido")
    .refine((v) => +v >= 1 && +v <= 12, "Mês inválido"),
  expirationYear: z.string().length(2, "Ano inválido"),
  cvv: z.string().min(3, "CVV inválido").max(3, "CVV inválido"),
  docNumber: z.string().min(11, "CPF inválido").max(14, "CPF inválido"),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;
