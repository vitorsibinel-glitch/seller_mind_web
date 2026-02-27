import React, { useState, useEffect } from "react";
import { Search, Package } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Badge } from "@workspace/ui/components/badge";
import type { ListingItemDTO } from "@/dtos/listing-item-dto";
import { usePatch } from "@/hooks/use-api";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  associatedItems: ListingItemDTO[];
  unassociatedListingsItems: ListingItemDTO[];
  productId: string;
  selectedStoreId: string;
  productName: string;
  productSku: string;
  productImageUrl?: string;
  refetchProducts: () => void;
  refetchUnassociatedListings: () => void;
}

export function AssociateListingsModal({
  isOpen,
  onOpenChange,
  associatedItems,
  unassociatedListingsItems,
  productId,
  selectedStoreId,
  productName,
  productSku,
  productImageUrl,
  refetchProducts,
  refetchUnassociatedListings,
}: Props) {
  const [searchUnassociated, setSearchUnassociated] = useState("");
  const [searchAssociated, setSearchAssociated] = useState("");
  const [unassociated, setUnassociated] = useState<ListingItemDTO[]>([]);
  const [associated, setAssociated] = useState<ListingItemDTO[]>([]);

  const { mutate: updateAssociations, isPending } = usePatch({
    onSuccess: () => {
      toast.success("Associações atualizadas com sucesso");
      onOpenChange(false);
      refetchProducts();
      refetchUnassociatedListings();
    },
    onError: () => {},
  });

  useEffect(() => {
    setUnassociated(unassociatedListingsItems);
  }, [unassociatedListingsItems]);

  useEffect(() => {
    setAssociated(associatedItems);
  }, [associatedItems]);

  const handleAssociate = (listing: ListingItemDTO) => {
    setUnassociated((prev) => prev.filter((item) => item.sku !== listing.sku));
    setAssociated((prev) => [...prev, listing]);
  };

  const handleDisassociate = (listing: ListingItemDTO) => {
    setAssociated((prev) => prev.filter((item) => item.sku !== listing.sku));
    setUnassociated((prev) => [...prev, listing]);
  };

  const handleConfirm = () => {
    const formattedAssociations = associated.map((listing) => ({
      channel: listing.channel ?? "amazon",
      name: listing.name,
      externalSku: listing.sku,
      externalProductId: listing.asin,
    }));

    updateAssociations({
      url: `/api/integrations/amazon/sp/associations/${productId}?storeId=${selectedStoreId}`,
      data: { associations: formattedAssociations },
    });
  };

  const filteredUnassociated = unassociated.filter(
    (item) =>
      item.name.toLowerCase().includes(searchUnassociated.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchUnassociated.toLowerCase()) ||
      item.asin.toLowerCase().includes(searchUnassociated.toLowerCase())
  );

  const filteredAssociated = associated.filter(
    (item) =>
      item.name.toLowerCase().includes(searchAssociated.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchAssociated.toLowerCase()) ||
      item.asin.toLowerCase().includes(searchAssociated.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] lg:max-w-[65vw] h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 flex-shrink-0">
          <DialogTitle>Associar anúncios</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 bg-muted/50 border-y flex-shrink-0">
          <div className="flex items-start gap-4">
            {productImageUrl ? (
              <img
                src={productImageUrl}
                alt={productName}
                className="w-16 h-16 rounded border object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded bg-muted flex items-center justify-center text-xs text-foreground/40 border">
                Sem imagem
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-medium text-sm mb-1">{productName}</h3>
              <p className="text-xs text-muted-foreground">
                SKU interno: {productSku}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 grid grid-cols-2 gap-6 px-6 py-4">
          <div className="flex flex-col min-h-0">
            <h3 className="text-base font-semibold mb-3 flex-shrink-0">
              Anúncios Não Associados ({filteredUnassociated.length})
            </h3>

            <div className="relative mb-4 flex-shrink-0">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={16}
              />
              <Input
                type="text"
                placeholder="Pesquisar..."
                value={searchUnassociated}
                onChange={(e) => setSearchUnassociated(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-2">
              {filteredUnassociated.map((listing) => (
                <Card
                  key={listing.sku}
                  className="hover:shadow-md transition-shadow flex-shrink-0"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Package size={14} className="text-muted-foreground" />
                      <Badge variant="outline" className="text-xs">
                        {listing.channel}
                      </Badge>
                    </div>

                    <div className="flex gap-3 mb-3">
                      {listing.imageUrl ? (
                        <img
                          src={listing.imageUrl}
                          alt={listing.name}
                          className="w-12 h-12 rounded border object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-xs text-foreground/40 border flex-shrink-0">
                          Sem imagem
                        </div>
                      )}
                      <p className="text-xs text-foreground line-clamp-2 flex-1">
                        {listing.name}
                      </p>
                    </div>

                    <div className="space-y-1 mb-3">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">SKU:</span> {listing.sku}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">ASIN:</span>{" "}
                        {listing.asin}
                      </p>
                    </div>

                    <Button
                      onClick={() => handleAssociate(listing)}
                      variant="outline"
                      className="w-full border-success text-success hover:bg-success/50 hover:text-success/90"
                      size="sm"
                    >
                      Associar
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {filteredUnassociated.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Package size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Nenhum anúncio encontrado</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col min-h-0">
            <h3 className="text-base font-semibold mb-3 flex-shrink-0">
              Anúncios Associados ({filteredAssociated.length})
            </h3>

            <div className="relative mb-4 flex-shrink-0">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={16}
              />
              <Input
                type="text"
                placeholder="Pesquisar..."
                value={searchAssociated}
                onChange={(e) => setSearchAssociated(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-2">
              {filteredAssociated.map((listing) => (
                <Card
                  key={listing.sku}
                  className="hover:shadow-md transition-shadow flex-shrink-0"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Package size={14} className="text-muted-foreground" />
                      <Badge variant="outline" className="text-xs">
                        {listing.channel}
                      </Badge>
                    </div>

                    <div className="flex gap-3 mb-3">
                      {listing.imageUrl ? (
                        <img
                          src={listing.imageUrl}
                          alt={listing.name}
                          className="w-12 h-12 rounded border object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-xs text-foreground/40 border flex-shrink-0">
                          Sem imagem
                        </div>
                      )}
                      <p className="text-xs text-foreground line-clamp-2 flex-1">
                        {listing.name}
                      </p>
                    </div>

                    <div className="space-y-1 mb-3">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">SKU:</span> {listing.sku}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">ASIN:</span>{" "}
                        {listing.asin}
                      </p>
                    </div>

                    <Button
                      onClick={() => handleDisassociate(listing)}
                      variant="outline"
                      className="w-full border-danger text-danger hover:bg-danger/50 hover:text-danger/90"
                      size="sm"
                    >
                      Desassociar
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {filteredAssociated.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Package size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Nenhum anúncio associado</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 flex-shrink-0">
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Fechar
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-primary hover:bg-primary/50"
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
