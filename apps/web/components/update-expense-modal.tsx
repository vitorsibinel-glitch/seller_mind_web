"use client";

import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Button } from "@workspace/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Textarea } from "@workspace/ui/components/textarea";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { useForm, Controller } from "react-hook-form";
import { RotateCw, AlertTriangle, Repeat } from "lucide-react";
import { useCommaDecimal } from "@/hooks/use-comma-decimal";
import { sanitizeNumericInput } from "@/utils/sanitize-numeric-input";
import { formatDate } from "@/lib/format-date";
import { formatCurrency } from "@/utils/format-currency";
import type { CreateExpenseInput } from "@/schemas/expenseSchema";

const CATEGORY_LABELS: Record<string, string> = {
  rent: "Aluguel",
  freight: "Frete",
  salary: "Salário",
  utilities: "Utilidades (água, luz, internet)",
  marketing: "Marketing",
  supplies: "Suprimentos",
  maintenance: "Manutenção",
  taxes: "Impostos",
  services: "Serviços",
  other: "Outros",
};

const RECURRENCE_TYPE_LABELS: Record<string, string> = {
  none: "Não recorrente",
  daily: "Diária",
  weekly: "Semanal",
  monthly: "Mensal",
  yearly: "Anual",
};

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
  notes?: string;
}

interface UpdateExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense | null;
  onSubmit: (data: CreateExpenseInput & { updateFuture?: boolean }) => void;
  isLoading: boolean;
}

