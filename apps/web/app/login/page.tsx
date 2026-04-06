"use client";

import { AuthSidebar } from "@/components/auth-sidebar";
import { DefaultButton } from "@/components/default-button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePost } from "@/hooks/use-api";
import { toast } from "sonner";
import { loginSchema, type LoginFormData } from "@/schemas/loginSchema";
import { useAuth } from "@/contexts/auth-context";

export default function Page() {
  const router = useRouter();
  const { setTempUserId } = useAuth();

  const { control, handleSubmit, formState } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const { mutate, isPending } = usePost("/api/auth/login", {
    onSuccess: (data: any) => {
      toast.success(data.message);
      setTempUserId(data.userId);
      router.push("/otp-validation");
    },
  });

  const onSubmit = (data: LoginFormData) => {
    mutate(data);
  };

  return (
    <Suspense fallback={<h1>Loading...</h1>}>
      <div className="flex min-h-svh">
        <AuthSidebar />

        <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold">Acesse sua conta</h1>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
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
                  href="/signup"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <>
                    Ainda não possui uma conta?{" "}
                    <span className="text-sm font-bold text-primary hover:underline">
                      Faça seu Cadastro
                    </span>
                  </>
                </Link>
              </div>

              <DefaultButton
                type="submit"
                disabled={!formState.isValid || isPending}
              >
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
