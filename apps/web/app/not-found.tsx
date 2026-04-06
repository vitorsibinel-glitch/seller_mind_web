import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { SearchX } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <SearchX className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Página não encontrada</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <div className="text-8xl font-bold text-muted-foreground/20 mb-4">
              404
            </div>
            <p className="text-muted-foreground text-lg mb-2">
              Ops! A página que você está procurando não existe.
            </p>
            <p className="text-sm text-muted-foreground">
              O link pode estar quebrado ou a página pode ter sido removida.
            </p>
          </div>

          <div className="flex gap-3 pt-4 justify-center">
            <Button asChild variant="outline">
              <Link href="javascript:history.back()">Voltar</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">Ir para o Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
