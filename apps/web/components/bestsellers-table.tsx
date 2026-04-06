"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { z } from "zod";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

// --- Dados simulados ---
const produtos = [
  {
    id: 1,
    nome: "Esfregão Elétrico Giratório 3 em 1 - Escova de Limpeza Recarregável",
    sku: "ESF-ELT-001",
    imagem:
      "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=64&h=64&fit=crop",
    precoMedio: 99.9,
    custoUnitario: 50.0,
    unidadesVendidas: 2,
    totalFaturado: 199.8,
    representacao: 100.0,
    lucroBruto: 38.94,
    margem: 19.49,
    custoAds: 10.36,
    lucroPosAds: 28.58,
    mpa: 14.3,
  },
  {
    id: 2,
    nome: "Fone de Ouvido Bluetooth Premium",
    sku: "FON-BT-001",
    imagem:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=64&h=64&fit=crop",
    precoMedio: 299.9,
    custoUnitario: 150.0,
    unidadesVendidas: 5,
    totalFaturado: 1499.5,
    representacao: 28.5,
    lucroBruto: 749.5,
    margem: 50.0,
    custoAds: 150.0,
    lucroPosAds: 599.5,
    mpa: 39.98,
  },
  {
    id: 3,
    nome: "Smartwatch Fitness Tracker",
    sku: "SMW-FIT-002",
    imagem:
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=64&h=64&fit=crop",
    precoMedio: 199.9,
    custoUnitario: 80.0,
    unidadesVendidas: 8,
    totalFaturado: 1599.2,
    representacao: 30.4,
    lucroBruto: 959.2,
    margem: 60.0,
    custoAds: 200.0,
    lucroPosAds: 759.2,
    mpa: 47.47,
  },
];

// --- Schema ---
export const produtoSchema = z.object({
  id: z.number(),
  nome: z.string(),
  sku: z.string(),
  imagem: z.string().url(),
  precoMedio: z.number(),
  custoUnitario: z.number(),
  unidadesVendidas: z.number(),
  totalFaturado: z.number(),
  representacao: z.number(),
  lucroBruto: z.number(),
  margem: z.number(),
  custoAds: z.number(),
  lucroPosAds: z.number(),
  mpa: z.number(),
});

// --- Colunas ---
const columns: ColumnDef<z.infer<typeof produtoSchema>>[] = [
  {
    accessorKey: "nome",
    header: "Produto",
    cell: ({ row }) => (
      <div className="flex items-center">
        <img
          src={row.original.imagem}
          alt={row.original.nome}
          className="h-10 w-10 rounded-md object-cover"
        />
        <div className="ml-4 max-w-[250px]">
          <div className="text-sm font-medium truncate">
            {row.original.nome}
          </div>
          <div className="text-xs text-muted-foreground">
            {row.original.sku}
          </div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "precoMedio",
    header: "Preço Médio",
    cell: ({ row }) =>
      `R$ ${row.original.precoMedio.toFixed(2).replace(".", ",")}`,
  },
  {
    accessorKey: "custoUnitario",
    header: "Custo Unitário Médio",
    cell: ({ row }) =>
      `R$ ${row.original.custoUnitario.toFixed(2).replace(".", ",")}`,
  },
  {
    accessorKey: "unidadesVendidas",
    header: "Unidades Vendidas",
    cell: ({ row }) => row.original.unidadesVendidas,
  },
  {
    accessorKey: "totalFaturado",
    header: "Total Faturado",
    cell: ({ row }) => (
      <span className="font-medium">
        R$ {row.original.totalFaturado.toFixed(2).replace(".", ",")}
      </span>
    ),
  },
  {
    accessorKey: "representacao",
    header: "Represent.",
    cell: ({ row }) =>
      `${row.original.representacao.toFixed(2).replace(".", ",")}%`,
  },
  {
    accessorKey: "lucroBruto",
    header: "Lucro",
    cell: ({ row }) => (
      <span className="font-medium">
        R$ {row.original.lucroBruto.toFixed(2).replace(".", ",")}
      </span>
    ),
  },
  {
    accessorKey: "margem",
    header: "Margem",
    cell: ({ row }) => (
      <Badge
        className={
          row.original.margem >= 20
            ? "bg-green-100 text-green-800"
            : "bg-yellow-100 text-yellow-800"
        }
      >
        {row.original.margem.toFixed(2).replace(".", ",")}%
      </Badge>
    ),
  },
  {
    accessorKey: "custoAds",
    header: "Custo ADS",
    cell: ({ row }) =>
      `R$ ${row.original.custoAds.toFixed(2).replace(".", ",")}`,
  },
  {
    accessorKey: "lucroPosAds",
    header: "Lucro pós ADS",
    cell: ({ row }) => (
      <span className="font-medium">
        R$ {row.original.lucroPosAds.toFixed(2).replace(".", ",")}
      </span>
    ),
  },
  {
    accessorKey: "mpa",
    header: "MPA",
    cell: ({ row }) => (
      <Badge
        className={
          row.original.mpa >= 15
            ? "bg-green-100 text-green-800"
            : "bg-yellow-100 text-yellow-800"
        }
      >
        {row.original.mpa.toFixed(2).replace(".", ",")}%
      </Badge>
    ),
  },
  {
    id: "actions",
    header: "Ações",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

export function BestsellersTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data: produtos,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-hidden rounded-lg border shadow-sm p-4">
      <div className="flex items-center justify-between py-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Top 15 produtos vendidos
        </h2>
        <Button variant="outline" asChild>
          <a href="#">
            Ver todos
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </div>
      <Table>
        <TableHeader className="bg-muted">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-muted/30">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center">
                Nenhum produto encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
