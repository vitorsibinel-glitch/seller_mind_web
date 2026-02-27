"use client";

import { useEffect } from "react";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log do erro (você pode enviar para Sentry, LogRocket, etc.)
    console.error("App Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-full">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Algo deu errado</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Desculpe, ocorreu um erro inesperado na aplicação. Nossa equipe foi
            notificada e está trabalhando para resolver o problema.
          </p>

          {process.env.NODE_ENV === "development" && (
            <details className="bg-muted p-4 rounded-md text-sm">
              <summary className="cursor-pointer font-semibold mb-2">
                Detalhes do erro (apenas em desenvolvimento)
              </summary>
              <div className="space-y-2 mt-2">
                <div>
                  <strong>Mensagem:</strong>
                  <pre className="mt-1 text-xs overflow-auto">
                    {error.message}
                  </pre>
                </div>
                {error.stack && (
                  <div>
                    <strong>Stack trace:</strong>
                    <pre className="mt-1 text-xs overflow-auto max-h-40">
                      {error.stack}
                    </pre>
                  </div>
                )}
                {error.digest && (
                  <div>
                    <strong>Error Digest:</strong>
                    <pre className="mt-1 text-xs">{error.digest}</pre>
                  </div>
                )}
              </div>
            </details>
          )}

          <div className="flex gap-3 pt-4">
            <Button onClick={reset} variant="outline">
              Tentar novamente
            </Button>
            <Button onClick={() => (window.location.href = "/")}>
              Voltar ao início
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
