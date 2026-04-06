import z from "zod";

export const otpSchema = z.object({
  otpCode: z.string().min(6, "Código deve ter 6 dígitos"),
  userId: z.string().min(1, "Usuário inválido"),
});

export type OTPFormData = z.infer<typeof otpSchema>;
