"use client";

import { DefaultButton } from "@/components/default-button";
import { useAuth } from "@/contexts/auth-context";
import { useGlobalFilter } from "@/contexts/global-filter-context";
import { Button } from "@workspace/ui/components/button";
import { Rocket, ArrowRight, Store } from "lucide-react";
import { useRouter } from "next/navigation";

export default function WelcomePage() {
  const router = useRouter();
  const { isStoreIntegrated } = useGlobalFilter();

  if (isStoreIntegrated) {
    router.push("/dashboard");
    return;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card/50 p-10 text-center shadow-xl shadow-black/5 backdrop-blur-sm">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="inline-flex rounded-xl border border-primary/20 bg-primary/10 p-4">
            <Rocket className="h-8 w-8 text-primary" />
          </div>
        </div>

        {/* Texts */}
        <div className="mb-8 space-y-3">
          <h1 className="bg-gradient-to-b from-foreground to-foreground/90 bg-clip-text text-3xl font-bold leading-tight text-transparent md:text-4xl">
            Bem-vindo ao Sellermind!
          </h1>
          <p className="text-base text-muted-foreground">
            Conecte sua primeira loja para começar.
          </p>
        </div>

        {/* Divider */}
        <div className="mb-8 h-px w-full bg-border/60" />

        {/* CTA */}
        <DefaultButton
          className="w-full"
          onClick={() =>
            router.push("/dashboard/settings/integrations?first_time=true")
          }
        >
          <Store className="h-5 w-5" />
          Conectar sua primeira loja
          <ArrowRight className="h-4 w-4" />
        </DefaultButton>
      </div>
    </div>
  );
}
