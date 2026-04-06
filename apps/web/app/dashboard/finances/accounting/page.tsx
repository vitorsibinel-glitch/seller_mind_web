"use client";

import { KpiCard } from "@/components/kpi-card";
import { PageHeader } from "@/components/page-header";
import { StoreSelector } from "@/components/store-selector";
import { useGlobalFilter } from "@/contexts/global-filter-context";
import { useGet, usePost, useDelete, usePatch } from "@/hooks/use-api";
import { formatDate } from "@/lib/format-date";
import { formatCurrency } from "@/utils/format-currency";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
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
  Calendar,
  Eye,
  FileText,
  Loader2,
  Plus,
  Trash2,
  Repeat,
  Edit,
  Link2,
  AlertTriangle,
  Filter,
  Check,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@workspace/ui/components/badge";
import { Input } from "@workspace/ui/components/input";
import { CreateExpenseModal } from "@/components/create-expense-modal";
import { UpdateExpenseModal } from "@/components/update-expense-modal";
import type { CreateExpenseInput } from "@/schemas/expenseSchema";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { ExpensePeriodEnum } from "@/utils/get-expense-period";

interface Expense {
  _id: string;
  description: string;
  category: string;
  amount: number;
  dueDate: string;
  isRecurring: boolean;
  recurringId?: string;
  recurrence?: {
    type: string;
    interval?: number;
    dueDay?: number;
    endDate?: string;
  };
  documentRef?: string;
  tags?: string[];
  notes?: string;
  createdAt: string;
}

