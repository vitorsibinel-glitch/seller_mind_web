"use client";

import { KpiCard } from "@/components/kpi-card";
import { PageHeader } from "@/components/page-header";
import { StoreSelector } from "@/components/store-selector";
import { formatDate } from "@/lib/format-date";
import { formatCurrency } from "@/utils/format-currency";
import { PeriodEnum } from "@/utils/get-period";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import {
  Calendar,
  DollarSign,
  FileText,
  Plus,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useGlobalFilter } from "@/contexts/global-filter-context";
import {
  createInvoiceFormSchema,
  type CreateInvoiceFormData,
} from "@/schemas/invoiceSchema";
import { useGet, usePost, useDelete, usePatch } from "@/hooks/use-api";
import { CreateInvoiceModal } from "@/components/create-invoice-modal";
import { UpdateInvoiceModal } from "@/components/update-invoice-modal";
import type { InvoiceDataDTO, InvoiceDTO } from "@/dtos/invoice-dto";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";

export default function InvoicesPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDTO | null>(
    null,
  );
  const [period, setPeriod] = useState<PeriodEnum>(PeriodEnum.TODAY);
  const [hasAppliedCustomPeriod, setHasAppliedCustomPeriod] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const { selectedStoreId } = useGlobalFilter();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateInvoiceFormData>({
    resolver: zodResolver(createInvoiceFormSchema),
    defaultValues: {
      type: "entry",
      number: "",
      emittedAt: "",
      totalAmount: "",
      cnpjCpf: "",
      partnerName: "",
      note: "",
    },
  });

  const invoicesApiUrl = `/api/finances/invoices?storeId=${selectedStoreId}`;

  const {
    data: invoicesData,
    isLoading: isInvoiceLoading,
    refetch: refetchInvoices,
  } = useGet<InvoiceDataDTO>(`${invoicesApiUrl!}&period=${period}`, {
    enabled: !!selectedStoreId,
    staleTime: 1000 * 30,
    retry: false,
  });

  const invoices = invoicesData?.invoices || [];
  const stats = invoicesData?.stats;

  const filteredInvoices = useMemo(() => {
    switch (activeTab) {
      case "entry":
        return invoices.filter((inv) => inv.type === "entry");
      case "exit":
        return invoices.filter((inv) => inv.type === "exit");
      case "pending":
        return invoices.filter((inv) => inv.status === "pending");
      case "all":
      default:
        return invoices;
    }
  }, [invoices, activeTab]);

  const createInvoiceMutation = usePost(invoicesApiUrl, {
    onSuccess: () => {
      toast.success("Nota fiscal criada com sucesso!");
      reset();
      setCreateDialogOpen(false);
      refetchInvoices();
    },
  });

  const { mutate: deleteInvoice, isPending: isDeleting } = useDelete();

  const { mutate: updateInvoice, isPending: isUpdating } = usePatch({
    onSuccess: () => {
      toast.success("Nota fiscal atualizada com sucesso!");
      setUpdateDialogOpen(false);
      setSelectedInvoice(null);
      refetchInvoices();
    },
    onError: () => {
      toast.error("Erro ao atualizar nota fiscal.");
    },
  });

  const onSubmit = (xmlRaw?: string) => {
    handleSubmit((data) => {
      const payload = xmlRaw ? { ...data, xmlRaw } : data;
      createInvoiceMutation.mutate(payload);
    })();
  };

  const handleEdit = (invoice: InvoiceDTO) => {
    setSelectedInvoice(invoice);
    setUpdateDialogOpen(true);
  };

  const handleDeleteClick = (invoice: InvoiceDTO) => {
    setSelectedInvoice(invoice);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!selectedInvoice) return;

    deleteInvoice(
      {
        url: `/api/finances/invoices/${selectedInvoice._id}?storeId=${selectedStoreId}`,
      },
      {
        onSuccess: () => {
          toast.success("Nota fiscal excluída com sucesso!");
          setDeleteDialogOpen(false);
          setSelectedInvoice(null);
          refetchInvoices();
        },
        onError: () => {
          toast.error("Erro ao excluir nota fiscal.");
        },
      },
    );
  };

  const handleUpdateSubmit = (data: CreateInvoiceFormData) => {
    if (!selectedInvoice) return;
    updateInvoice({
      url: `/api/finances/invoices/${selectedInvoice._id}?storeId=${selectedStoreId}`,
      data,
    });
  };

  const kpis = [
    {
      title: "Total de Notas",
      value: stats?.totalInvoices.toString() || "0",
      icon: FileText,
    },
    {
      title: "Valor Total Compras",
      value: formatCurrency(stats?.entryTotalAmount || 0),
      icon: DollarSign,
    },
    {
      title: "Valor Total Vendas",
      value: formatCurrency(stats?.exitTotalAmount || 0),
      icon: DollarSign,
    },
  ];

  const InvoiceTable = () => {
    if (isInvoiceLoading) {
      return (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    return (
      <Table>
        <TableHeader className="bg-sidebar">
          <TableRow>
            <TableHead>Número</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Data Emissão</TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead>CNPJ/CPF</TableHead>
            <TableHead className="text-right">Valor Total</TableHead>
            <TableHead className="text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredInvoices.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="text-center text-muted-foreground py-8"
              >
                Nenhuma nota fiscal encontrada
              </TableCell>
            </TableRow>
          ) : (
            filteredInvoices.map((invoice) => (
              <TableRow key={invoice._id}>
                <TableCell className="font-medium">{invoice.number}</TableCell>
                <TableCell>
                  <Badge
                    className={
                      invoice.type === "entry"
                        ? "bg-info/10 text-info"
                        : "bg-success/10 text-success"
                    }
                  >
                    {invoice.type === "entry" ? "Entrada" : "Saída"}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(new Date(invoice.emittedAt))}</TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {invoice.partnerName}
                </TableCell>
                <TableCell>{invoice.cnpjCpf}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(invoice.totalAmount)}
                </TableCell>

                <TableCell className="text-center">
                  <div className="flex justify-center space-x-2">
                    {invoice.status === "pending" && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEdit(invoice)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive"
                          onClick={() => handleDeleteClick(invoice)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notas Fiscais"
        description="Gerencie suas notas fiscais de entrada e saída"
        actionBtn={true}
        actionBtnTitle="Inserir NF"
        actionBtnIcon={Plus}
        actionFunc={() => setCreateDialogOpen(true)}
      />

      <div className="p-4 rounded-lg border shadow-sm space-y-4 bg-sidebar">
        <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">
          <StoreSelector />

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <Select
              value={period}
              onValueChange={(value) => setPeriod(value as PeriodEnum)}
              disabled={!!hasAppliedCustomPeriod}
            >
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PeriodEnum.TODAY}>Hoje</SelectItem>
                <SelectItem value={PeriodEnum.YESTERDAY}>Ontem</SelectItem>
                <SelectItem value={PeriodEnum.WEEK}>Últimos 7 dias</SelectItem>
                <SelectItem value={PeriodEnum.FIFTEEN_DAYS}>
                  Últimos 15 dias
                </SelectItem>
                <SelectItem value={PeriodEnum.MONTH}>
                  Últimos 30 dias
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.title} kpi={kpi} />
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Todas ({invoices.length})</TabsTrigger>
          <TabsTrigger value="entry">
            Entrada ({invoices.filter((inv) => inv.type === "entry").length})
          </TabsTrigger>
          <TabsTrigger value="exit">
            Saída ({invoices.filter((inv) => inv.type === "exit").length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pendentes (
            {invoices.filter((inv) => inv.status === "pending").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-4">
          <InvoiceTable />
        </TabsContent>

        <TabsContent value="entry" className="space-y-4 mt-4">
          <InvoiceTable />
        </TabsContent>

        <TabsContent value="exit" className="space-y-4 mt-4">
          <InvoiceTable />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4 mt-4">
          <InvoiceTable />
        </TabsContent>
      </Tabs>

      <CreateInvoiceModal
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={onSubmit}
        control={control}
        errors={errors}
        isLoading={createInvoiceMutation.isPending}
      />

      <UpdateInvoiceModal
        open={updateDialogOpen}
        onOpenChange={setUpdateDialogOpen}
        invoice={selectedInvoice}
        onSubmit={handleUpdateSubmit}
        isSubmitting={isUpdating}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir nota fiscal</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a nota fiscal{" "}
              <span className="font-medium">{selectedInvoice?.number}</span>?
              Essa ação não poderá ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>

            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="w-28"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Excluir"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
