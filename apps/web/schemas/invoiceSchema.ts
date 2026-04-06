import z, { number } from "zod";

export const createInvoiceSchema = z.object({
  type: z.enum(["entry", "exit"]),
  number: z.string().trim().min(1, "Número é obrigatório"),
  emittedAt: z.string().min(1, "Data de emissão é obrigatória"),
  totalAmount: z.coerce
    .number()
    .min(0, "Valor total deve ser maior ou igual a zero"),
  cnpjCpf: z.string().trim().min(1, "CNPJ/CPF é obrigatório"),
  partnerName: z.string().optional(),
  note: z.string().optional(),
  xmlRaw: z.any().optional(),
});

export const createInvoiceFormSchema = z.object({
  type: z.enum(["entry", "exit"], {
    required_error: "Tipo de nota é obrigatório",
  }),
  number: z.string().trim().min(1, "Número da nota é obrigatório"),
  emittedAt: z.string().min(1, "Data de emissão é obrigatória"),
  totalAmount: z.string().min(1, "Valor total é obrigatório"),
  cnpjCpf: z.string().trim().min(1, "CNPJ/CPF é obrigatório"),
  partnerName: z.string().trim().optional(),
  note: z.string().trim().optional(),
  xmlRaw: z.any().optional(),
});

export type CreateInvoiceFormData = z.infer<typeof createInvoiceFormSchema>;