interface ExpensesResponse {
  expenses: Expense[];
  stats: {
    totalExpenses: number;
    totalCurrentMonth: number;
    totalFuture: number;
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  rent: "Aluguel",
  freight: "Frete",
  salary: "Salário",
  utilities: "Utilidades",
  marketing: "Marketing",
  supplies: "Suprimentos",
  maintenance: "Manutenção",
  taxes: "Impostos",
  services: "Serviços",
  other: "Outros",
};

const RECURRENCE_LABELS: Record<string, string> = {
  daily: "Diária",
  weekly: "Semanal",
  monthly: "Mensal",
  yearly: "Anual",
};

export default function ExpensesPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteRecurringDialog, setDeleteRecurringDialog] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [period, setPeriod] = useState<ExpensePeriodEnum>(
    ExpensePeriodEnum.CURRENT_MONTH,
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [tempStartDate, setTempStartDate] = useState("");
  const [tempEndDate, setTempEndDate] = useState("");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const { selectedStoreId } = useGlobalFilter();

  const queryClient = useQueryClient();

  const baseUrl = "/api/finances/expenses";

  const isCustomIncomplete =
    period === ExpensePeriodEnum.CUSTOM && (!customStartDate || !customEndDate);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      storeId: selectedStoreId || "",
      period,
    } as Record<string, string>);
    if (
      period === ExpensePeriodEnum.CUSTOM &&
      customStartDate &&
      customEndDate
    ) {
      params.set("startDate", customStartDate);
      params.set("endDate", customEndDate);
    }
    return params.toString();
  }, [selectedStoreId, period, customStartDate, customEndDate]);

  const url = useMemo(
    () => `${baseUrl}?${queryString}`,
    [baseUrl, queryString],
  );

  const {
    data: expensesResponse,
    isLoading,
    refetch,
  } = useGet<ExpensesResponse>(url, {
    enabled: !!selectedStoreId && !isCustomIncomplete,
    staleTime: 1000 * 30,
  });

  const expenses = expensesResponse?.expenses ?? [];
  const stats = expensesResponse?.stats;

  useEffect(() => {
    if (!selectedStoreId) return;
    if (
      period === ExpensePeriodEnum.CUSTOM &&
      (!customStartDate || !customEndDate)
    )
      return;
    refetch();
  }, [url, selectedStoreId, period, customStartDate, customEndDate, refetch]);

  const filteredExpenses = useMemo(() => {
    if (categoryFilter === "all") return expenses;
    return expenses.filter((expense) => expense.category === categoryFilter);
  }, [expenses, categoryFilter]);

  const createExpense = usePost(`${baseUrl}?storeId=${selectedStoreId}`, {
    onSuccess: (data: any) => {
      const message =
        data?.recurringCount > 0
          ? `Despesa criada! ${data.recurringCount} lançamentos futuros gerados.`
          : "Despesa criada com sucesso!";
      toast.success(message);
      setCreateDialogOpen(false);
      refetch();
    },
    onError: () => {
      toast.error("Erro ao criar despesa.");
    },
  });

  const updateExpense = usePatch({
    onSuccess: () => {
      const message = "Despesa atualizada com sucesso!";
      toast.success(message);
      setUpdateDialogOpen(false);
      setSelectedExpense(null);
      refetch();
    },
    onError: () => {
      toast.error("Erro ao atualizar despesa.");
    },
  });

  const { mutate: deleteExpense, isPending: isDeleting } = useDelete();

  const handleEditClick = (expense: Expense) => {
    setSelectedExpense(expense);
    setUpdateDialogOpen(true);
  };

  const handleDeleteClick = (expense: Expense) => {
    setSelectedExpense(expense);
    const isRecurringExpense = expense.isRecurring;
    if (isRecurringExpense) {
      setDeleteRecurringDialog(true);
    } else {
      setDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = (deleteFuture?: boolean) => {
    if (!selectedExpense) return;
    const url =
      deleteFuture !== undefined
        ? `/api/finances/expenses/${selectedExpense._id}?storeId=${selectedStoreId}&deleteFuture=${deleteFuture}`
        : `/api/finances/expenses/${selectedExpense._id}?storeId=${selectedStoreId}`;
    deleteExpense(
      { url },
      {
        onSuccess: (data: any) => {
          const message =
            data?.deletedCount > 1
              ? `Despesa e ${data.deletedCount - 1} lançamentos futuros excluídos!`
              : "Despesa excluída com sucesso!";
          toast.success(message);
          setDeleteDialogOpen(false);
          setDeleteRecurringDialog(false);
          setSelectedExpense(null);
          refetch();
        },
        onError: () => {
          toast.error("Erro ao excluir despesa.");
        },
      },
    );
  };

  const handleApplyCustomDate = () => {
    if (tempStartDate && tempEndDate) {
      setCustomStartDate(tempStartDate);
      setCustomEndDate(tempEndDate);
    }
  };

  const handleSubmit = (data: CreateExpenseInput) => {
    createExpense.mutate(data);
  };

  const handleUpdate = (
    data: CreateExpenseInput & { updateFuture?: boolean },
  ) => {
    if (!selectedExpense) return;
    updateExpense.mutate({
      url: `/api/finances/expenses/${selectedExpense._id}?storeId=${selectedStoreId}`,
      data,
    });
  };

  const kpis = [
    {
      title: "Qtd de Despesas",
      value: stats?.totalExpenses?.toString() ?? "0",
      icon: FileText,
    },
    {
      title: "Total do Período",
      value: formatCurrency(stats?.totalCurrentMonth),
      icon: Calendar,
    },
  ];

  const getRecurrenceLabel = (expense: Expense | null) => {
    if (!expense || !expense.isRecurring || !expense.recurrence) return null;
    const type =
      RECURRENCE_LABELS[expense.recurrence.type] || expense.recurrence.type;
    const interval =
      expense.recurrence.interval && expense.recurrence.interval > 1
        ? ` (a cada ${expense.recurrence.interval})`
        : "";
    return `${type}${interval}`;
  };

  const isRecurringChild = (expense: Expense) => {
    return expense.isRecurring && !!expense.recurringId;
  };

  const previewSelected = selectedExpense
    ? {
        description: selectedExpense.description,
        amount: selectedExpense.amount,
        dueDate: selectedExpense.dueDate,
        recurrence: selectedExpense.recurrence,
      }
    : { description: "", amount: 0, dueDate: "", recurrence: undefined };

  const recurrenceLabel = getRecurrenceLabel(selectedExpense) ?? "-";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contabilidade"
        description="Gerenciamento de lançamentos contábeis"
        actionBtn={true}
        actionBtnTitle="Nova Despesa"
        actionBtnIcon={Plus}
        actionFunc={() => setCreateDialogOpen(true)}
      />

      <div className="p-4 rounded-lg border shadow-sm space-y-4 bg-sidebar">
        <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <StoreSelector />

            <Select
              value={period}
              onValueChange={(value) => setPeriod(value as ExpensePeriodEnum)}
            >
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ExpensePeriodEnum.CURRENT_MONTH}>
                  Mês Atual
                </SelectItem>
                <SelectItem value={ExpensePeriodEnum.LAST_MONTH}>
                  Mês Anterior
                </SelectItem>
                <SelectItem value={ExpensePeriodEnum.CURRENT_YEAR}>
                  Ano Atual
                </SelectItem>
                <SelectItem value={ExpensePeriodEnum.CUSTOM}>
                  Personalizado
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {period === ExpensePeriodEnum.CUSTOM && (
        <div className="bg-sidebar p-4 rounded-sm border border-gray-200 dark:border-gray-800 animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Filter className="h-4 w-4" />
              <span>Filtrar por Período Específico</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Data Início
                </label>
                <div className="relative">
                  <Input
                    type="date"
                    value={tempStartDate}
                    onChange={(e) => setTempStartDate(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Data Fim
                </label>
                <div className="relative">
                  <Input
                    type="date"
                    value={tempEndDate}
                    onChange={(e) => setTempEndDate(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <Button
                onClick={handleApplyCustomDate}
                disabled={!tempStartDate || !tempEndDate || isLoading}
                className="w-full sm:w-auto"
              >
                <Check className="h-4 w-4 mr-2" />
                Aplicar Filtro
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.title} kpi={kpi} />
        ))}
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : isCustomIncomplete ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">
                  Selecione as datas e clique em "Aplicar Filtro" para
                  visualizar as despesas
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-sidebar">
                <TableRow>
                  <TableHead className="w-[100px]">Vencimento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-center">Recorrência</TableHead>
                  <TableHead className="text-center w-[120px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-8"
                    >
                      Nenhuma despesa encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((expense) => (
                    <TableRow
                      key={expense._id}
                      className={isRecurringChild(expense) ? "bg-muted/30" : ""}
                    >
                      <TableCell>
                        {formatDate(new Date(expense.dueDate))}
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <div className="flex items-center gap-2">
                          {isRecurringChild(expense) && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Link2 className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Lançamento recorrente</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          <span className="truncate">
                            {expense.description}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {CATEGORY_LABELS[expense.category]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(expense.amount)}
                      </TableCell>
                      <TableCell className="text-center">
                        {expense.isRecurring && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="flex items-center justify-center gap-1">
                                  <Repeat className="h-4 w-4 text-blue-500" />
                                  <span className="text-xs text-muted-foreground">
                                    {getRecurrenceLabel(expense)}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Despesa recorrente</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleEditClick(expense)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive"
                            onClick={() => handleDeleteClick(expense)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateExpenseModal
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleSubmit}
        isLoading={createExpense.isPending}
      />

      <UpdateExpenseModal
        open={updateDialogOpen}
        onOpenChange={setUpdateDialogOpen}
        expense={selectedExpense}
        onSubmit={handleUpdate}
        isLoading={updateExpense.isPending}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir despesa</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a despesa{" "}
              <span className="font-medium">
                {selectedExpense?.description}
              </span>
              ? Essa ação não poderá ser desfeita.
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
              onClick={() => handleDeleteConfirm()}
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

      <Dialog
        open={deleteRecurringDialog}
        onOpenChange={setDeleteRecurringDialog}
      >
        <DialogContent className="sm:max-w-lg">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-warning/10">
              <AlertTriangle className="h-6 w-6 text-warning" />
            </div>
            <div className="flex-1">
              <DialogHeader className="p-0">
                <DialogTitle className="text-lg flex items-center gap-2">
                  <Repeat className="h-4 w-4 text-info" />
                  Excluir lançamentos recorrentes
                </DialogTitle>
              </DialogHeader>

              <div className="mt-3 text-sm text-muted-foreground">
                Esta despesa foi gerada a partir de uma recorrência. Você pode
                excluir apenas este lançamento ou todos os lançamentos futuros
                gerados a partir desta recorrência.
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-md border p-3 bg-muted/30">
                  <div className="text-xs text-muted-foreground">Descrição</div>
                  <div className="font-medium truncate mt-1">
                    {selectedExpense?.description ?? "-"}
                  </div>
                </div>

                <div className="rounded-md border p-3 bg-muted/30">
                  <div className="text-xs text-muted-foreground">
                    Vencimento
                  </div>
                  <div className="font-medium mt-1">
                    {selectedExpense?.dueDate
                      ? formatDate(new Date(selectedExpense.dueDate))
                      : "-"}
                  </div>
                </div>

                <div className="rounded-md border p-3 bg-muted/30">
                  <div className="text-xs text-muted-foreground">Valor</div>
                  <div className="font-medium mt-1">
                    {selectedExpense
                      ? formatCurrency(selectedExpense.amount)
                      : "-"}
                  </div>
                </div>

                <div className="rounded-md border p-3 bg-muted/30">
                  <div className="text-xs text-muted-foreground">
                    Recorrência
                  </div>
                  <div className="font-medium mt-1">{recurrenceLabel}</div>
                </div>
              </div>

              <div className="mt-4 text-xs text-muted-foreground">
                Observação: excluir todos os lançamentos futuros removerá
                registros gerados automaticamente pela recorrência. Essa ação é
                irreversível.
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <div className="flex w-full gap-2">
              <Button
                variant="outline"
                className="flex-1 justify-center"
                onClick={() => {
                  setDeleteRecurringDialog(false);
                  setSelectedExpense(null);
                }}
                disabled={isDeleting}
              >
                Voltar
              </Button>

              <Button
                variant="outline"
                className="flex-1 justify-center"
                onClick={() => handleDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Excluir apenas este
              </Button>

              <Button
                variant="destructive"
                className="flex-1 justify-center"
                onClick={() => handleDeleteConfirm(true)}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Excluir esta e futuras
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
