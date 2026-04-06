"use client";

import React, { useState } from "react";
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
import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { RotateCw, Upload, FileCheck, X } from "lucide-react";
import { useCommaDecimal } from "@/hooks/use-comma-decimal";
import { sanitizeNumericInput } from "@/utils/sanitize-numeric-input";
import type { CreateInvoiceFormData } from "@/schemas/invoiceSchema";
import { parseNFeXML } from "@/utils/parse-nfe-xml";
import { toast } from "sonner";

interface CreateInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (xmlRaw?: string) => void;
  control: Control<CreateInvoiceFormData>;
  errors: FieldErrors<CreateInvoiceFormData>;
  isLoading: boolean;
}

export function CreateInvoiceModal({
  open,
  onOpenChange,
  onSubmit,
  control,
  errors,
  isLoading,
}: CreateInvoiceModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [xmlRawData, setXmlRawData] = useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setUploadedFileName(null);
      setXmlRawData(null);
      setIsDragging(false);
      control._reset({
        type: "entry",
        number: "",
        emittedAt: "",
        totalAmount: "",
        cnpjCpf: "",
        partnerName: "",
        note: "",
      });
    }
  }, [open, control]);

  function sanitizeCnpjCpf(value: string): string {
    return value.replace(/\D/g, "");
  }

  function formatCnpjCpf(value: string): string {
    const numbers = value.replace(/\D/g, "");

    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }

    return numbers
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  }

  const handleFileProcess = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".xml")) {
      toast.error("Apenas arquivos XML são aceitos");
      return;
    }

    setIsProcessing(true);
    try {
      const parsedData = await parseNFeXML(file);

      setXmlRawData(parsedData.xmlRaw);

      control._reset({
        type: parsedData.type,
        number: parsedData.number,
        emittedAt: parsedData.emittedAt,
        totalAmount: parsedData.totalAmount,
        cnpjCpf: parsedData.cnpjCpf,
        partnerName: parsedData.partnerName,
        note: "",
      });

      setUploadedFileName(file.name);
      toast.success("Dados extraídos do XML com sucesso!");
    } catch (error) {
      toast.error("Erro ao processar XML. Verifique o arquivo.");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      await handleFileProcess(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileProcess(file);
    }
    e.target.value = "";
  };

  const handleRemoveFile = () => {
    setUploadedFileName(null);
    setXmlRawData(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(xmlRawData || undefined);
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-xl">Inserir Nota Fiscal</DialogTitle>
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

                  React.useEffect(() => {
                    if (field.value) {
                      setDisplayValue(formatCnpjCpf(field.value));
                    }
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

            <div className="space-y-2">
              <Label>Upload XML</Label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                } ${isProcessing ? "opacity-50 pointer-events-none" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="fileUpload"
                  className="hidden"
                  accept=".xml"
                  onChange={handleFileChange}
                  disabled={isProcessing}
                />
                {uploadedFileName ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileCheck className="h-5 w-5 text-success" />
                    <span className="text-sm font-medium">
                      {uploadedFileName}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={handleRemoveFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label htmlFor="fileUpload" className="cursor-pointer">
                    {isProcessing ? (
                      <>
                        <RotateCw className="mx-auto h-10 w-10 mb-2 text-primary animate-spin" />
                        <p className="text-sm font-medium text-muted-foreground">
                          Processando XML...
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload className="mx-auto h-10 w-10 mb-2 text-foreground" />
                        <p className="text-sm font-medium text-muted-foreground">
                          Clique para fazer upload
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          ou arraste e solte o arquivo XML aqui
                        </p>
                        <p className="text-xs text-primary mt-2">
                          Os dados do XML serão extraídos automaticamente
                        </p>
                      </>
                    )}
                  </label>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="w-28" disabled={isLoading}>
              {isLoading ? (
                <RotateCw className="animate-spin h-4 w-4" />
              ) : (
                "Salvar Nota"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
