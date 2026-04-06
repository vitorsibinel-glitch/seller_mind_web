// Tipos para os dados de pedidos
export interface ProdutoPedido {
  id: string;
  imagem: string;
  nome: string;
  sku: string;
  quantidade: number;
  precoUnitario: number;
  total: number;
  liquidoMarketplace: number;
  imposto: number;
  custoUnitario: number;
  custoExtra: number;
  lucro: number;
  margem: number;
}

export interface ResumoFinanceiro {
  totalItens: number;
  comissao: number;
  taxaFBA: number;
  taxaParcelamento: number;
  imposto: number;
  custoProdutos: number;
  custosExtras: number;
  lucroFinal: number;
}

export interface Pedido {
  id: string;
  numeroPedido: string;
  asin: string;
  status: "aprovado" | "pendente" | "cancelado" | "enviado" | "entregue";
  dataCriacao: string;
  horaCriacao: string;
  dataAprovacao: string | null;
  horaAprovacao: string | null;
  marketplace: "amazon" | "mercadolivre" | "shopee";
  tipoEnvio: "FBA" | "FBM";
  produtos: ProdutoPedido[];
  resumoFinanceiro: ResumoFinanceiro;
}

// Dados simulados dos pedidos
export const pedidos: Pedido[] = [
  {
    id: "1",
    numeroPedido: "702-3104353-5175415",
    asin: "B0FGY6CR7",
    status: "aprovado",
    dataCriacao: "2024-09-29",
    horaCriacao: "04:09:32",
    dataAprovacao: "2024-09-29",
    horaAprovacao: "04:20:15",
    marketplace: "amazon",
    tipoEnvio: "FBA",
    produtos: [
      {
        id: "1",
        imagem:
          "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=64&h=64&fit=crop",
        nome: "Esfregão Elétrico Giratório 9 em 1 - Escova de Limpeza Recarregável com Cabo A 360 Extenso",
        sku: "Y9-XR6C-DRL6",
        quantidade: 1,
        precoUnitario: 99.9,
        total: 99.9,
        liquidoMarketplace: 73.46,
        imposto: 4.0,
        custoUnitario: 50.0,
        custoExtra: 0,
        lucro: 19.47,
        margem: 19.5,
      },
    ],
    resumoFinanceiro: {
      totalItens: 99.9,
      comissao: 11.99,
      taxaFBA: 12.95,
      taxaParcelamento: 1.5,
      imposto: 4.0,
      custoProdutos: 50.0,
      custosExtras: 0,
      lucroFinal: 19.47,
    },
  },
  {
    id: "2",
    numeroPedido: "702-9876543-1234567",
    asin: "B07DXYZ123",
    status: "pendente",
    dataCriacao: "2024-09-29",
    horaCriacao: "02:11:40",
    dataAprovacao: null,
    horaAprovacao: null,
    marketplace: "amazon",
    tipoEnvio: "FBA",
    produtos: [
      {
        id: "1",
        imagem:
          "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=64&h=64&fit=crop",
        nome: "Esfregão Elétrico Giratório 9 em 1 - Escova de Limpeza Recarregável com Cabo A 360 Extenso",
        sku: "Y9-XR6C-DRL6",
        quantidade: 1,
        precoUnitario: 99.9,
        total: 99.9,
        liquidoMarketplace: 73.46,
        imposto: 4.0,
        custoUnitario: 50.0,
        custoExtra: 0,
        lucro: 19.47,
        margem: 19.5,
      },
    ],
    resumoFinanceiro: {
      totalItens: 99.9,
      comissao: 11.99,
      taxaFBA: 12.95,
      taxaParcelamento: 1.5,
      imposto: 4.0,
      custoProdutos: 50.0,
      custosExtras: 0,
      lucroFinal: 19.47,
    },
  },
  {
    id: "3",
    numeroPedido: "123-4567890-7654321",
    asin: "B0ABC12345",
    status: "enviado",
    dataCriacao: "2024-09-28",
    horaCriacao: "15:30:22",
    dataAprovacao: "2024-09-28",
    horaAprovacao: "15:45:10",
    marketplace: "mercadolivre",
    tipoEnvio: "FBM",
    produtos: [
      {
        id: "1",
        imagem:
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=64&h=64&fit=crop",
        nome: "Fone de Ouvido Bluetooth Premium",
        sku: "FON-BT-001",
        quantidade: 1,
        precoUnitario: 299.9,
        total: 299.9,
        liquidoMarketplace: 260.0,
        imposto: 12.0,
        custoUnitario: 150.0,
        custoExtra: 0,
        lucro: 98.0,
        margem: 32.68,
      },
    ],
    resumoFinanceiro: {
      totalItens: 299.9,
      comissao: 27.9,
      taxaFBA: 0,
      taxaParcelamento: 0,
      imposto: 12.0,
      custoProdutos: 150.0,
      custosExtras: 12.0,
      lucroFinal: 98.0,
    },
  },
  {
    id: "4",
    numeroPedido: "456-7890123-4567890",
    asin: "B0DEF67890",
    status: "entregue",
    dataCriacao: "2024-09-27",
    horaCriacao: "09:15:33",
    dataAprovacao: "2024-09-27",
    horaAprovacao: "09:30:42",
    marketplace: "shopee",
    tipoEnvio: "FBM",
    produtos: [
      {
        id: "1",
        imagem:
          "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=64&h=64&fit=crop",
        nome: "Smartwatch Fitness Tracker",
        sku: "SMW-FIT-002",
        quantidade: 1,
        precoUnitario: 199.9,
        total: 199.9,
        liquidoMarketplace: 170.0,
        imposto: 8.0,
        custoUnitario: 80.0,
        custoExtra: 0,
        lucro: 82.0,
        margem: 41.02,
      },
    ],
    resumoFinanceiro: {
      totalItens: 199.9,
      comissao: 19.9,
      taxaFBA: 0,
      taxaParcelamento: 0,
      imposto: 8.0,
      custoProdutos: 80.0,
      custosExtras: 10.0,
      lucroFinal: 82.0,
    },
  },
  {
    id: "5",
    numeroPedido: "789-0123456-7890123",
    asin: "B0GHI90123",
    status: "cancelado",
    dataCriacao: "2024-09-26",
    horaCriacao: "14:20:15",
    dataAprovacao: "2024-09-26",
    horaAprovacao: "14:25:30",
    marketplace: "amazon",
    tipoEnvio: "FBA",
    produtos: [
      {
        id: "1",
        imagem:
          "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=64&h=64&fit=crop",
        nome: "Caixa de Som Portátil 20W",
        sku: "CXS-POR-003",
        quantidade: 1,
        precoUnitario: 189.9,
        total: 189.9,
        liquidoMarketplace: 160.0,
        imposto: 7.6,
        custoUnitario: 95.0,
        custoExtra: 0,
        lucro: 42.45,
        margem: 22.35,
      },
    ],
    resumoFinanceiro: {
      totalItens: 189.9,
      comissao: 18.99,
      taxaFBA: 10.86,
      taxaParcelamento: 0,
      imposto: 7.6,
      custoProdutos: 95.0,
      custosExtras: 15.0,
      lucroFinal: 42.45,
    },
  },
];
