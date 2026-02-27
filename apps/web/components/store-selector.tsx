"use client";

import { useStores } from "@/hooks/use-stores";
import { useGlobalFilter } from "@/contexts/global-filter-context";
import { Store } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { useEffect, useMemo } from "react";

export function StoreSelector() {
  const { stores, isPendingStores } = useStores();
  const { selectedStoreId, handleSelectedStoreId } = useGlobalFilter();

  const selectedStore = useMemo(
    () => stores.find((s) => s._id === selectedStoreId),
    [stores, selectedStoreId]
  );

  useEffect(() => {
    if (!isPendingStores && stores.length > 0 && !selectedStoreId) {
      handleSelectedStoreId(stores[0]!._id);
    }
  }, [stores, isPendingStores, selectedStoreId, handleSelectedStoreId]);

  if (isPendingStores) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Store className="h-4 w-4" />
        Carregando lojas...
      </div>
    );
  }

  if (!stores.length) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Store className="h-4 w-4" />
        Nenhuma loja disponível
      </div>
    );
  }

  return (
    <Select
      value={selectedStoreId || undefined}
      onValueChange={(value) => handleSelectedStoreId(value)}
    >
      <SelectTrigger className="w-[250px]">
        <div className="flex items-center">
          <Store className="mr-2 h-4 w-4" />
          <span>{selectedStore?.name || "Selecione uma loja"}</span>
        </div>
      </SelectTrigger>
      <SelectContent>
        {stores.map((store) => (
          <SelectItem key={store._id} value={store._id}>
            {store.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
