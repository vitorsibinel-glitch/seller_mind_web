"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { useGet } from "@/hooks/use-api";

interface SubscriptionStatusResponse {
  hasAccess: boolean;
  status: string;
}

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const { data } = useGet<SubscriptionStatusResponse>("/api/subscriptions/status");

  useEffect(() => {
    if (data) {
      setChecking(false);
      if (data.hasAccess && data.status === "active") {
        setTimeout(() => router.push("/dashboard"), 3000);
      }
    }
  }, [data, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {checking ? (
          <>
            <Loader2 className="h-16 w-16 text-primary mx-auto animate-spin" />
            <h1 className="text-2xl font-bold">Processando pagamento...</h1>
            <p className="text-muted-foreground">
              Aguarde enquanto confirmamos seu pagamento.
            </p>
          </>
        ) : (
          <>
            <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto" />
            <h1 className="text-2xl font-bold">Pagamento confirmado!</h1>
            <p className="text-muted-foreground">
              Sua assinatura está ativa. Você será redirecionado em instantes.
            </p>
            <Button onClick={() => router.push("/dashboard")}>
              Ir para o Dashboard
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
