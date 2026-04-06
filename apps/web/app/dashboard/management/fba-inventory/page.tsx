"use client";

import React, { useEffect, useState } from "react";
import {
  DollarSign,
  Warehouse,
  Building,
  TrendingUp,
  Plus,
  ArrowRightLeft,
  Calendar,
} from "lucide-react";
import { Tabs, TabsContent } from "@workspace/ui/components/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { ProductsTable } from "@/components/products-table";
import { PageHeader } from "@/components/page-header";
import { useGet, usePost, usePatch } from "@/hooks/use-api";
import type { FBAInventoryResponseDTO } from "@/dtos/fba-inventory-item-dto";
import { formatCurrency } from "@/utils/format-currency";
import { useGlobalFilter } from "@/contexts/global-filter-context";
import { StoreSelector } from "@/components/store-selector";
import type { Product } from "@workspace/mongodb/models/product";
import { toast } from "sonner";
import { StockMovementModal } from "@/components/stock-movement-modal";
import { AddStockModal } from "@/components/add-stock-product-modal";
import type { StockMovementDataDTO } from "@/dtos/stock-movement-dto";
import axios from "axios";
import { KpiCard, type KpiItem } from "@/components/kpi-card";

export default function FbaPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"add" | "movement" | "alert">(
    "add",
  );
  const [createProductModalOpen, setCreateProductModalOpen] = useState(false);
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCancellingMovement, setIsCancellingMovement] = useState(false);
  const [movementFilterStartDate, setMovementFilterStartDate] = useState<
    string | undefined
  >(undefined);
  const [movementFilterEndDate, setMovementFilterEndDate] = useState<
    string | undefined
  >(undefined);

  const { selectedStoreId } = useGlobalFilter();

  const {
    data: fbaInventoryData,
    isLoading,
    refetch: refetchFBAInventory,
  } = useGet<FBAInventoryResponseDTO>(
    `/api/integrations/amazon/sp/fba-inventory?storeId=${selectedStoreId}`,
    {
      enabled: !!selectedStoreId,
      retry: false,
      refetchOnWindowFocus: true,
      refetchOnMount: "always",
    },
  );

  const { data: stockMovementsData, refetch: refetchMovements } =
    useGet<StockMovementDataDTO>(
      `/api/stock/movements?storeId=${selectedStoreId}${movementFilterStartDate ? `&startDate=${movementFilterStartDate}` : ""}${movementFilterEndDate ? `&endDate=${movementFilterEndDate}` : ""}`,
      { enabled: !!selectedStoreId && movementModalOpen },
    );

  const handleRefetchMovements = (startDate?: string, endDate?: string) => {
    setMovementFilterStartDate(startDate);
    setMovementFilterEndDate(endDate);
  };

  const {
    data: stockProductsData,
    isLoading: isLoadingProducts,
    refetch: refetchProducts,
  } = useGet<{ products: Product[] }>(
    `/api/products?storeId=${selectedStoreId}`,
    {
      enabled:
        (!!selectedStoreId && createProductModalOpen) || movementModalOpen,
    },
  );

  const stockProducts = stockProductsData?.products || [];
  const stockMovements = stockMovementsData?.movements || [];

  const { mutate: addToStock, isPending: isSubmitting } = usePost(
    `/api/stock/add?storeId=${selectedStoreId}`,
    {
      onSuccess: () => {
        setSelectedProduct(null);
        setQuantity(undefined);
        setSearchQuery("");
        setCreateProductModalOpen(false);
        toast.success("Estoque atualizado com sucesso");
        refetchFBAInventory();
        refetchProducts();
      },
    },
  );

  const { mutate: moveToFbaTransit, isPending: isMovingToFBA } = usePost(
    `/api/stock/move-to-fba?storeId=${selectedStoreId}`,
    {
      onSuccess: () => {
        setSelectedProduct(null);
        setQuantity(undefined);
        setSearchQuery("");
        setMovementModalOpen(false);
        toast.success("Estoque movido para trânsito FBA com sucesso");
        refetchFBAInventory();
        refetchProducts();
      },
    },
  );

  const handleCancelMovement = async (
    movementId: string,
    movementType?: string,
    reason?: string,
  ) => {
    setIsCancellingMovement(true);
    try {
      let endpoint = `/api/stock/move-to-fba/${movementId}/cancel?storeId=${selectedStoreId}`;
      if (movementType === "ADD_TO_LOCAL_STOCK") {
        endpoint = `/api/stock/add/${movementId}/cancel?storeId=${selectedStoreId}`;
      }
      await axios.post(endpoint, { reason });
      toast.success("Movimento cancelado com sucesso");
      refetchFBAInventory();
      refetchProducts();
      refetchMovements();
    } catch (error: any) {
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Erro ao cancelar movimento";
      toast.error(message);
      throw error;
    } finally {
      setIsCancellingMovement(false);
    }
  };

  const { mutate: confirmReceiptMutate, isPending: isConfirming } =
    usePatch<void>({
      onSuccess: () => {
        toast.success("Recebimento confirmado com sucesso");
        refetchFBAInventory();
        refetchProducts();
        refetchMovements();
      },
      onError: () => {
        toast.error("Erro ao confirmar recebimento");
      },
    });

  const handleConfirmReceipt = (movementId: string) => {
    confirmReceiptMutate({
      url: `/api/stock/move-to-fba/${movementId}/confirm?storeId=${selectedStoreId}`,
    });
  };

  const handleAction = (type: "add" | "movement" | "alert") => {
    setActionType(type);
    setDialogOpen(true);
  };

  const getDialogTitle = () => {
    switch (actionType) {
      case "add":
        return "Adicionar ao Estoque";
      case "movement":
        return "Movimento de Estoque";
      case "alert":
        return "Configurar Alertas";
      default:
        return "";
    }
  };

  const getDialogContent = () => {
    switch (actionType) {
      case "add":
        return "Funcionalidade de adicionar estoque em desenvolvimento...";
      case "movement":
        return "Funcionalidade de movimento de estoque em desenvolvimento...";
      case "alert":
        return "Funcionalidade de configuração de alertas em desenvolvimento...";
      default:
        return "";
    }
  };

  const products = fbaInventoryData?.items ?? [];
  const inventoryDetails = fbaInventoryData?.inventoryDetails;

  useEffect(() => {
    if (!movementModalOpen || !selectedStoreId) return;
    refetchMovements();
  }, [
    movementFilterStartDate,
    movementFilterEndDate,
    movementModalOpen,
    selectedStoreId,
  ]);

  const kpis: KpiItem[] = [
    {
      title: "Estoque Local",
      value: inventoryDetails?.physicalStock?.toLocaleString("pt-BR") ?? "0",
      icon: Warehouse,
    },
    {
      title: "Tempo de Estoque",
      value:
        inventoryDetails?.globalDaysOfInventory !== null
          ? `${inventoryDetails?.globalDaysOfInventory} dias`
          : "Sem dados",
      icon: Calendar,
    },
    {
      title: "Estoque FBA",
      value: inventoryDetails?.totalFillable?.toLocaleString("pt-BR") ?? "0",
      icon: Warehouse,
    },
    {
      title: "Em Trânsito FBA",
      value: inventoryDetails?.inTransitToFBA?.toLocaleString("pt-BR") ?? "0",
      icon: ArrowRightLeft,
    },
    {
      title: "Custo Total em Estoque",
      value: inventoryDetails?.totalStockCost
        ? formatCurrency(inventoryDetails.totalStockCost)
        : "R$ 0,00",
      icon: DollarSign,
    },
    {
      title: "Valor Previsto de Venda",
      value: inventoryDetails?.expectedSalesValue
        ? formatCurrency(inventoryDetails.expectedSalesValue)
        : "R$ 0,00",
      icon: Building,
    },
    {
      title: "Líq. Marketplace Total",
      value: inventoryDetails?.netMarketplaceTotal
        ? formatCurrency(inventoryDetails.netMarketplaceTotal)
        : "R$ 0,00",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estoque FBA"
        description="Catálogo e controle de estoque unificados"
      />

      <div className="flex flex-wrap gap-4">
        {kpis.map((kpi, idx) => (
          <KpiCard key={idx} kpi={kpi} />
        ))}
      </div>

      <Tabs defaultValue="control" className="space-y-6">
        <StoreSelector />

        <TabsContent value="control" className="space-y-6">
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => setCreateProductModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar ao Estoque
            </Button>

            <Button
              variant="outline"
              onClick={() => setMovementModalOpen(true)}
            >
              Movimento de Estoque
            </Button>

            <Button variant="outline" onClick={() => handleAction("alert")}>
              Configurar Alertas
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">
                  Carregando inventário...
                </p>
              </div>
            </div>
          ) : (
            <ProductsTable products={products} />
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="font-inter text-center">{getDialogContent()}</p>
          </div>
        </DialogContent>
      </Dialog>

      <AddStockModal
        open={createProductModalOpen}
        onOpenChange={setCreateProductModalOpen}
        products={stockProducts}
        isLoadingProducts={isLoadingProducts}
        onSubmitAdd={async (data) => {
          await addToStock(data);
        }}
        isSubmitting={isSubmitting}
      />

      <StockMovementModal
        open={movementModalOpen}
        onOpenChange={setMovementModalOpen}
        storeId={selectedStoreId || ""}
        products={stockProducts}
        isLoadingProducts={isLoadingProducts}
        onSubmitMovement={async (data) => {
          await moveToFbaTransit(data);
        }}
        isSubmitting={isMovingToFBA}
        movements={stockMovements}
        refetchMovements={handleRefetchMovements}
        onCancelMovement={handleCancelMovement}
        isCancellingMovement={isCancellingMovement}
        onConfirmReceipt={handleConfirmReceipt}
        isConfirmingReceipt={isConfirming}
      />
    </div>
  );
}
