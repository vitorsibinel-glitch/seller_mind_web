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

interface BillingInvoice {
  _id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: string;
  dueDate: string;
  paidAt?: string;
  attempts: number;
  description: string;
  billingAccountId?: { name: string; email: string; gateway?: string };
  createdAt: string;
}

const statusColor: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  paid: "bg-success/10 text-success",
  failed: "bg-destructive/10 text-destructive",
  refunded: "bg-info/10 text-info",
  canceled: "bg-muted text-muted-foreground",
};

export default function AdminInvoicesPage() {
  const { data, isLoading } = useGet<{
    invoices: BillingInvoice[];
    total: number;
  }>("/api/admin/invoices");

  const fmt = (amount: number, currency: string) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(
      amount / 100,
    );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Faturas</h1>
        <p className="text-sm text-muted-foreground">
          {data?.total ?? 0} faturas no total
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
                <TableHead>Número</TableHead>
                <TableHead>Conta</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Pago em</TableHead>
                <TableHead>Tentativas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.invoices.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    Nenhuma fatura encontrada
                  </TableCell>
                </TableRow>
              ) : (
                data?.invoices.map((inv) => (
                  <TableRow key={inv._id}>
                    <TableCell className="font-mono text-sm">
                      {inv.invoiceNumber}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {inv.billingAccountId?.name ?? "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {inv.billingAccountId?.gateway}
                      </div>
                    </TableCell>
                    <TableCell>{fmt(inv.amount, inv.currency)}</TableCell>
                    <TableCell>
                      <Badge className={statusColor[inv.status] ?? ""}>
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(inv.dueDate).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      {inv.paidAt
                        ? new Date(inv.paidAt).toLocaleDateString("pt-BR")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-center">{inv.attempts}</TableCell>
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
