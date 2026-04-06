import type { TopProductDTO } from "@/dtos/top-products-dto";
import { formatCurrency } from "@/utils/format-currency";
import { Badge } from "@workspace/ui/components/badge";
import { cn } from "@workspace/ui/lib/utils";
import { Package, TrendingUp, ShoppingCart, Megaphone } from "lucide-react";

interface TopProductsProps {
  products: TopProductDTO[];
  isLoading?: boolean;
}

export function TopProducts({ products, isLoading }: TopProductsProps) {
  if (isLoading) {
    return (
      <div className="border rounded-lg p-6 bg-card">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Top Produtos Mais Vendidos
        </h2>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-4 p-4 bg-sidebar rounded-lg">
                <div className="h-16 w-16 bg-muted rounded-md" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!products?.length) {
    return (
      <div className="border rounded-lg p-6 bg-card">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Top Produtos Mais Vendidos
        </h2>
        <div className="text-center text-muted-foreground py-8">
          Nenhum produto encontrado neste período.
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Package className="h-5 w-5" />
          Top Produtos Mais Vendidos
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="text-xs uppercase border-b bg-muted/30">
            <tr>
              <th className="py-3 pl-6 pr-4 text-left min-w-[240px]">
                Produto
              </th>
              <th className="py-3 px-4 text-center whitespace-nowrap">
                Qtd Vendida
              </th>
              <th className="py-3 px-4 text-center whitespace-nowrap">
                Pedidos
              </th>
              <th className="py-3 px-4 text-right whitespace-nowrap">
                Receita
              </th>
              <th className="py-3 px-4 text-right whitespace-nowrap">Lucro</th>
              <th className="py-3 px-4 text-right whitespace-nowrap">
                Custo Ads
              </th>
              <th className="py-3 px-4 text-right whitespace-nowrap">
                Lucro Pós-Ads
              </th>
              <th className="py-3 pr-6 pl-4 text-right whitespace-nowrap">
                Margem
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((product, index) => {
              const adsCost = product.ads?.cost ?? 0;
              const profitAfterAds =
                product.ads?.profitAfterAds ?? product.profit;
              const marginAfterAds =
                product.ads?.marginAfterAds ?? product.profitMargin;
              const hasAds = adsCost > 0;

              return (
                <tr
                  key={product.sku}
                  className="hover:bg-muted/20 transition-colors"
                >
                  <td className="py-4 pl-6 pr-4">
                    <div className="flex items-center gap-4">
                      <div className="relative shrink-0">
                        <img
                          src={
                            product.imageUrl || "https://via.placeholder.com/64"
                          }
                          alt={product.title}
                          className="h-16 w-16 object-cover rounded-md bg-muted"
                        />
                        <div className="absolute -top-2 -left-2 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                      </div>
                      <div className="min-w-0 max-w-[280px]">
                        <div className="text-sm font-medium truncate">
                          {product.title}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          SKU: {product.sku}
                        </div>
                        {product.asin && (
                          <div className="text-xs text-muted-foreground truncate">
                            ASIN: {product.asin}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-semibold">
                        {product.quantitySold}
                      </span>
                    </div>
                  </td>

                  <td className="py-4 px-4 text-center">
                    <span className="text-sm">{product.orderCount}</span>
                  </td>

                  <td className="py-4 px-4 text-right">
                    <span className="text-sm font-medium text-success">
                      {formatCurrency(product.revenue)}
                    </span>
                  </td>

                  <td className="py-4 px-4 text-right">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        product.profit >= 0 ? "text-success" : "text-danger",
                      )}
                    >
                      {formatCurrency(product.profit)}
                    </span>
                  </td>

                  <td className="py-4 px-4 text-right">
                    {hasAds ? (
                      <div className="flex items-center justify-end gap-1">
                        <Megaphone className="h-3 w-3 text-info" />
                        <span className="text-sm font-medium text-info">
                          {formatCurrency(adsCost)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Sem ads
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-4 text-right">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        profitAfterAds >= 0 ? "text-success" : "text-danger",
                      )}
                    >
                      {formatCurrency(profitAfterAds)}
                    </span>
                  </td>

                  <td className="py-4 pr-6 pl-4 text-right">
                    <div className="flex justify-end">
                      <Badge
                        className={cn(
                          "flex items-center gap-1 w-fit",
                          marginAfterAds >= 20
                            ? "bg-success/10 text-success"
                            : marginAfterAds >= 0
                              ? "bg-warning/10 text-warning"
                              : "bg-danger/10 text-danger",
                        )}
                      >
                        <TrendingUp className="h-3 w-3" />
                        {marginAfterAds.toFixed(2)}%
                      </Badge>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
