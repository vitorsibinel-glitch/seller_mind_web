"use client";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { useRouter } from "next/navigation";
import { ArrowRight, RotateCw } from "lucide-react";
import { AuthSidebar } from "@/components/auth-sidebar";
import { DefaultButton } from "@/components/default-button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { otpSchema, type OTPFormData } from "@/schemas/otpSchema";
import { usePost } from "@/hooks/use-api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";

export default function Page() {
  const router = useRouter();
  const { tempUserId } = useAuth();

  const { mutate: validateOtp } = usePost("/api/auth/otp-validation", {
    onSuccess: (data: any) => {
      toast.success(data.message);
      router.push("/dashboard/welcome");
    },
  });

  const { mutate: resendOtp, isPending: isResending } = usePost(
    "/api/auth/otp-validation/resend",
    {
      onSuccess: (data: any) => {
        toast.success(data.message);
      },
    },
  );

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otpCode: "", userId: tempUserId! },
  });

  const otpCode = watch("otpCode") || "";

  const handleOtpChange = (index: number, value: string) => {
    if (/^\d*$/.test(value) && value.length <= 1) {
      const newOtp = otpCode.split("");
      newOtp[index] = value;
      setValue("otpCode", newOtp.join(""), { shouldValidate: true });

      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace") {
      const newOtp = otpCode.split("");

      // Se o campo atual estiver vazio, apaga o anterior
      if (!otpCode[index] && index > 0) {
        newOtp[index - 1] = "";
        setValue("otpCode", newOtp.join(""));
        const prevInput = document.getElementById(`otp-${index - 1}`);
        if (prevInput) prevInput.focus();
      } else {
        // Senão, apenas apaga o dígito atual
        newOtp[index] = "";
        setValue("otpCode", newOtp.join(""));
      }
    }
  };

  const onSubmit = async (data: OTPFormData) => {
    validateOtp(data);
  };

  const digits = otpCode.split("").concat(Array(6 - otpCode.length).fill(""));

  return (
    <div className="flex min-h-svh">
      <AuthSidebar />

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold">Validar código OTP</h1>
            <p className="text-muted-foreground">
              Insira o código de 6 dígitos enviado para seu e-mail
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="otp" className="sr-only">
                Código OTP
              </Label>
              <div className="flex justify-center gap-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digits[index] || ""}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-lg font-medium focus-visible:ring-primary"
                  />
                ))}
              </div>
              {errors.otpCode && (
                <p className="text-danger text-sm text-center mt-2">
                  {errors.otpCode.message}
                </p>
              )}
            </div>

            <DefaultButton
              type="submit"
              disabled={otpCode.length < 6 || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  Validando...
                </>
              ) : (
                <>
                  Validar código
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </DefaultButton>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            <p>Não recebeu o código?</p>
            <Button
              variant="link"
              className="text-primary h-auto p-0"
              disabled={isSubmitting || isResending}
              onClick={() => resendOtp({ userId: tempUserId })}
            >
              {isResending ? "Reenviando..." : "Reenviar código"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
