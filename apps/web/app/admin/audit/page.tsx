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

interface AuditLog {
  _id: string;
  action: string;
  severity: string;
  entityType: string;
  description: string;
  ip?: string;
  createdAt: string;
}

const severityColor: Record<string, string> = {
  info: "bg-info/10 text-info",
  warn: "bg-warning/10 text-warning",
  error: "bg-destructive/10 text-destructive",
};

export default function AdminAuditPage() {
  const { data, isLoading } = useGet<{ logs: AuditLog[]; total: number }>(
    "/api/admin/audit",
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Auditoria</h1>
        <p className="text-sm text-muted-foreground">
          {data?.total ?? 0} registros
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
                <TableHead>Ação</TableHead>
                <TableHead>Severidade</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.logs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                  >
                    Nenhum registro encontrado
                  </TableCell>
                </TableRow>
              ) : (
                data?.logs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell>
                      <code className="text-xs">{log.action}</code>
                    </TableCell>
                    <TableCell>
                      <Badge className={severityColor[log.severity] ?? ""}>
                        {log.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{log.entityType}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm">
                      {log.description}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.ip ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(log.createdAt).toLocaleString("pt-BR")}
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
