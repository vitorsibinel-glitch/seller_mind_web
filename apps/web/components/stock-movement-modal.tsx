import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Package,
  RotateCw,
  CheckCircle,
  Clock,
  ArrowRight,
  XCircle,
  Filter,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import type { Product } from "@workspace/mongodb/models/product";
import type { StockMovementDTO } from "@/dtos/stock-movement-dto";
import { formatDate } from "@/lib/format-date";

interface StockMovementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  products: Product[];
  isLoadingProducts: boolean;
  onSubmitMovement: (data: { sku: string; quantity: number }) => Promise<void>;
  isSubmitting: boolean;
  movements: StockMovementDTO[];
  refetchMovements: (startDate?: string, endDate?: string) => void;
  onCancelMovement: (
    movementId: string,
    movementType: string,
    reason?: string,
  ) => Promise<void>;
  isCancellingMovement: boolean;
  onConfirmReceipt: (movementId: string) => void;
  isConfirmingReceipt: boolean;
}

const movementTypeUI: Record<string, { label: string; badge: string }> = {
  LOCAL_TO_FBA_TRANSIT: {
    label: "Local → FBA",
    badge: "bg-warning/10 text-warning",
  },
  ADD_TO_LOCAL_STOCK: {
    label: "Entrada no Estoque Local",
    badge: "bg-success/10 text-success",
  },
  CANCEL_ADD_TO_LOCAL_STOCK: {
    label: "Entrada Cancelada",
    badge: "bg-danger/10 text-danger",
  },
  CANCEL_FBA_TRANSIT: {
    label: "Envio FBA Cancelado",
    badge: "bg-danger/10 text-danger",
  },
  CONFIRM_FBA_RECEIPT: {
    label: "Recebimento FBA Confirmado",
    badge: "bg-success/10 text-success",
  },
};

