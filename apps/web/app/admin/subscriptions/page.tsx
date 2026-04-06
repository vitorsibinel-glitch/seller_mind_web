"use client";

import { useGet } from "@/hooks/use-api";
import { Loader2 } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";

interface Subscription {
  _id: string;
  status: string;
  billingCycle?: string;
  gateway?: string;
  currentPeriodEnd?: string;
  billingAccountId?: { name: string; email: string; gateway?: string };
  planId?: { name: string; tier: string };
  createdAt: string;
}

const statusColor: Record<string, string> = {
  active: "bg-success/10 text-success",
  trialing: "bg-info/10 text-info",
  past_due: "bg-warning/10 text-warning",
  canceled: "bg-destructive/10 text-destructive",
  expired: "bg-muted text-muted-foreground",
  suspended: "bg-orange-100 text-orange-700",
};

export default function AdminSubscriptionsPage() {
  const { data, isLoading } = useGet<{
    subscriptions: Subscription[];
    total: number;
  }>("/api/admin/subscriptions");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Assinaturas</h1>
        <p className="text-sm text-muted-foreground">
          {data?.total ?? 0} assinaturas no total
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Conta</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ciclo</TableHead>
                <TableHead>Gateway</TableHead>
                <TableHead>Fim do período</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                  >
                    Nenhuma assinatura encontrada
                  </TableCell>
                </TableRow>
              ) : (
                data?.subscriptions.map((sub) => (
                  <TableRow key={sub._id}>
                    <TableCell>
                      <div className="font-medium">
                        {sub.billingAccountId?.name ?? "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {sub.billingAccountId?.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {sub.planId?.name ?? "—"}
                      {sub.planId?.tier && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({sub.planId.tier})
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColor[sub.status] ?? ""}>
                        {sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{sub.billingCycle ?? "—"}</TableCell>
                    <TableCell>{sub.gateway ?? "—"}</TableCell>
                    <TableCell>
                      {sub.currentPeriodEnd
                        ? new Date(sub.currentPeriodEnd).toLocaleDateString(
                            "pt-BR",
                          )
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
