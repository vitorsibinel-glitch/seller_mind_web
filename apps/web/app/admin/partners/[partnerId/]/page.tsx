"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGet } from "@/hooks/use-api";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Badge } from "@workspace/ui/components/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@workspace/ui/components/table";
import { Card } from "@workspace/ui/components/card";

interface PartnerDetailResponse {
  partner: {
    _id: string;
    name: string;
    email: string;
    code: string;
    commissionRate: number;
    pixKey: string | null;
    status: string;
  };
  referrals: any[];
  summary: {
    totalReferrals: number;
    totalCommissionAmount: number;
    pendingPayout: number;
    totalPaid: number;
  };
}

export default function PartnerDetailPage({ params }: { params: Promise<{ partnerId: string }> }) {
  const router = useRouter();
  const p = params;
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const { data, isLoading } = useGet<PartnerDetailResponse>(
    `/api/admin/partners/${(p as any).partnerId}`
  );

  const partner = data?.partner;
  const referrals = data?.referrals || [];
  const summary = data?.summary;

  const handleSave = async () => {
    // TODO: Implement update via PATCH /api/admin/partners/[partnerId]
    // For now, just close edit mode
    setEditing(false);
  };

  if (isLoading) return <div className="text-center">Carregando...</div>;
  if (!partner) return <div className="text-center">Parceiro não encontrado</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{partner.name}</h1>
          <p className="text-slate-400">{partner.email}</p>
        </div>
        <div className="flex gap-2">
          {!editing && (
            <Button onClick={() => setEditing(true)}>Editar</Button>
          )}
          <Button variant="outline" onClick={() => router.back()}>
            Voltar
          </Button>
        </div>
      </div>

      {/* Partner Info Card */}
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">Informações do Parceiro</h3>
        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400">Nome</label>
              <Input
                value={formData.name || partner.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-slate-400">Taxa de Comissão (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                step="1"
                value={(formData.commissionRate || partner.commissionRate) * 100}
                onChange={(e) =>
                  setFormData({ ...formData, commissionRate: parseFloat(e.target.value) / 100 })
                }
              />
            </div>
            <div>
              <label className="text-sm text-slate-400">Chave PIX</label>
              <Input
                value={formData.pixKey || partner.pixKey || ""}
                onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                placeholder="CPF ou chave aleatória"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave}>Salvar</Button>
              <Button variant="outline" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-400">Código</p>
              <p className="font-mono">{partner.code}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Taxa</p>
              <p>{(partner.commissionRate * 100).toFixed(0)}%</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Status</p>
              <Badge variant={partner.status === "active" ? "default" : "outline"}>
                {partner.status}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-slate-400">PIX</p>
              <p className="text-sm">{partner.pixKey ? "✓ Configurado" : "✗ Não configurado"}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Financial Summary */}
      {summary && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Resumo Financeiro</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-slate-800 p-4 rounded-lg">
              <p className="text-xs text-slate-400">Referências</p>
              <p className="text-2xl font-bold">{summary.totalReferrals}</p>
            </div>
            <div className="bg-slate-800 p-4 rounded-lg">
              <p className="text-xs text-slate-400">Total Comissões</p>
              <p className="text-2xl font-bold">R$ {summary.totalCommissionAmount.toFixed(2)}</p>
            </div>
            <div className="bg-amber-900 p-4 rounded-lg">
              <p className="text-xs text-amber-400">Pendente</p>
              <p className="text-2xl font-bold text-amber-400">R$ {summary.pendingPayout.toFixed(2)}</p>
            </div>
            <div className="bg-green-900 p-4 rounded-lg">
              <p className="text-xs text-green-400">Pago</p>
              <p className="text-2xl font-bold text-green-400">R$ {summary.totalPaid.toFixed(2)}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Referrals Table */}
      <Card className="overflow-hidden">
        <div className="p-6">
          <h3 className="font-semibold mb-4">Referências</h3>
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
              {referrals.length ? (
                referrals.map((ref: any) => (
                  <TableRow key={ref._id}>
                    <TableCell>R$ {ref.subscriptionValue?.toFixed(2)}</TableCell>
                    <TableCell>R$ {ref.commissionAmount?.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={ref.status === "paid" ? "default" : "outline"}>
                        {ref.status}
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
        </div>
      </Card>
    </div>
  );
}
