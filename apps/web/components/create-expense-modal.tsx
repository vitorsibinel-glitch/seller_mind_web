"use client";

import React from "react";
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
import { RotateCw } from "lucide-react";
import { useCommaDecimal } from "@/hooks/use-comma-decimal";
import { sanitizeNumericInput } from "@/utils/sanitize-numeric-input";
import { createExpenseSchema } from "@/schemas/expenseSchema";
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

interface CreateExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateExpenseInput) => void;
  isLoading: boolean;
  initialData?: Partial<CreateExpenseInput>;
}

export function CreateExpenseModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  initialData,
}: CreateExpenseModalProps) {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors },
  } = useForm<CreateExpenseInput>({
    defaultValues: {
      description: initialData?.description || "",
      category: initialData?.category || "other",
      amount: initialData?.amount || 0,
      dueDate: initialData?.dueDate || "",
      isRecurring: initialData?.isRecurring || false,
      recurrence: initialData?.recurrence || {
        type: "none",
        interval: 1,
      },
      documentRef: initialData?.documentRef || "",
      notes: initialData?.notes || "",
    },
  });

  const isRecurring = watch("isRecurring");
  const recurrenceType = watch("recurrence.type");

  const handleFormSubmit = handleSubmit((data) => {
    const result = createExpenseSchema.safeParse(data);

    if (!result.success) {
      result.error.errors.forEach((error) => {
        const path = error.path.join(".") as any;
        setError(path, {
          type: "manual",
          message: error.message,
        });
      });
      return;
    }

    const payload = {
      ...result.data,
      recurrence: result.data.isRecurring ? result.data.recurrence : undefined,
    };

    onSubmit(payload);
    reset();
  });

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleFormSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl">
              {initialData ? "Editar Despesa" : "Nova Despesa"}
            </DialogTitle>
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
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
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
                              const formatted = n.toFixed(2).replace(".", ",");
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
              ) : initialData ? (
                "Atualizar Despesa"
              ) : (
                "Criar Despesa"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
