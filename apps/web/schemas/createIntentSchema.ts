import z from "zod";

export const createIntentSchema = z.object({
  planId: z.string().min(1, "planId é obrigatório"),
  billingCycle: z.enum(["monthly", "annual"], {
    errorMap: () => ({
      message: "billingCycle deve ser 'monthly' ou 'annual'",
    }),
  }),
});
