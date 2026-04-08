"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGet } from "@/hooks/use-api";
import { Button } from "@workspace/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Badge } from "@workspace/ui/components/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@workspace/ui/components/table";
import { Card } from "@workspace/ui/components/card";

interface PayoutsListResponse {
  payouts: Array<{
    _id: string;
    amount: number;
    status: string;
    referralCount: number;
    requestedAt: string;
    completedAt: string | null;
    partnerName: string;
  }>;
  total: number;
  page: number;
  limit: number;
  pages: number;
  summary: {
    totalPending: number;
    totalProcessing: number;
    totalCompleted: number;
  };
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-900",
  processing: "bg-blue-900",
  completed: "bg-green-900",
  failed: "bg-red-900",
};

const statusLabel: Record<string, string> = {
  pending: "Pendente",
  processing: "Processando",
  completed: "Concluído",
  failed: "Falha",
};

export default function PayoutsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("");

  const { data, isLoading } = useGet<PayoutsListResponse>(
    `/api/admin/payouts?page=${page}${status ? `&status=${status}` : ""}`
  );

  const summary = data?.summary || { totalPending: 0, totalProcessing: 0, totalCompleted: 0 };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pagamentos</h1>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-6 bg-amber-900/20 border-amber-800">
          <p className="text-xs text-amber-400">Pendentes</p>
          <p className="text-2xl font-bold">R$ {summary.totalPending?.toFixed(2) || "0.00"}</p>
        </Card>
        <Card className="p-6 bg-blue-900/20 border-blue-800">
          <p className="text-xs text-blue-400">Processando</p>
          <p className="text-2xl font-bold">R$ {summary.totalProcessing?.toFixed(2) || "0.00"}</p>
        </Card>
        <Card className="p-6 bg-green-900/20 border-green-800">
          <p className="text-xs text-green-400">Concluído</p>
          <p className="text-2xl font-bold">R$ {summary.totalCompleted?.toFixed(2) || "0.00"}</p>
        </Card>
        <Card className="p-6 bg-slate-800">
          <p className="text-xs text-slate-400">Histórico</p>
          <p className="text-2xl font-bold">R$ {summary.totalCompleted?.toFixed(2) || "0.00"}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={status} onValueChange={(val) => { setStatus(val); setPage(1); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos os status</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="processing">Processando</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
            <SelectItem value="failed">Falha</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>Parceiro</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Referências</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Solicitado</TableCell>
              <TableCell>Concluído</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">Carregando...</TableCell>
              </TableRow>
            ) : data?.payouts?.length ? (
              data.payouts.map((payout: any) => (
                <TableRow
                  key={payout._id}
                  onClick={() => router.push(`/admin/payouts/${payout._id}`)}
                  className="cursor-pointer hover:bg-slate-800"
                >
                  <TableCell className="font-medium">{payout.partnerName}</TableCell>
                  <TableCell className="font-semibold">R$ {payout.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{payout.referralCount}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[payout.status]}>
                      {statusLabel[payout.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-400">
                    {new Date(payout.requestedAt).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-sm text-slate-400">
                    {payout.completedAt
                      ? new Date(payout.completedAt).toLocaleDateString("pt-BR")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">→</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-slate-400">
                  Nenhum pagamento encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {data && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            ← Anterior
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">
              Página {page} de {data.pages}
            </span>
          </div>
          <Button
            variant="outline"
            disabled={page >= data.pages}
            onClick={() => setPage(p => p + 1)}
          >
            Próxima →
          </Button>
        </div>
      )}
    </div>
  );
}
