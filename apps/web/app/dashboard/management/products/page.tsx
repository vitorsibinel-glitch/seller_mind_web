"use client";

import { AssociateListingsModal } from "@/components/associate-listing-modal";
import { CreateProductModal } from "@/components/create-product-modal";
import { PageHeader } from "@/components/page-header";
import { StoreSelector } from "@/components/store-selector";
import { UpdateProductModal } from "@/components/update-product-modal ";
import { useGlobalFilter } from "@/contexts/global-filter-context";
import type {
  AssociatedListingItemsResponseDTO,
  UnassociatedListingItemsResponseDTO,
} from "@/dtos/listing-item-dto";
import {
  createProductSchema,
  type CreateProductFormData,
  type GetProductsResponseDTO,
} from "@/dtos/product-dto";
import { useDelete, useGet, usePost } from "@/hooks/use-api";
import { formatCurrency } from "@/utils/format-currency";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { AlertCircle, Pencil, Plus, RefreshCcwDot, Trash } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function ProductsPage() {
  const [openCreateProductModal, setOpenCreateProductModal] = useState(false);
  const [openUpdateProductModal, setOpenUpdateProductModal] = useState(false);
  const [openDeleteProductDialog, setOpenDeleteProductDialog] = useState(false);
  const [openAssociateListingModal, setOpenAssociateListingModal] =
    useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const { selectedStoreId } = useGlobalFilter();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProductFormData>({
    resolver: zodResolver(createProductSchema),
  });

  const apiUrl = `/api/products?storeId=${selectedStoreId}`;

  const { data: productsData, refetch: refetchProducts } =
    useGet<GetProductsResponseDTO>(apiUrl, {
      enabled: !!selectedStoreId,
    });

  const { data: unassociatedListings, refetch: refetchUnassociatedListings } =
    useGet<UnassociatedListingItemsResponseDTO>(
      `/api/integrations/amazon/sp/unassociated?storeId=${selectedStoreId}`,
      {
        enabled: openAssociateListingModal && !!selectedStoreId,
      },
    );

  const { data: associations } = useGet<AssociatedListingItemsResponseDTO>(
    selectedProduct
      ? `/api/integrations/amazon/sp/associations/${selectedProduct}?storeId=${selectedStoreId}`
      : "",
    {
      enabled:
        openAssociateListingModal && !!selectedProduct && !!selectedStoreId,
    },
  );

  const { mutateAsync: createProduct, isPending: creatingProduct } = usePost(
    apiUrl,
    {
      onSuccess: async () => {
        await refetchProducts();
        await refetchUnassociatedListings();
        toast.success("Produto criado com sucesso");
        setOpenCreateProductModal(false);
        reset();
      },
    },
  );

  const { mutateAsync: deleteProductById } = useDelete();

  const products = productsData?.products || [];

  const currentProduct = products.find((p) => p._id === selectedProduct);

  const handleCreateProduct = async (data: CreateProductFormData) => {
    await createProduct(data);
  };

  const deleteProduct = async (productId: string) => {
    await deleteProductById(
      { url: `/api/products/${productId}` },
      {
        onSuccess: async () => {
          toast.success("Produto deletado com sucesso");
          await refetchProducts();
        },
      },
    );
  };

  const handleOpenAssociateModal = (productId: string) => {
    setSelectedProduct(productId);
    setOpenAssociateListingModal(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Produtos Internos"
        description="Gerencie seus produtos internos"
        actionBtn={true}
        actionBtnTitle="Novo Produto"
        actionBtnIcon={Plus}
        actionFunc={() => setOpenCreateProductModal(true)}
      />
      <StoreSelector />
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-sidebar">
                  <th className="text-left p-3 font-inter font-medium w-32">
                    SKU interno
                  </th>

                  <th className="text-left p-3 font-inter font-medium">
                    Imagem
                  </th>

                  <th className="text-left p-3 font-inter font-medium">
                    Produto
                  </th>

                  <th className="text-right p-3 font-inter font-medium">
                    Preço de Custo
                  </th>
                  <th className="text-right p-3 font-inter font-medium">
                    Custo Extra
                  </th>
                  <th className="text-right p-3 font-inter font-medium">
                    Anúncios Associados
                  </th>
                  <th className="text-right p-3 font-inter font-medium w-32">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product._id}
                    className="border-b hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-3 font-mono text-sm">{product.sku}</td>

                    <td className="p-3">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-10 h-10 rounded object-cover border"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-xs text-foreground/40 border">
                          Sem imagem
                        </div>
                      )}
                    </td>

                    <td className="p-3 truncate max-w-2">
                      <span title={product.name}>{product.name}</span>
                    </td>

                    <td className="p-3 text-right">
                      {product.cost ? (
                        formatCurrency(product.cost)
                      ) : (
                        <div className="flex justify-end">
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-destructive/10 text-destructive text-xs font-medium">
                            <AlertCircle size={12} />
                            Custo pendente
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="p-3 text-right">
                      {product.extraCost
                        ? formatCurrency(product.extraCost)
                        : "-"}
                    </td>

                    <td className="p-3 text-right text-muted-foreground">
                      {product.associations?.length} anúncios associados
                    </td>

                    <td className="p-3 text-right flex items-center justify-end gap-2">
                      <Button
                        className="p-2 rounded-md border border-tertiary text-tertiary hover:bg-muted transition"
                        onClick={() => handleOpenAssociateModal(product._id)}
                        variant="outline"
                      >
                        <RefreshCcwDot size={16} />
                      </Button>

                      <Button
                        className="p-2 rounded-md border border-info text-info hover:bg-muted transition"
                        onClick={() => {
                          setSelectedProduct(product._id);
                          setOpenUpdateProductModal(true);
                        }}
                        variant="outline"
                      >
                        <Pencil size={16} />
                      </Button>

                      <Button
                        className="p-2 rounded-md border border-destructive text-destructive hover:bg-destructive/10 transition"
                        onClick={() => {
                          setSelectedProduct(product._id);
                          setOpenDeleteProductDialog(true);
                        }}
                        variant="outline"
                      >
                        <Trash size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}

                {products.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-6 text-center text-muted-foreground italic"
                    >
                      Nenhum produto cadastrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <CreateProductModal
        open={openCreateProductModal}
        onOpenChange={setOpenCreateProductModal}
        control={control}
        errors={errors}
        onSubmit={handleSubmit(handleCreateProduct)}
        isLoading={creatingProduct}
      />

      {currentProduct && (
        <UpdateProductModal
          open={openUpdateProductModal}
          onOpenChange={setOpenUpdateProductModal}
          onSuccess={() => refetchProducts()}
          product={currentProduct}
        />
      )}

      {currentProduct && (
        <AssociateListingsModal
          isOpen={openAssociateListingModal}
          onOpenChange={setOpenAssociateListingModal}
          associatedItems={associations?.associations ?? []}
          unassociatedListingsItems={unassociatedListings?.items ?? []}
          productId={currentProduct._id}
          selectedStoreId={selectedStoreId as string}
          productName={currentProduct.name}
          productSku={currentProduct.sku}
          productImageUrl={currentProduct.imageUrl}
          refetchProducts={refetchProducts}
          refetchUnassociatedListings={refetchUnassociatedListings}
        />
      )}

      <Dialog
        open={openDeleteProductDialog}
        onOpenChange={setOpenDeleteProductDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deletar produto?</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir este produto? Essa ação não pode ser
            desfeita.
          </p>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedProduct(null);
                setOpenDeleteProductDialog(false);
              }}
            >
              Cancelar
            </Button>

            <Button
              variant="destructive"
              onClick={async () => {
                await deleteProduct(selectedProduct!);
                setOpenDeleteProductDialog(false);
              }}
            >
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
