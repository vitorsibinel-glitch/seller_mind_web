import React, { useState, useMemo } from "react";
import { Search, Package, Warehouse, RotateCw } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import type { Product } from "@workspace/mongodb/models/product";

interface AddStockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  isLoadingProducts: boolean;
  onSubmitAdd: (data: {
    sku: string;
    name: string;
    quantity: number;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export function AddStockModal({
  open,
  onOpenChange,
  products,
  isLoadingProducts,
  onSubmitAdd,
  isSubmitting,
}: AddStockModalProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!searchQuery) return products;

    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const resetState = () => {
    setSelectedProduct(null);
    setQuantity(undefined);
    setSearchQuery("");
    setConfirmOpen(false);
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct || !quantity || quantity <= 0) {
      toast.error("Selecione um produto e informe a quantidade");
      return;
    }

    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!selectedProduct || !quantity) return;

    await onSubmitAdd({
      sku: selectedProduct.sku,
      name: selectedProduct.name,
      quantity,
    });

    resetState();
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl">Adicionar ao Estoque</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col flex-1 min-h-0"
          >
            <div className="space-y-4 flex-1 overflow-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar produto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  disabled={isSubmitting}
                />
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-[300px] overflow-y-auto">
                  {isLoadingProducts ? (
                    <div className="flex items-center justify-center py-12">
                      <RotateCw className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                      {searchQuery
                        ? "Nenhum produto encontrado"
                        : "Nenhum produto cadastrado"}
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredProducts.map((product) => (
                        <div
                          key={product.sku}
                          className={`p-4 cursor-pointer transition-colors hover:bg-secondary ${
                            selectedProduct?.sku === product.sku
                              ? "bg-secondary"
                              : ""
                          }`}
                          onClick={() => setSelectedProduct(product)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="w-8 h-8 text-muted-foreground" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm truncate">
                                {product.name}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-1">
                                SKU: {product.sku}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Warehouse className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  Estoque Local:{" "}
                                  <span className="font-medium text-foreground">
                                    {product.stock?.localQuantity ?? 0}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {selectedProduct && (
                <div className="space-y-2 pt-2">
                  <label className="text-sm font-medium">
                    Quantidade a Adicionar *
                  </label>
                  <Input
                    placeholder="Ex: 100"
                    inputMode="numeric"
                    value={quantity ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || /^\d+$/.test(value)) {
                        setQuantity(value === "" ? undefined : Number(value));
                      }
                    }}
                    disabled={isSubmitting}
                  />
                </div>
              )}
            </div>

            <DialogFooter className="mt-6">
              <div className="flex justify-between w-full">
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !selectedProduct ||
                    !quantity ||
                    quantity <= 0
                  }
                >
                  Adicionar
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Adição ao Estoque</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">Produto</span>
              <p className="font-medium">{selectedProduct?.name}</p>
            </div>

            <div>
              <span className="text-muted-foreground">SKU</span>
              <p className="font-medium">{selectedProduct?.sku}</p>
            </div>

            <div>
              <span className="text-muted-foreground">Quantidade</span>
              <p className="font-medium">{quantity}</p>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={isSubmitting}
            >
              Voltar
            </Button>

            <Button onClick={handleConfirm} disabled={isSubmitting}>
              {isSubmitting ? (
                <RotateCw className="w-4 h-4 animate-spin" />
              ) : (
                "Confirmar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
