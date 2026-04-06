import type { StoresResponseDTO } from "@/dtos/store-dto";
import { useGet } from "./use-api";

export function useStores(enabled?: boolean) {
  const { data: storesData, isPending: isPendingStores } =
    useGet<StoresResponseDTO>("/api/stores", {
      staleTime: 1000 * 60 * 10, // 10 minutos
      enabled: enabled ?? false,
    });

  const stores = storesData?.stores ?? [];

  return {
    stores,
    isPendingStores,
  };
}
