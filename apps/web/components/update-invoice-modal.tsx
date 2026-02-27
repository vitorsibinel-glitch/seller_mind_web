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
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RotateCw } from "lucide-react";
import { useCommaDecimal } from "@/hooks/use-comma-decimal";
import { sanitizeNumericInput } from "@/utils/sanitize-numeric-input";
import {
  createInvoiceFormSchema,
  type CreateInvoiceFormData,
} from "@/schemas/invoiceSchema";
import type { InvoiceDTO } from "@/dtos/invoice-dto";
import { formatCnpjCpf, sanitizeCnpjCpf } from "@/utils/sanitize-cnpj-cpf";

interface UpdateInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: InvoiceDTO | null;
  onSubmit: (data: CreateInvoiceFormData) => void;
  isSubmitting?: boolean;
}

export function UpdateInvoiceModal({
  open,
  onOpenChange,
  invoice,
  onSubmit,
  isSubmitting = false,
}: UpdateInvoiceModalProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateInvoiceFormData>({
    resolver: zodResolver(createInvoiceFormSchema),
  });

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }

    if (!invoice) return;

    const emittedAt =
      invoice.emittedAt && !Number.isNaN(new Date(invoice.emittedAt).getTime())
        ? new Date(invoice.emittedAt).toISOString().slice(0, 10)
        : "";

    reset({
      type: invoice.type || "entry",
      number: invoice.number || "",
      emittedAt,
      totalAmount:
        invoice.totalAmount !== undefined && invoice.totalAmount !== null
          ? String(invoice.totalAmount)
          : "",
      cnpjCpf: invoice.cnpjCpf || "",
      partnerName: invoice.partnerName || "",
      note: invoice.note || "",
    });
  }, [open, invoice, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(onSubmit)();
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-xl">Atualizar Nota Fiscal</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo de Nota</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entry">Entrada</SelectItem>
                        <SelectItem value="exit">Saída</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.type && (
                      <p className="text-danger text-sm">
                        {errors.type.message}
                      </p>
                    )}
                  </div>
                )}
              />

              <Controller
                name="number"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="number">Número da Nota</Label>
                    <Input
                      className="border border-tertiary/20"
                      placeholder="000000000"
                      {...field}
                    />
                    {errors.number && (
                      <p className="text-danger text-sm">
                        {errors.number.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="emittedAt"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="emittedAt">Data de Emissão</Label>
                    <Input
                      className="border border-tertiary/20"
                      type="date"
                      {...field}
                    />
                    {errors.emittedAt && (
                      <p className="text-danger text-sm">
                        {errors.emittedAt.message}
                      </p>
                    )}
                  </div>
                )}
              />

              <Controller
                name="totalAmount"
                control={control}
                render={({ field }) => {
                  const { display, setDisplay } = useCommaDecimal(field.value);
                  return (
                    <div className="space-y-2">
                      <Label htmlFor="totalAmount">Valor Total</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          R$
                        </span>
                        <Input
                          placeholder="0,00"
                          inputMode="decimal"
                          className="pl-9 border border-tertiary/20"
                          value={display}
                          onChange={(e) => {
                            const raw = sanitizeNumericInput(e.target.value);
                            setDisplay(raw);
                            field.onChange(raw.replace(",", "."));
                          }}
                          onBlur={() => {
                            if (!display) return;
                            const n = Number(display.replace(",", "."));
                            if (!Number.isNaN(n)) {
                              const formatted = n.toFixed(2).replace(".", ",");
                              setDisplay(formatted);
                              field.onChange(String(n));
                            }
                          }}
                        />
                      </div>
                      {errors.totalAmount && (
                        <p className="text-danger text-sm">
                          {errors.totalAmount.message}
                        </p>
                      )}
                    </div>
                  );
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="cnpjCpf"
                control={control}
                render={({ field }) => {
                  const [displayValue, setDisplayValue] = React.useState(
                    field.value || "",
                  );
                  useEffect(() => {
                    setDisplayValue(formatCnpjCpf(field.value || ""));
                  }, [field.value]);
                  return (
                    <div className="space-y-2">
                      <Label htmlFor="cnpjCpf">CNPJ/CPF</Label>
                      <Input
                        className="border border-tertiary/20"
                        placeholder="00.000.000/0000-00"
                        value={displayValue}
                        onChange={(e) => {
                          const formatted = formatCnpjCpf(e.target.value);
                          setDisplayValue(formatted);
                          field.onChange(sanitizeCnpjCpf(e.target.value));
                        }}
                        onBlur={field.onBlur}
                        maxLength={18}
                      />
                      {errors.cnpjCpf && (
                        <p className="text-danger text-sm">
                          {errors.cnpjCpf.message}
                        </p>
                      )}
                    </div>
                  );
                }}
              />

              <Controller
                name="partnerName"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="partnerName">Empresa/Cliente</Label>
                    <Input
                      className="border border-tertiary/20"
                      placeholder="Nome da empresa ou cliente"
                      {...field}
                    />
                  </div>
                )}
              />
            </div>

            <Controller
              name="note"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <Label htmlFor="note">Observação</Label>
                  <Textarea
                    className="border border-tertiary/20"
                    rows={3}
                    placeholder="Observações sobre a nota fiscal"
                    {...field}
                  />
                </div>
              )}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="w-28" disabled={isSubmitting}>
              {isSubmitting ? (
                <RotateCw className="animate-spin h-4 w-4" />
              ) : (
                "Atualizar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
