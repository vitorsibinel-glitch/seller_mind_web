import z from "zod";

export const signupSchema = z.object({
  firstName: z.string().min(1, "Digite seu nome"),
  lastName: z.string().min(1, "Digite seu sobrenome"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

export type SignupFormData = z.infer<typeof signupSchema>;