export function UpdateExpenseModal({
  open,
  onOpenChange,
  expense,
  onSubmit,
  isLoading,
}: UpdateExpenseModalProps) {
  const [showRecurringDialog, setShowRecurringDialog] = React.useState(false);
  const [pendingData, setPendingData] =
    React.useState<CreateExpenseInput | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateExpenseInput>({
    defaultValues: {
      description: "",
      category: "other",
      amount: 0,
      dueDate: "",
      isRecurring: false,
      recurrence: {
        type: "none",
        interval: 1,
      },
      documentRef: "",
      notes: "",
    },
  });

  const isRecurring = watch("isRecurring");
  const recurrenceType = watch("recurrence.type");

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }

    if (!expense) return;

    const dueDate =
      expense.dueDate && !Number.isNaN(new Date(expense.dueDate).getTime())
        ? new Date(expense.dueDate).toISOString().slice(0, 10)
        : "";

    const endDate =
      expense.recurrence?.endDate &&
      !Number.isNaN(new Date(expense.recurrence.endDate).getTime())
        ? new Date(expense.recurrence.endDate).toISOString().slice(0, 10)
        : "";

    const recurrence: CreateExpenseInput["recurrence"] = expense.recurrence
      ? {
          type: expense.recurrence.type as
            | "none"
            | "daily"
            | "weekly"
            | "monthly"
            | "yearly",
          interval: expense.recurrence.interval ?? 1,
          dueDay: expense.recurrence.dueDay,
          endDate,
        }
      : undefined;

    const payload: CreateExpenseInput = {
      description: expense.description ?? "",
      category: expense.category as CreateExpenseInput["category"],
      amount: expense.amount ?? 0,
      dueDate,
      isRecurring: expense.isRecurring ?? false,
      recurrence,
      documentRef: expense.documentRef ?? "",
      notes: expense.notes ?? "",
    };

    reset(payload);
  }, [open, expense, reset]);

  const handleFormSubmit = handleSubmit((data) => {
    const isRecurringExpense = expense?.isRecurring;

    if (isRecurringExpense) {
      setPendingData(data);
      setShowRecurringDialog(true);
    } else {
      onSubmit(data);
    }
  });

  const handleRecurringChoice = (updateFuture: boolean) => {
    if (pendingData) {
      onSubmit({ ...pendingData, updateFuture });
    }
    setShowRecurringDialog(false);
    setPendingData(null);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
    setShowRecurringDialog(false);
    setPendingData(null);
  };

  const preview = pendingData ?? {
    description: expense?.description ?? "",
    amount: expense?.amount,
    dueDate: expense?.dueDate ?? "",
    recurrence: expense?.recurrence,
  };

  const recurrenceLabel =
    preview.recurrence?.type && preview.recurrence?.type !== "none"
      ? `${RECURRENCE_TYPE_LABELS[preview.recurrence.type as keyof typeof RECURRENCE_TYPE_LABELS] ?? preview.recurrence.type}${
          preview.recurrence?.interval && preview.recurrence.interval > 1
            ? ` (a cada ${preview.recurrence.interval})`
            : ""
        }`
      : "Não recorrente";

  return (
    <>
      <Dialog open={open && !showRecurringDialog} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleFormSubmit}>
            <DialogHeader>
              <DialogTitle className="text-xl">Editar Despesa</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="description">
                      Descrição <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="description"
                      placeholder="Ex: Aluguel Galpão Principal"
                      {...field}
                    />
                    {errors.description && (
                      <p className="text-destructive text-sm">
                        {errors.description.message}
                      </p>
                    )}
                  </div>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label htmlFor="category">
                        Categoria <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(CATEGORY_LABELS).map(
                            ([key, label]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                      {errors.category && (
                        <p className="text-destructive text-sm">
                          {errors.category.message}
                        </p>
                      )}
                    </div>
                  )}
                />

                <Controller
                  name="amount"
                  control={control}
                  render={({ field }) => {
                    const { display, setDisplay } = useCommaDecimal(
                      field.value?.toString() || "",
                    );

                    return (
                      <div className="space-y-2">
                        <Label htmlFor="amount">
                          Valor <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                            R$
                          </span>
                          <Input
                            id="amount"
                            placeholder="0,00"
                            inputMode="decimal"
                            className="pl-9"
                            value={display}
                            onChange={(e) => {
                              const raw = sanitizeNumericInput(e.target.value);
                              setDisplay(raw);
                              const numValue = Number(raw.replace(",", "."));
                              field.onChange(numValue);
                            }}
                            onBlur={() => {
                              if (!display) return;
                              const n = Number(display.replace(",", "."));
                              if (!Number.isNaN(n)) {
                                const formatted = n
                                  .toFixed(2)
                                  .replace(".", ",");
                                setDisplay(formatted);
                                field.onChange(n);
                              }
                            }}
                          />
                        </div>
                        {errors.amount && (
                          <p className="text-destructive text-sm">
                            {errors.amount.message}
                          </p>
                        )}
                      </div>
                    );
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Controller
                  name="dueDate"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label htmlFor="dueDate">
                        Data de Vencimento{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input id="dueDate" type="date" {...field} />
                      {errors.dueDate && (
                        <p className="text-destructive text-sm">
                          {errors.dueDate.message}
                        </p>
                      )}
                    </div>
                  )}
                />

                <Controller
                  name="documentRef"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label htmlFor="documentRef">Nº Documento/Boleto</Label>
                      <Input
                        id="documentRef"
                        placeholder="Ex: 123456789"
                        {...field}
                      />
                    </div>
                  )}
                />
              </div>

              <Controller
                name="isRecurring"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isRecurring"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <Label
                      htmlFor="isRecurring"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Esta é uma despesa recorrente
                    </Label>
                  </div>
                )}
              />

              {isRecurring && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium text-sm">
                    Configurações de Recorrência
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <Controller
                      name="recurrence.type"
                      control={control}
                      render={({ field }) => (
                        <div className="space-y-2">
                          <Label htmlFor="recurrence.type">Frequência</Label>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(RECURRENCE_TYPE_LABELS).map(
                                ([key, label]) => (
                                  <SelectItem key={key} value={key}>
                                    {label}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    />

                    {recurrenceType !== "none" && (
                      <Controller
                        name="recurrence.interval"
                        control={control}
                        render={({ field }) => (
                          <div className="space-y-2">
                            <Label htmlFor="recurrence.interval">A cada</Label>
                            <Input
                              id="recurrence.interval"
                              type="number"
                              min={1}
                              placeholder="1"
                              value={field.value || ""}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                            />
                            <p className="text-xs text-muted-foreground">
                              Ex: 2 para "a cada 2 meses"
                            </p>
                          </div>
                        )}
                      />
                    )}
                  </div>

                  {recurrenceType === "monthly" && (
                    <Controller
                      name="recurrence.dueDay"
                      control={control}
                      render={({ field }) => (
                        <div className="space-y-2">
                          <Label htmlFor="recurrence.dueDay">
                            Dia do Vencimento
                          </Label>
                          <Input
                            id="recurrence.dueDay"
                            type="number"
                            min={1}
                            max={31}
                            placeholder="5"
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            Dia do mês em que a despesa vence (1-31)
                          </p>
                        </div>
                      )}
                    />
                  )}

                  <Controller
                    name="recurrence.endDate"
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-2">
                        <Label htmlFor="recurrence.endDate">
                          Data Final (opcional)
                        </Label>
                        <Input id="recurrence.endDate" type="date" {...field} />
                        <p className="text-xs text-muted-foreground">
                          Deixe em branco para recorrência indefinida
                        </p>
                      </div>
                    )}
                  />
                </div>
              )}

              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      rows={3}
                      placeholder="Informações adicionais sobre a despesa..."
                      {...field}
                    />
                  </div>
                )}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" className="w-40" disabled={isLoading}>
                {isLoading ? (
                  <RotateCw className="animate-spin h-4 w-4" />
                ) : (
                  "Atualizar Despesa"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showRecurringDialog} onOpenChange={setShowRecurringDialog}>
        <DialogContent className="sm:max-w-lg">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-warning/10">
              <AlertTriangle className="h-6 w-6 text-warning" />
            </div>
            <div className="flex-1">
              <DialogHeader className="p-0">
                <DialogTitle className="text-lg flex items-center gap-2">
                  <Repeat className="h-4 w-4 text-info" />
                  Atualizar lançamentos recorrentes
                </DialogTitle>
              </DialogHeader>

              <div className="mt-3 text-sm text-muted-foreground">
                Esta despesa foi gerada a partir de uma recorrência. Você pode
                atualizar apenas este lançamento ou aplicar as mesmas mudanças
                para todos os lançamentos futuros.
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-md border p-3 bg-muted/30">
                  <div className="text-xs text-muted-foreground">Descrição</div>
                  <div className="font-medium truncate mt-1">
                    {preview.description}
                  </div>
                </div>

                <div className="rounded-md border p-3 bg-muted/30">
                  <div className="text-xs text-muted-foreground">
                    Vencimento
                  </div>
                  <div className="font-medium mt-1">
                    {preview.dueDate
                      ? formatDate(new Date(preview.dueDate))
                      : "-"}
                  </div>
                </div>

                <div className="rounded-md border p-3 bg-muted/30">
                  <div className="text-xs text-muted-foreground">Valor</div>
                  <div className="font-medium mt-1">
                    {formatCurrency(preview.amount)}
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
                Observação: atualizar todos os lançamentos futuros pode alterar
                históricos financeiros. Recomendado quando a mudança é
                permanente.
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <div className="flex w-full gap-2">
              <Button
                variant="outline"
                className="flex-1 justify-center"
                onClick={() => {
                  setShowRecurringDialog(false);
                  setPendingData(null);
                }}
              >
                Voltar
              </Button>

              <Button
                variant="outline"
                className="flex-1 justify-center"
                onClick={() => handleRecurringChoice(false)}
              >
                Atualizar apenas este
              </Button>

              <Button
                variant="destructive"
                className="flex-1 justify-center"
                onClick={() => handleRecurringChoice(true)}
              >
                Atualizar esta e futuras
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
