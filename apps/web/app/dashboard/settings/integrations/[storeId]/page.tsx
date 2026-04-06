"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Pen,
  Plug,
  Check,
  X,
  Percent,
} from "lucide-react";
import type { StoreDTO } from "@/dtos/store-dto";
import { useGet, usePatch } from "@/hooks/use-api";
import { useTry } from "@/hooks/use-try";
import { authorizedRequest } from "@/utils/authorized-request";
import { toast } from "sonner";
import { useEffect, useState } from "react";

function sanitizeNumericInput(value: string) {
  return value.replace(/[^0-9.,]/g, "");
}

export default function StorePage() {
  const params = useParams();
  const storeId = params["storeId"] as string;

  const searchParams = useSearchParams();
  const connected = searchParams.get("connected");

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");

  const [isEditingTaxRate, setIsEditingTaxRate] = useState(false);
  const [editedTaxRate, setEditedTaxRate] = useState("");

  const storeUrl = `/api/stores/${storeId}`;

  const {
    data: storeData,
    isLoading,
    refetch: refetchStore,
  } = useGet<{
    store: StoreDTO;
  }>(`/api/stores/${storeId}`);

  const { mutateAsync: updateStore } = usePatch({
    onSuccess: () => {
      toast.success("Loja atualizada com sucesso");
      setIsEditingName(false);
      setIsEditingTaxRate(false);
      refetchStore();
    },
    onError: () => {},
  });

  const store = storeData?.store as StoreDTO;

  const handleIntegrateAmazonAds = async () => {
    const [response, error] = await useTry(
      async () =>
        await authorizedRequest({
          method: "get",
          url: `/api/integrations/amazon/ads/oauth?storeId=${storeId}`,
        }),
    );

    if (error) {
      toast.error(
        "Houve um erro ao tentar integrar com a Amazon Ads. Tente novamente.",
      );
      return;
    }

    window.location.href = response?.data.url;
  };

  const handleIntegrateAmazonSP = async () => {
    const [response, error] = await useTry(
      async () =>
        await authorizedRequest({
          method: "get",
          url: `/api/integrations/amazon/sp/oauth?storeId=${storeId}`,
        }),
    );

    if (error) {
      toast.error(
        "Houve um erro ao tentar integrar com a Amazon SP. Tente novamente.",
      );
      return;
    }

    window.location.href = response?.data.url;
  };

  const handleStartEditName = () => {
    setEditedName(store.name);
    setIsEditingName(true);
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setEditedName("");
  };

  const handleSaveEditName = async () => {
    if (!editedName.trim()) {
      toast.error("O nome da loja não pode estar vazio.");
      return;
    }
    await updateStore({ url: storeUrl, data: { name: editedName } });
  };

  const handleStartEditTaxRate = () => {
    const displayValue = store.taxRate?.toString().replace(".", ",") || "";
    setEditedTaxRate(displayValue);
    setIsEditingTaxRate(true);
  };

  const handleCancelEditTaxRate = () => {
    setIsEditingTaxRate(false);
    setEditedTaxRate("");
  };

  const handleSaveEditTaxRate = async () => {
    if (!editedTaxRate.trim()) {
      toast.error("A alíquota não pode estar vazia.");
      return;
    }

    const numericValue = Number(editedTaxRate.replace(",", "."));

    if (isNaN(numericValue) || numericValue < 0) {
      toast.error("Por favor, insira um valor válido para a alíquota.");
      return;
    }

    await updateStore({ url: storeUrl, data: { taxRate: numericValue } });
  };

  useEffect(() => {
    if (connected) refetchStore();
  }, [connected]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="text-center text-muted-foreground p-6 border rounded-md">
        Loja não encontrada.
      </div>
    );
  }

  const amazonAdsIntegration = store.integrations?.find(
    (i) => i.provider === "amazon_ads",
  );
  const amazonSPIntegration = store.integrations?.find(
    (i) => i.provider === "amazon_sp",
  );

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Conectado":
        return "bg-success/20 text-success";
      case "Conectando...":
        return "bg-info/20 text-info";
      default:
        return "bg-destructive/20 text-destructive";
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case "Conectado":
        return "Conectado";
      case "Conectando...":
        return "Conectando...";
      default:
        return "Desconectado";
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between pb-6 border-b">
        <div className="flex items-center gap-4">
          {store.logoUrl ? (
            <img
              src={store.logoUrl}
              alt={store.name}
              className="w-20 h-20 rounded-full object-cover shadow-md"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-2xl font-semibold shadow-md">
              {store.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {isEditingName ? (
                <>
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="text-3xl font-semibold text-foreground bg-transparent border-b-2 border-primary focus:outline-none"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveEditName();
                      if (e.key === "Escape") handleCancelEditName();
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleSaveEditName}
                  >
                    <Check className="w-4 h-4 text-success" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleCancelEditName}
                  >
                    <X className="w-4 h-4 text-destructive" />
                  </Button>
                </>
              ) : (
                <>
                  <h1 className="text-3xl font-semibold text-foreground">
                    {store.name}
                  </h1>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleStartEditName}
                  >
                    <Pen className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>

            {/* Alíquota */}
            <div className="flex items-center gap-2 mt-3">
              <span className="text-sm text-muted-foreground">Alíquota:</span>
              {isEditingTaxRate ? (
                <>
                  <div className="relative">
                    <input
                      type="text"
                      value={editedTaxRate}
                      onChange={(e) => {
                        const raw = sanitizeNumericInput(e.target.value);
                        setEditedTaxRate(raw);
                      }}
                      onBlur={() => {
                        if (!editedTaxRate) return;
                        const n = Number(editedTaxRate.replace(",", "."));
                        if (!isNaN(n)) {
                          const formatted = n.toFixed(2).replace(".", ",");
                          setEditedTaxRate(formatted);
                        }
                      }}
                      className="text-lg font-medium bg-transparent border-b-2 border-primary focus:outline-none w-24 pr-6"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEditTaxRate();
                        if (e.key === "Escape") handleCancelEditTaxRate();
                      }}
                    />
                    <Percent className="w-3 h-3 text-muted-foreground absolute right-1 top-1/2 -translate-y-1/2" />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleSaveEditTaxRate}
                  >
                    <Check className="w-3 h-3 text-success" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleCancelEditTaxRate}
                  >
                    <X className="w-3 h-3 text-destructive" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="text-lg font-medium flex items-center gap-1">
                    {store.taxRate?.toFixed(2).replace(".", ",") || "0,00"}
                    <Percent className="w-3 h-3 text-muted-foreground" />
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleStartEditTaxRate}
                  >
                    <Pen className="w-3 h-3" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Integração Amazon Ads */}
      <div className="pt-4">
        <div className="p-6 rounded-lg border bg-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Integração Amazon Ads</h2>
            <Badge
              className={`${getStatusColor(amazonAdsIntegration?.status)} text-sm px-3 py-1`}
            >
              {amazonAdsIntegration?.status === "Conectado" ? (
                <CheckCircle className="w-4 h-4 mr-1.5" />
              ) : (
                <AlertCircle className="w-4 h-4 mr-1.5" />
              )}
              {getStatusLabel(amazonAdsIntegration?.status)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Conecte sua loja com Amazon Ads para sincronizar dados e gerenciar
            campanhas.
          </p>
          <Button
            className="w-full md:w-auto px-8"
            onClick={handleIntegrateAmazonAds}
            disabled={amazonAdsIntegration?.status === "Conectado"}
          >
            {amazonAdsIntegration?.status === "Conectado" ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Já conectado à Amazon Ads
              </>
            ) : amazonAdsIntegration?.status === "Conectando..." ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <Plug className="w-4 h-4 mr-2" />
                Integrar com Amazon Ads
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Integração Amazon SP */}
      <div className="pt-4">
        <div className="p-6 rounded-lg border bg-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Integração Amazon SP</h2>

            <div className="flex items-center gap-3">
              <Badge
                className={`${getStatusColor(amazonSPIntegration?.status)} text-sm px-3 py-1`}
              >
                {amazonSPIntegration?.status === "Conectado" ? (
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 mr-1.5" />
                )}
                {getStatusLabel(amazonSPIntegration?.status)}
              </Badge>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Conecte sua loja com Amazon SP-API para sincronizar dados de vendas
            e estoque.
          </p>
          <Button
            className="w-full md:w-auto px-8"
            onClick={handleIntegrateAmazonSP}
            disabled={amazonSPIntegration?.status === "Conectado"}
          >
            {amazonSPIntegration?.status === "Conectado" ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Já conectado à Amazon SP
              </>
            ) : amazonSPIntegration?.status === "Conectando..." ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <Plug className="w-4 h-4 mr-2" />
                Integrar com Amazon SP
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
