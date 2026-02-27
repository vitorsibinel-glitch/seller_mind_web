"use client";

import React, { useEffect, useState } from "react";
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
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RotateCw } from "lucide-react";
import { toast } from "sonner";

import { productSchemaUpdate } from "@/schemas/productSchema";
import { usePatch } from "@/hooks/use-api";
import type { ProductDTO } from "@/dtos/product-dto";

interface UpdateProductFormData {
  name?: string;
  cost?: number;
  extraCost?: number;
  sku?: string;
  ean?: string;
}

interface UpdateProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductDTO | null;
  onSuccess: () => void;
}

function sanitizeNumericInput(value: string) {
  return value.replace(/[^0-9.,]/g, "");
}

function useCommaDecimal(fieldValue: unknown) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    if (fieldValue === null || fieldValue === undefined || fieldValue === "") {
      setDisplay("");
    } else {
      setDisplay(String(fieldValue).replace(".", ","));
    }
  }, [fieldValue]);

  return { display, setDisplay };
}

export function UpdateProductModal({
  open,
  onOpenChange,
  product,
  onSuccess,
}: UpdateProductModalProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProductFormData>({
    resolver: zodResolver(productSchemaUpdate),
  });

  const { mutate: updateProduct, isPending } = usePatch({
    onSuccess: () => {
      toast.success("Produto atualizado com sucesso!");
      onOpenChange(false);
      onSuccess();
    },
    onError: () => {
      toast.error("Erro ao atualizar produto.");
    },
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        cost: product.cost,
        extraCost: product.extraCost,
        sku: product.sku,
        ean: product.ean,
      });
    }
  }, [product, reset]);

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const onSubmit = (data: UpdateProductFormData) => {
    if (!product?._id) return;

    updateProduct({
      url: `/api/products/${product._id}`,
      data,
    });
  };

  const isLoading = isSubmitting || isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(onSubmit)();
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-xl">Atualizar Produto</DialogTitle>
          </DialogHeader>

          <div className="mt-4 flex gap-6">
            <div className="space-y-4 w-full">
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label>Nome do Produto</Label>
                    <Input {...field} />
                    {errors.name && (
                      <p className="text-danger text-sm">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Controller
                  name="cost"
                  control={control}
                  render={({ field }) => {
                    const { display, setDisplay } = useCommaDecimal(
                      field.value
                    );

                    return (
                      <div className="space-y-2">
                        <Label>Custo do Produto</Label>
                        <Input
                          placeholder="Ex: 22,50"
                          inputMode="decimal"
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
                        {errors.cost && (
                          <p className="text-danger text-sm">
                            {errors.cost.message}
                          </p>
                        )}
                      </div>
                    );
                  }}
                />

                <Controller
                  name="extraCost"
                  control={control}
                  render={({ field }) => {
                    const { display, setDisplay } = useCommaDecimal(
                      field.value
                    );

                    return (
                      <div className="space-y-2">
                        <Label>Custo Extra</Label>
                        <Input
                          placeholder="Ex: 0,50"
                          inputMode="decimal"
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
                        {errors.extraCost && (
                          <p className="text-danger text-sm">
                            {errors.extraCost.message}
                          </p>
                        )}
                      </div>
                    );
                  }}
                />
              </div>

              <Controller
                name="sku"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label>SKU</Label>
                    <Input {...field} />
                    {errors.sku && (
                      <p className="text-danger text-sm">
                        {errors.sku.message}
                      </p>
                    )}
                  </div>
                )}
              />

              <Controller
                name="ean"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label>EAN</Label>
                    <Input {...field} />
                    {errors.ean && (
                      <p className="text-danger text-sm">
                        {errors.ean.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>
          </div>

          <DialogFooter>
            <div className="flex justify-between w-full mt-6">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  reset();
                }}
                disabled={isLoading}
              >
                Cancelar
              </Button>

              <Button type="submit" className="w-20 h-8" disabled={isLoading}>
                {isLoading ? (
                  <RotateCw className="animate-spin" />
                ) : (
                  "Atualizar"
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
