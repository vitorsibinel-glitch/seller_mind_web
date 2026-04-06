"use client";

import { Card, CardContent } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { Settings, CheckCircle, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { StoreDTO } from "@/dtos/store-dto";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { usePatch } from "@/hooks/use-api";
import { toast } from "sonner";

interface Props {
  mkts: StoreDTO[];
  refetchStores: () => void;
}

export function MktsCards({ mkts, refetchStores }: Props) {
  const [marketplaces, setMarketplaces] = useState<StoreDTO[]>([]);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreDTO | null>(null);
  const router = useRouter();

  const deactivateStoreUrl = `/api/stores/${selectedStore?._id}/deactivate`;

  const { mutateAsync: deactivateStore } = usePatch({
    onSuccess: () => {
      toast.success("Loja desativada com sucesso");
      setDeactivateDialogOpen(false);
      setSelectedStore(null);
      refetchStores();
    },
    onError: () => {},
  });

  useEffect(() => {
    setMarketplaces(mkts);
  }, [mkts]);

  const handleDeactivateClick = (mkt: StoreDTO) => {
    setSelectedStore(mkt);
    setDeactivateDialogOpen(true);
  };

  const handleConfirmDeactivate = async () => {
    if (selectedStore) {
      await deactivateStore({ url: deactivateStoreUrl });
    }
  };

  if (!marketplaces?.length) {
    return (
      <div className="text-center text-muted-foreground p-6 border rounded-md">
        Nenhuma loja adicionada ainda.
      </div>
    );
  }

  return (
    <>
      <div
        className="
          grid 
          gap-4 
          grid-cols-1 
          sm:grid-cols-2 
          lg:grid-cols-3 
          xl:grid-cols-4 
          2xl:grid-cols-5 
          w-full
        "
      >
        {marketplaces.map((mkt) => (
          <Card key={mkt._id} className="shadow-sm flex flex-col">
            <CardContent className="p-4 space-y-3 flex-1 relative m-1.5">
              <div className="flex items-center gap-3">
                {mkt.logoUrl ? (
                  <img
                    src={mkt.logoUrl}
                    alt={mkt.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-base font-semibold">
                    {mkt.name[0]?.toUpperCase()}
                  </div>
                )}

                <div className="flex flex-col justify-center space-y-0.5">
                  <p className="text-foreground text-base font-semibold">
                    {mkt.name}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="text-muted-foreground hover:text-foreground cursor-pointer ml-auto">
                      <Settings className="w-4 h-4" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive cursor-pointer"
                      onClick={() => handleDeactivateClick(mkt)}
                    >
                      Desativar loja
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="text-sm space-y-3 mt-3">
                {mkt.integrations?.length ? (
                  mkt.integrations.map((integration, index) => {
                    const statusLabel =
                      integration.status === "Conectado"
                        ? "Conectado"
                        : integration.status === "Conectando..."
                          ? "Conectando..."
                          : "Desconectado";

                    const statusColor =
                      integration.status === "Conectado"
                        ? "bg-success/20 text-success"
                        : integration.status === "Conectando..."
                          ? "bg-info/20 text-info"
                          : "bg-destructive/20 text-destructive";

                    return (
                      <div
                        key={index}
                        className="border rounded-md p-2 flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between">
                          <Badge className={statusColor}>
                            {integration.status === "Conectado" ? (
                              <CheckCircle className="w-4 h-4 mr-1" />
                            ) : (
                              <AlertCircle className="w-4 h-4 mr-1" />
                            )}
                            {statusLabel}
                          </Badge>
                          <span className="text-xs font-medium text-muted-foreground">
                            {integration.provider === "amazon_ads"
                              ? "Amazon Ads"
                              : "Amazon SP-API"}
                          </span>
                        </div>

                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            Última sync:
                          </span>
                          <span className="font-medium">
                            {integration.lastSync || "Nunca"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Nenhuma integração configurada.
                  </p>
                )}
              </div>

              <div className="pt-3">
                <Button
                  className="w-full text-sm"
                  onClick={() =>
                    router.push(`/dashboard/settings/integrations/${mkt._id}`)
                  }
                >
                  Ver loja
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        open={deactivateDialogOpen}
        onOpenChange={setDeactivateDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desativar loja</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja desativar essa loja?
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeactivateDialogOpen(false)}
            >
              Cancelar
            </Button>

            <Button variant="destructive" onClick={handleConfirmDeactivate}>
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
