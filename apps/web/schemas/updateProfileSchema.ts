import { z } from "zod";

export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(50, "Nome deve ter no máximo 50 caracteres"),

  lastName: z
    .string()
    .min(2, "Sobrenome deve ter pelo menos 2 caracteres")
    .max(50, "Sobrenome deve ter no máximo 50 caracteres")
    .optional()
    .or(z.literal("")),

  phone: z
    .string()
    .regex(
      /^\(\d{2}\)\s?\d{4,5}-?\d{4}$/,
      "Telefone inválido. Use o formato (00) 00000-0000"
    )
    .optional()
    .or(z.literal("")),

  email: z.string().email("Email inválido").toLowerCase(),

  document: z
    .string()
    .regex(
      /^(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})$/,
      "CPF/CNPJ inválido"
    )
    .optional()
    .or(z.literal("")),

  avatarUrl: z
    .string()
    .url("URL do avatar inválida")
    .optional()
    .or(z.literal("")),
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
