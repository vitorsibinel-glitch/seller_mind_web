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
import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { RotateCw } from "lucide-react";
import type { CreateProductFormData } from "@/dtos/product-dto";
import { useCommaDecimal } from "@/hooks/use-comma-decimal";
import { sanitizeNumericInput } from "@/utils/sanitize-numeric-input";

interface CreateProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  control: Control<CreateProductFormData>;
  errors: FieldErrors<CreateProductFormData>;
  isLoading: boolean;
}

export function CreateProductModal({
  open,
  onOpenChange,
  onSubmit,
  control,
  errors,
  isLoading,
}: CreateProductModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-xl">Criar Produto</DialogTitle>
          </DialogHeader>

          <div className="mt-4 flex gap-6">
            <div className="space-y-4 w-full">
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label>Nome do Produto *</Label>
                    <Input
                      placeholder="Ex: Capinha celular transparente"
                      {...field}
                    />
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
                      field.value,
                    );

                    return (
                      <div className="space-y-2">
                        <Label>Custo do Produto *</Label>
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
                      field.value,
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
                    <Label>SKU *</Label>
                    <Input placeholder="Ex: XX-XXXX-XXXX" {...field} />
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
                    <Input placeholder="Ex: 1234567891234" {...field} />
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
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>

              <Button type="submit" className="w-16 h-8" disabled={isLoading}>
                {isLoading ? <RotateCw className="animate-spin" /> : "Criar"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
