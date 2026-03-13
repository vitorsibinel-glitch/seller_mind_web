import { withDB } from "@/lib/mongoose";
import { PlanModel, PlanTier } from "@workspace/mongodb/models/plan";
import { NextResponse } from "next/server";

// ===== Helpers =====

function slugify(text: string) {
  return text
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseNumber(value?: string | number) {
  if (typeof value === "number") return value;
  if (!value) return undefined;
  const digits = value.toString().replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : undefined;
}

function extractMaxOrders(range?: string) {
  if (!range) return undefined;
  const match = range.match(/(\d[\d\.]*)/);
  if (!match) return undefined;
  return parseNumber(match[0]);
}

// ===== Dados base =====

const basicPlans = [
  {
    name: "Basic 1",
    price: 47,
    range: "Até 200 pedidos/mês",
    gamification: "10.000",
    popular: false,
  },
  {
    name: "Basic 2",
    price: 97,
    range: "Até 1.000 pedidos/mês",
    gamification: "50.000",
    popular: false,
  },
  {
    name: "Basic 3",
    price: 197,
    range: "Até 5.000 pedidos/mês",
    gamification: "250.000",
    popular: true,
  },
];

const advancedPlans = [
  {
    name: "Advanced 1",
    price: 397,
    range: "Até 10.000 pedidos/mês",
    gamification: "500.000",
    popular: false,
  },
  {
    name: "Advanced 2",
    price: 497,
    range: "Até 20.000 pedidos/mês",
    gamification: "1.000.000",
    popular: false,
  },
  {
    name: "Advanced 3",
    price: 697,
    range: "Até 30.000 pedidos/mês",
    gamification: "1.500.000",
    popular: false,
  },
  {
    name: "Advanced 4",
    price: 997,
    range: "Até 50.000 pedidos/mês",
    gamification: "2.500.000",
    popular: false,
  },
  {
    name: "Advanced 5",
    price: 1297,
    range: "Até 70.000 pedidos/mês",
    gamification: "3.500.000",
    popular: false,
  },
  {
    name: "Advanced 6",
    price: 2997,
    range: "Até 350.000 pedidos/mês",
    gamification: "3.500.000",
    popular: false,
  },
];

const features = [
  "Painel Inteligente de Vendas",
  "Gestão Completa de Pedidos",
  "Controle de Notas Fiscais",
  "Controle Contábil Operacional",
  "Controle de Estoque Físico vs FBA",
  "DRE",
  "Previsão Inteligente de Estoque",
  "Sincronização Automática de Produtos",
];

export async function GET(): Promise<NextResponse> {
  return withDB(async () => {
    const created: string[] = [];
    const skipped: string[] = [];

    const allPlans = [
      ...basicPlans.map((p, i) => ({
        ...p,
        tier: PlanTier.BASIC,
        sortOrder: i,
      })),
      ...advancedPlans.map((p, i) => ({
        ...p,
        tier: PlanTier.ADVANCED,
        sortOrder: basicPlans.length + i,
      })),
    ];

    for (const plan of allPlans) {
      const slug = slugify(plan.name);

      await PlanModel.findOneAndUpdate(
        { slug },
        {
          $set: {
            name: plan.name,
            slug,
            tier: plan.tier,
            description: "",
            features,
            prices: {
              monthly: plan.price,
              annual: Math.round(plan.price * 12 * 0.8), // 20% desconto anual
            },
            currency: "BRL",
            isActive: true,
            trialDays: 20,
            sortOrder: plan.sortOrder,
            isPopular: !!plan.popular,
            limits: {
              maxOrders: extractMaxOrders(plan.range),
              gamificationBonus: parseNumber(plan.gamification),
            },
            eduzzProductId: {
              monthly: "TODO_EDUZZ_ID",
              annual: "TODO_EDUZZ_ID",
            },
          },
        },
        { upsert: true, new: true },
      );

      created.push(plan.name);
    }

    return NextResponse.json(
      {
        message: "Seed finalizado",
        created,
        skipped,
      },
      { status: 201 },
    );
  });
}
