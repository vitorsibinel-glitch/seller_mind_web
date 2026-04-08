"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGet } from "@/hooks/use-api";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@workspace/ui/components/table";
import { Card } from "@workspace/ui/components/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Copy, Check } from "lucide-react";
import { REFERRAL_STATUS_LABELS, generateReferralLink } from "@/lib/referral-constants";

interface Partner {
  _id: string;
  name: string;
  email: string;
  code: string;
  commissionRate: number;
  pendingPayout: number;
  totalPaid: number;
  pixKey: string | null;
  status: string;
  createdAt: string;
}

interface Referral {
  _id: string;
  payoutId: string | null;
  referralCode: string;
  subscriptionValue: number | null;
  commissionAmount: number | null;
  commissionRate: number;
  status: "pending" | "paid" | "refunded";
  paidAt: string | null;
  createdAt: string;
}

interface Payout {
  _id: string;
  amount: number;
  status: string;
  referralCount: number;
  requestedAt: string;
  completedAt: string | null;
  transactionId: string | null;
}

const payoutStatusColors: Record<string, string> = {
  pending: "bg-amber-900",
  processing: "bg-blue-900",
  completed: "bg-green-900",
  failed: "bg-red-900",
};

const payoutStatusLabels: Record<string, string> = {
  pending: "Pendente",
  processing: "Processando",
  completed: "Concluído",
  failed: "Falha",
};

export default function CreatorPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [copied, setCopied] = useState<string | null>(null);
  const [refPage, setRefPage] = useState(1);
  const [payoutPage, setPayoutPage] = useState(1);
  const [refStatus, setRefStatus] = useState<string>("");
  const [payoutStatus, setPayoutStatus] = useState<string>("");

  // Protect page: only creators can access
  useEffect(() => {
    if (!authLoading && user && user.role !== "creator") {
      router.push("/dashboard");
    }
  }, [authLoading, user, router]);

  const { data: partnerData, isLoading: partnerLoading } = useGet<{ partner: Partner }>(`/api/creator/partner`);
  const { data: referralsData, isLoading: refLoading } = useGet<{ referrals: Referral[]; total: number; page: number; pages: number }>(
    `/api/creator/referrals?page=${refPage}&limit=20${refStatus ? `&status=${refStatus}` : ""}`
  );
  const { data: payoutsData, isLoading: payoutLoading } = useGet<{ payouts: Payout[]; total: number; page: number; pages: number }>(
    `/api/creator/payouts?page=${payoutPage}&limit=20${payoutStatus ? `&status=${payoutStatus}` : ""}`
  );

  const partner: Partner | undefined = partnerData?.partner;
  const referrals: Referral[] = referralsData?.referrals || [];
  const payouts: Payout[] = payoutsData?.payouts || [];

  const referralLink = partner ? generateReferralLink(partner.code) : "";

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (authLoading || partnerLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Minhas Comissões</h1>
        <Card className="p-6">
          <p className="text-center text-muted-foreground">Nenhum parceiro encontrado</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Minhas Comissões</h1>

        {/* Código e Link */}
        <Card className="p-6 space-y-4 bg-slate-800 border-slate-700">
          <div className="space-y-3">
            {/* Código */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 mb-1">Meu Código</p>
                <p className="font-mono text-sm">{partner.code}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopy(partner.code, "code")}
                className="gap-2"
              >
                {copied === "code" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied === "code" ? "Copiado" : "Copiar"}
              </Button>
            </div>

            {/* Link de Referência */}
            <div className="border-t border-slate-700 pt-3">
              <p className="text-xs text-slate-400 mb-1">Link de Referência</p>
              <div className="flex items-center justify-between">
                <p className="font-mono text-sm break-all">{referralLink}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(referralLink, "link")}
                  className="gap-2 ml-2 shrink-0"
                >
                  {copied === "link" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied === "link" ? "Copiado" : "Copiar"}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-6 bg-amber-900/20 border-amber-800">
          <p className="text-xs text-amber-400 mb-2">Saldo Pendente</p>
          <p className="text-2xl font-bold text-amber-400">R$ {partner.pendingPayout.toFixed(2)}</p>
        </Card>
        <Card className="p-6 bg-green-900/20 border-green-800">
          <p className="text-xs text-green-400 mb-2">Total Pago</p>
          <p className="text-2xl font-bold text-green-400">R$ {partner.totalPaid.toFixed(2)}</p>
        </Card>
        <Card className="p-6 bg-slate-800">
          <p className="text-xs text-slate-400 mb-2">Total Comissões</p>
          <p className="text-2xl font-bold">
            R$ {(partner.pendingPayout + partner.totalPaid).toFixed(2)}
          </p>
        </Card>
      </div>

      {/* Referências */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Referências</h2>
          <Select value={refStatus} onValueChange={(val) => { setRefStatus(val); setRefPage(1); }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os status</SelectItem>
              <SelectItem value="pending">Aguardando pagamento</SelectItem>
              <SelectItem value="paid">Comissão confirmada</SelectItem>
              <SelectItem value="refunded">Reembolsado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>Valor</TableCell>
                <TableCell>Comissão</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Data</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {refLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : referrals.length ? (
                referrals.map((ref) => (
                  <TableRow key={ref._id}>
                    <TableCell className="font-medium">
                      {ref.subscriptionValue ? `R$ ${ref.subscriptionValue.toFixed(2)}` : "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {ref.commissionAmount ? `R$ ${ref.commissionAmount.toFixed(2)}` : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ref.status === "paid" ? "default" : "outline"}>
                        {REFERRAL_STATUS_LABELS[ref.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-400">
                      {new Date(ref.paidAt || ref.createdAt).toLocaleDateString("pt-BR")}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-slate-400">
                    Nenhuma referência
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        {referralsData && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              disabled={refPage === 1}
              onClick={() => setRefPage((p) => p - 1)}
            >
              ← Anterior
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">
                Página {refPage} de {referralsData.pages}
              </span>
            </div>
            <Button
              variant="outline"
              disabled={refPage >= referralsData.pages}
              onClick={() => setRefPage((p) => p + 1)}
            >
              Próxima →
            </Button>
          </div>
        )}
      </div>

      {/* Pagamentos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Pagamentos</h2>
          <Select value={payoutStatus} onValueChange={(val) => { setPayoutStatus(val); setPayoutPage(1); }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="processing">Processando</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="failed">Falha</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>Valor</TableCell>
                <TableCell>Referências</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Solicitado</TableCell>
                <TableCell>Concluído</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payoutLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : payouts.length ? (
                payouts.map((payout) => (
                  <TableRow key={payout._id}>
                    <TableCell className="font-semibold">R$ {payout.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{payout.referralCount}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={payoutStatusColors[payout.status]}>
                        {payoutStatusLabels[payout.status]}
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
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-400">
                    Nenhum pagamento
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        {payoutsData && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              disabled={payoutPage === 1}
              onClick={() => setPayoutPage((p) => p - 1)}
            >
              ← Anterior
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">
                Página {payoutPage} de {payoutsData.pages}
              </span>
            </div>
            <Button
              variant="outline"
              disabled={payoutPage >= payoutsData.pages}
              onClick={() => setPayoutPage((p) => p + 1)}
            >
              Próxima →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
