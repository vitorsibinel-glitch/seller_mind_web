"use client";

import { Plus, Percent } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import React, { useEffect, useState } from "react";
import { MktsCards } from "@/components/mkt-cards";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { useSearchParams } from "next/navigation";
import { useGet, usePost } from "@/hooks/use-api";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { useTry } from "@/hooks/use-try";
import { toast } from "sonner";
import type { StoreDTO } from "@/dtos/store-dto";

const createStoreSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  taxRate: z.coerce.number().min(1, "Alíquota deve ser maior ou igual a 1"),
});

export type CreateStoreFormData = z.infer<typeof createStoreSchema>;

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

export default function IntegrationsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("first_time")) {
      setModalOpen(true);
    }
  }, []);

  const apiEnpoint = "/api/stores";
  const { data: storesData, refetch: refetchStores } = useGet<{
    stores: StoreDTO[];
  }>(apiEnpoint);
  const { mutateAsync: createStore } = usePost(apiEnpoint);

  const stores = storesData?.stores as StoreDTO[];

  const { control, handleSubmit, formState, reset } =
    useForm<CreateStoreFormData>({
      resolver: zodResolver(createStoreSchema),
    });

  const onSubmit = async (data: CreateStoreFormData) => {
    const [_, error] = await useTry(async () => await createStore(data));

    if (error) {
      console.log("error: ", error);
      return;
    }

    toast.success("Loja criada com sucesso!");
    refetchStores();
    setModalOpen(false);
    reset();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrações"
        description="Gerencie suas conexões com marketplaces"
        actionBtn={true}
        actionBtnTitle="Novo Canal"
        actionBtnIcon={Plus}
        actionFunc={() => setModalOpen(true)}
      />
      <MktsCards mkts={stores} refetchStores={refetchStores} />
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle className="text-xl">
                Adicionar uma nova loja
              </DialogTitle>
            </DialogHeader>

            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <div className="space-y-2 py-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    placeholder="Nome da sua nova loja"
                    type="text"
                    {...field}
                  />
                  {formState.errors.name && (
                    <p className="text-danger text-sm">
                      {formState.errors.name.message}
                    </p>
                  )}
                </div>
              )}
            />

            <Controller
              name="taxRate"
              control={control}
              render={({ field }) => {
                const { display, setDisplay } = useCommaDecimal(field.value);

                return (
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Alíquota (%)</Label>
                    <div className="relative">
                      <Input
                        id="taxRate"
                        placeholder="Ex: 4,00"
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
                        className="pr-10"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <Percent className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    {formState.errors.taxRate && (
                      <p className="text-danger text-sm">
                        {formState.errors.taxRate.message}
                      </p>
                    )}
                  </div>
                );
              }}
            />

            <DialogFooter>
              <div className="flex justify-between w-full mt-6">
                <Button variant="outline" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Adicionar</Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
