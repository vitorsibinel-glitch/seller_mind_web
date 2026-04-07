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

interface Partner {
  _id: string;
  name: string;
  email: string;
  document: string;
  phone?: string;
  gateway?: string;
  isActive: boolean;
  referralCode?: string;
  createdAt: string;
}

export default function AdminPartnersPage() {
  const { data, isLoading } = useGet<{ partners: Partner[]; total: number }>(
    "/api/admin/partners",
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Parceiros / Contas de Cobrança</h1>
        <p className="text-sm text-muted-foreground">
          {data?.total ?? 0} contas cadastradas
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
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Gateway</TableHead>
                <TableHead>Código de referral</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cadastro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.partners.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    Nenhuma conta encontrada
                  </TableCell>
                </TableRow>
              ) : (
                data?.partners.map((partner) => (
                  <TableRow key={partner._id}>
                    <TableCell className="font-medium">{partner.name}</TableCell>
                    <TableCell>{partner.email}</TableCell>
                    <TableCell>{partner.document}</TableCell>
                    <TableCell>{partner.gateway ?? "—"}</TableCell>
                    <TableCell>
                      {partner.referralCode ? (
                        <code className="text-xs">{partner.referralCode}</code>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          partner.isActive
                            ? "bg-success/10 text-success"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {partner.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(partner.createdAt).toLocaleDateString("pt-BR")}
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
