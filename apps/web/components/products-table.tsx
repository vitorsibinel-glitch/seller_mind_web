import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import type { FBAInventoryItemDTO } from "@/dtos/fba-inventory-item-dto";
import { formatCurrency } from "@/utils/format-currency";

interface ProductTableProps {
  products: FBAInventoryItemDTO[];
}

export function ProductsTable({ products }: ProductTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] =
    useState<FBAInventoryItemDTO[]>(products);

  useEffect(() => {
    const q = searchTerm.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const fields = [product.name ?? "", product.sku ?? ""];
      return fields.some((f) => f.toLowerCase().includes(q));
    });
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const getStatusDetails = (days: number) => {
    if (days >= 80)
      return { color: "bg-success/10 text-success", label: "Excelente" };
    if (days >= 50) return { color: "bg-info/10 text-info", label: "Saudável" };
    if (days >= 30)
      return { color: "bg-warning/10 text-warning", label: "Atenção" };
    return { color: "bg-danger/10 text-danger", label: "Crítico" };
  };

  const placeholder =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><rect width='100%' height='100%' fill='%23f3f4f6'/></svg>";

  return (
    <Card className="shadow-sm border-none">
      <CardHeader className="px-6 py-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/30 border-y border-border/50">
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground">
                  Produto
                </th>
                <th className="text-left px-4 py-4 font-semibold text-muted-foreground">
                  SKU
                </th>
                <th className="text-right px-4 py-4 font-semibold text-muted-foreground">
                  Venda
                </th>
                <th className="text-right px-4 py-4 font-semibold text-muted-foreground">
                  Custo
                </th>
                <th className="text-center px-4 py-4 font-semibold text-muted-foreground">
                  Estoque (Dias)
                </th>
                <th className="text-center px-4 py-4 font-semibold text-muted-foreground">
                  Físico
                </th>
                <th className="text-center px-4 py-4 font-semibold text-muted-foreground">
                  Trânsito
                </th>
                <th className="text-center px-4 py-4 font-semibold text-muted-foreground">
                  FBA
                </th>
                <th className="text-center px-4 py-4 font-semibold text-muted-foreground">
                  Reservado
                </th>
                <th className="text-center px-6 py-4 font-semibold text-muted-foreground">
                  Impedido
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredProducts.map((product, index) => {
                const status = getStatusDetails(
                  product.data.daysOfInventory ?? 0
                );

                return (
                  <tr
                    key={index}
                    className="hover:bg-muted/20 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={product.imageUrl ?? placeholder}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover border bg-white shrink-0 shadow-sm"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-foreground truncate max-w-[240px]">
                            {product.name}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-mono text-[11px] bg-muted px-2 py-1 rounded text-muted-foreground uppercase tracking-wider">
                        {product.sku}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-medium">
                      {product.data.sales
                        ? formatCurrency(product.data.sales)
                        : "—"}
                    </td>
                    <td className="px-4 py-4 text-right text-muted-foreground">
                      {product.data.cost
                        ? formatCurrency(product.data.cost)
                        : "—"}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div
                        className={`inline-flex flex-col items-center justify-center min-w-[70px] px-3 py-1 rounded-md text-xs font-bold ring-1 ring-inset ring-current/20 ${status.color}`}
                      >
                        <span>{product.data.daysOfInventory} d</span>
                        <span className="text-[10px] uppercase opacity-80">
                          {status.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center font-medium">
                      {product.data.physicalStock}
                    </td>
                    <td className="px-4 py-4 text-center text-primary font-medium">
                      {product.data.inTransitToFBA}
                    </td>
                    <td className="px-4 py-4 text-center text-success font-bold">
                      {product.data.fulfillableQuantity}
                    </td>
                    <td className="px-4 py-4 text-center text-warning font-medium">
                      {product.data.reservedQuantity}
                    </td>
                    <td className="px-6 py-4 text-center text-danger font-medium">
                      {product.data.unfulfillableQuantity}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