export function StockMovementModal({
  open,
  onOpenChange,
  storeId,
  products,
  isLoadingProducts,
  onSubmitMovement,
  isSubmitting,
  movements,
  refetchMovements,
  onCancelMovement,
  isCancellingMovement,
  onConfirmReceipt,
  isConfirmingReceipt,
}: StockMovementModalProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("send");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [movementToCancel, setMovementToCancel] =
    useState<StockMovementDTO | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [tempStartDate, setTempStartDate] = useState("");
  const [tempEndDate, setTempEndDate] = useState("");

  const handledMovementIds = useMemo(() => {
    return new Set(
      movements
        .filter(
          (m) =>
            (m.type === "CANCEL_FBA_TRANSIT" ||
              m.type === "CANCEL_ADD_TO_LOCAL_STOCK" ||
              m.type === "CONFIRM_FBA_RECEIPT") &&
            m.relatedMovementId,
        )
        .map((m) => String(m.relatedMovementId)),
    );
  }, [movements]);

  const handleApplyCustomDate = () => {
    if (tempStartDate && tempEndDate) {
      refetchMovements(tempStartDate, tempEndDate);
    } else {
      toast.error("Selecione as duas datas para filtrar");
    }
  };

  const handleCancelClick = (movement: StockMovementDTO) => {
    const id = String(movement._id);
    const isAlreadyHandled =
      movement.type.startsWith("CANCEL_") ||
      movement.type === "CONFIRM_FBA_RECEIPT" ||
      Boolean(movement.cancelled) ||
      Boolean(movement.confirmed) ||
      handledMovementIds.has(id);

    if (isAlreadyHandled) return;

    setMovementToCancel(movement);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!movementToCancel) return;
    await onCancelMovement(
      movementToCancel._id,
      movementToCancel.type,
      cancelReason || undefined,
    );
    setCancelDialogOpen(false);
    setMovementToCancel(null);
    setCancelReason("");
  };

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [products, searchQuery]);

  const handleClose = () => {
    setSelectedProduct(null);
    setQuantity(undefined);
    setSearchQuery("");
    setActiveTab("send");
    setTempStartDate("");
    setTempEndDate("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">Movimento de Estoque</DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="send">Enviar para FBA</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="send" className="flex-1 mt-4">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!selectedProduct || !quantity || quantity <= 0) {
                  toast.error("Selecione um produto e informe a quantidade");
                  return;
                }
                await onSubmitMovement({ sku: selectedProduct.sku, quantity });
                setSelectedProduct(null);
                setQuantity(undefined);
                setSearchQuery("");
              }}
              className="flex flex-col h-full"
            >
              <div className="space-y-4 flex-1 overflow-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produto..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="border rounded-lg max-h-[300px] overflow-auto divide-y">
                  {isLoadingProducts ? (
                    <div className="py-10 flex justify-center">
                      <RotateCw className="w-6 h-6 animate-spin" />
                    </div>
                  ) : (
                    filteredProducts.map((product) => (
                      <div
                        key={product.sku}
                        onClick={() => setSelectedProduct(product)}
                        className={`p-4 cursor-pointer hover:bg-secondary ${
                          selectedProduct?.sku === product.sku
                            ? "bg-secondary"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                className="w-full h-full object-cover"
                                alt=""
                              />
                            ) : (
                              <Package className="w-8 h-8 text-muted-foreground" />
                            )}
                          </div>

                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {product.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              SKU: {product.sku}
                            </p>
                            <div className="flex gap-4 mt-2 text-xs">
                              <span>
                                Local:{" "}
                                <strong>
                                  {product.stock?.localQuantity ?? 0}
                                </strong>
                              </span>
                              <span className="text-orange-600">
                                Trânsito:{" "}
                                <strong>
                                  {product.stock?.inTransitToFBA ?? 0}
                                </strong>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {selectedProduct && (
                  <div className="space-y-2">
                    <Input
                      placeholder="Quantidade"
                      inputMode="numeric"
                      value={quantity ?? ""}
                      onChange={(e) =>
                        /^\d*$/.test(e.target.value) &&
                        setQuantity(
                          e.target.value ? Number(e.target.value) : undefined,
                        )
                      }
                    />
                  </div>
                )}
              </div>

              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    !selectedProduct ||
                    !quantity ||
                    quantity > (selectedProduct.stock?.localQuantity ?? 0)
                  }
                >
                  Enviar para FBA
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="history" className="flex-1 mt-4 overflow-auto">
            <div className="space-y-4">
              <div className="bg-sidebar p-4 rounded-lg border border-gray-200 dark:border-gray-800 animate-in slide-in-from-top-2 duration-200">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Filter className="h-4 w-4" />
                    <span>Filtrar por Período Específico</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Data Início
                      </label>
                      <div className="relative">
                        <Input
                          type="date"
                          value={tempStartDate}
                          onChange={(e) => setTempStartDate(e.target.value)}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Data Fim
                      </label>
                      <div className="relative">
                        <Input
                          type="date"
                          value={tempEndDate}
                          onChange={(e) => setTempEndDate(e.target.value)}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleApplyCustomDate}
                      disabled={!tempStartDate || !tempEndDate}
                      className="w-full sm:w-auto"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Aplicar Filtro
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {movements.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Clock className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Nenhum movimento encontrado
                    </p>
                  </div>
                ) : (
                  movements.map((movement) => {
                    const ui = movementTypeUI[movement.type];
                    const id = String(movement._id);
                    const isAlreadyHandled =
                      movement.type.startsWith("CANCEL_") ||
                      movement.type === "CONFIRM_FBA_RECEIPT" ||
                      Boolean(movement.cancelled) ||
                      Boolean(movement.confirmed) ||
                      handledMovementIds.has(id);

                    return (
                      <div
                        key={id}
                        className="border rounded-lg overflow-hidden hover:border-gray-300 transition-colors"
                      >
                        <div className="px-4 py-3 border-b">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-2 h-2 rounded-full ${movement.type.includes("CANCEL") ? "bg-danger" : movement.type.includes("ADD") ? "bg-green-500" : "bg-orange-500"}`}
                              />
                              <span
                                className={`text-xs font-semibold px-2 py-1 rounded-full ${ui?.badge}`}
                              >
                                {ui?.label}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(movement.createdAt)}
                            </span>
                          </div>
                        </div>

                        <div className="p-4">
                          <div className="mb-4">
                            <h4 className="font-medium text-sm mb-1">
                              {movement.product?.name || movement.productSku}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Package className="w-3 h-3" />
                              <span>SKU: {movement.productSku}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 mb-4 p-3 rounded-lg">
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground mb-1">
                                Quantidade movimentada
                              </p>
                              <p className="text-lg font-semibold">
                                {movement.quantity} unidades
                              </p>
                            </div>
                            <div className="w-px h-8 bg-gray-200" />
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground mb-1">
                                Tipo de movimento
                              </p>
                              <p className="font-medium">{ui?.label}</p>
                            </div>
                          </div>

                          <div className="border rounded-lg p-4">
                            <p className="text-xs font-medium text-muted-foreground mb-3">
                              Alteração no estoque
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="mb-2">
                                  <p className="text-xs text-muted-foreground">
                                    Estoque Local
                                  </p>
                                  <p
                                    className={`font-semibold ${movement.after.localQuantity < movement.before.localQuantity ? "text-orange-600" : "text-green-600"}`}
                                  >
                                    {movement.before.localQuantity}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    Trânsito FBA
                                  </p>
                                  <p className="font-semibold text-orange-600">
                                    {movement.before.inTransitToFBA}
                                  </p>
                                </div>
                              </div>

                              <div className="px-4">
                                <div className="relative">
                                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" />
                                </div>
                              </div>

                              <div className="flex-1">
                                <div className="mb-2">
                                  <p className="text-xs text-foreground">
                                    Estoque Local
                                  </p>
                                  <p
                                    className={`font-semibold ${movement.after.localQuantity < movement.before.localQuantity ? "text-orange-600" : "text-green-600"}`}
                                  >
                                    {movement.after.localQuantity}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-foreground">
                                    Trânsito FBA
                                  </p>
                                  <p className="font-semibold text-orange-600">
                                    {movement.after.inTransitToFBA}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 pt-4 border-t">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-foreground">
                                  Variação total
                                </span>
                                <span
                                  className={`font-medium ${movement.after.localQuantity + movement.after.inTransitToFBA > movement.before.localQuantity + movement.before.inTransitToFBA ? "text-green-600" : "text-red-600"}`}
                                >
                                  {movement.after.localQuantity +
                                    movement.after.inTransitToFBA -
                                    (movement.before.localQuantity +
                                      movement.before.inTransitToFBA) >
                                  0
                                    ? "+"
                                    : ""}
                                  {movement.after.localQuantity +
                                    movement.after.inTransitToFBA -
                                    (movement.before.localQuantity +
                                      movement.before.inTransitToFBA)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {(movement.type === "LOCAL_TO_FBA_TRANSIT" ||
                            movement.type === "ADD_TO_LOCAL_STOCK") && (
                            <div className="flex gap-2 mt-4 pt-4 border-t">
                              {movement.type === "LOCAL_TO_FBA_TRANSIT" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className={`flex-1 ${isAlreadyHandled ? "opacity-50 pointer-events-none" : ""}`}
                                    onClick={() =>
                                      !isAlreadyHandled &&
                                      onConfirmReceipt(movement._id)
                                    }
                                    disabled={
                                      isAlreadyHandled || isConfirmingReceipt
                                    }
                                  >
                                    <CheckCircle className="w-3 h-3 mr-2" />
                                    {isConfirmingReceipt
                                      ? "Confirmando..."
                                      : isAlreadyHandled
                                        ? "Finalizado"
                                        : "Confirmar Recebimento"}
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="flex-1"
                                    onClick={() => handleCancelClick(movement)}
                                    disabled={
                                      isCancellingMovement || isAlreadyHandled
                                    }
                                  >
                                    <XCircle className="w-3 h-3 mr-2" />
                                    {isAlreadyHandled
                                      ? "Já cancelado"
                                      : isCancellingMovement
                                        ? "Cancelando..."
                                        : "Cancelar Envio"}
                                  </Button>
                                </>
                              )}
                              {movement.type === "ADD_TO_LOCAL_STOCK" && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="w-full"
                                  onClick={() => handleCancelClick(movement)}
                                  disabled={
                                    isCancellingMovement || isAlreadyHandled
                                  }
                                >
                                  <XCircle className="w-3 h-3 mr-2" />
                                  {isAlreadyHandled
                                    ? "Já cancelado"
                                    : isCancellingMovement
                                      ? "Cancelando..."
                                      : "Cancelar Entrada"}
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Cancelamento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja cancelar este movimento de estoque?
            </p>

            {movementToCancel && (
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Produto:</span>
                  <span className="font-medium">
                    {movementToCancel.productSku}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Quantidade:</span>
                  <span className="font-medium">
                    {movementToCancel.quantity}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="font-medium">
                    {movementTypeUI[movementToCancel.type]?.label}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Motivo do cancelamento (opcional)
              </label>
              <Input
                placeholder="Ex: Erro na contagem, produto danificado..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                {cancelReason.length}/200 caracteres
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancelDialogOpen(false);
                setMovementToCancel(null);
                setCancelReason("");
              }}
              disabled={isCancellingMovement}
            >
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={isCancellingMovement}
            >
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
