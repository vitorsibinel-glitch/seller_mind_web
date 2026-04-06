"use client";

import { AuthSidebar } from "@/components/auth-sidebar";
import { DefaultButton } from "@/components/default-button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePost } from "@/hooks/use-api";
import { toast } from "sonner";
import { signupSchema, type SignupFormData } from "../../schemas/signupSchema";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { control, handleSubmit, formState } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
  });

  const { mutate } = usePost("/api/auth/signup", {
    onSuccess: (data: any) => {
      toast.success(data.message);
      router.push("/login");
    },
  });

  const onSubmit = (data: SignupFormData) => {
    mutate(data);
  };

  useEffect(() => {
    const plan = searchParams.get("plan");
    if (plan) {
      localStorage.setItem("selected_plan", plan);
      toast.info(
        "Você selecionou o plano " +
          plan.replace(/-/g, " ").toUpperCase() +
          ". Complete seu cadastro para finalizar a assinatura.",
      );
    }
  }, []);

  return (
    <Suspense fallback={<h1>Loading...</h1>}>
      <div className="flex min-h-svh">
        <AuthSidebar />

        <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold">Crie sua conta</h1>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <Controller
                name="firstName"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nome</Label>
                    <Input id="firstName" placeholder="John" {...field} />
                    <p className="text-red-500 text-sm">
                      {formState.errors.firstName?.message as string}
                    </p>
                  </div>
                )}
              />

              <Controller
                name="lastName"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Último nome</Label>
                    <Input id="lastName" placeholder="Doe" {...field} />
                    <p className="text-red-500 text-sm">
                      {formState.errors.lastName?.message as string}
                    </p>
                  </div>
                )}
              />

              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      placeholder="name@example.com"
                      {...field}
                    />
                    <p className="text-red-500 text-sm">
                      {formState.errors.email?.message as string}
                    </p>
                  </div>
                )}
              />

              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      placeholder="*******"
                      type="password"
                      {...field}
                    />
                    <p className="text-red-500 text-sm">
                      {formState.errors.password?.message as string}
                    </p>
                  </div>
                )}
              />

              <div className="flex flex-1 justify-end mt-6">
                <Link
                  href="/login"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <>
                    Já possui uma conta?{" "}
                    <span className="text-sm font-bold text-primary hover:underline">
                      Faça Login
                    </span>
                  </>
                </Link>
              </div>

              <DefaultButton type="submit" disabled={!formState.isValid}>
                Continuar
              </DefaultButton>
            </form>

            <p className="text-xs text-muted-foreground text-center">
              Ao clicar em continuar, você concorda com nossos termos de{" "}
              <a href="#" className="underline">
                Termos de serviços
              </a>{" "}
              e{" "}
              <a href="#" className="underline">
                Política de Privacidade
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </Suspense>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<h1>Loading...</h1>}>
      <SignupForm />
    </Suspense>
  );
}
