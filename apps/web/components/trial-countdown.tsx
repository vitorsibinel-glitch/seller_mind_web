"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { useRouter } from "next/navigation";

interface TrialCountdownProps {
  deadline: Date;
  /** "trial" = fim do grace do trial | "payment" = fim da tolerância de pagamento */
  variant: "trial" | "payment";
}

function formatTimeLeft(ms: number): string {
  if (ms <= 0) return "Expirado";
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes} min`;
}

export function TrialCountdown({ deadline, variant }: TrialCountdownProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() => deadline.getTime() - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(deadline.getTime() - Date.now());
    }, 60_000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (dismissed || timeLeft <= 0) return null;

  const isUrgent = timeLeft < 24 * 60 * 60 * 1000; // menos de 1 dia

  const message =
    variant === "trial"
      ? `Período de avaliação encerrado. Você tem ${formatTimeLeft(timeLeft)} para assinar antes de perder o acesso.`
      : `Pagamento pendente. Acesso bloqueado em ${formatTimeLeft(timeLeft)} se não regularizado.`;

  const label = variant === "trial" ? "Escolher plano" : "Regularizar pagamento";

  return (
    <div
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium",
        isUrgent
          ? "bg-red-600 text-white"
          : "bg-amber-500 text-amber-950",
      )}
    >
      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={() => router.push("/plans")}
        className={cn(
          "flex-shrink-0 rounded-md px-3 py-1 text-xs font-semibold border transition-colors",
          isUrgent
            ? "border-white/40 hover:bg-white/10"
            : "border-amber-900/30 hover:bg-amber-900/10",
        )}
      >
        {label}
      </button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Fechar aviso"
        className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
