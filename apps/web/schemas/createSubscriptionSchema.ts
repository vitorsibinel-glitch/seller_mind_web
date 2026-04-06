import z from "zod";

export const createSubscriptionSchema = z.object({
  intentId: z.string().uuid("intentId deve ser um UUID válido"),
  planId: z.string().min(1, "planId é obrigatório"),
  billingCycle: z.enum(["monthly", "annual"], {
    errorMap: () => ({
      message: "billingCycle deve ser 'monthly' ou 'annual'",
    }),
  }),
  // paymentId: z.string().min(1, "paymentId é obrigatório"),
});
