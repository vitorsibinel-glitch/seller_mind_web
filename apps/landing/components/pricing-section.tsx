"use client";

import { useState } from "react";
import { SectionID } from "@/sections";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { ArrowRight, Check, Rocket, Star } from "lucide-react";
import Link from "next/link";
import { DefaultSectionWrapper } from "./ui/default-section-wrapper";

export function PricingSection() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  const baseUrl = `https://app.sellermind.com.br`;

  const handlePlanClick = (planSlug: string) => {
    const url = `${baseUrl}/signup?plan=${planSlug}`;
    window.location.href = url;
  };

  function calculatePrice(price: number) {
    if (billing === "monthly") {
      return {
        card: price,
        pix: Math.round(price * 0.97),
      };
    }

    return {
      card: Math.round(price * 12 * 0.8),
      pix: Math.round(price * 12 * 0.75),
    };
  }

  const basicPlans = [
    {
      name: "Basic 1",
      slug: "basic-1",
      price: 47,
      range: "Até 200 pedidos/mês",
      gamification: "10.000",
      popular: false,
    },
    {
      name: "Basic 2",
      slug: "basic-2",
      price: 97,
      range: "Até 1.000 pedidos/mês",
      gamification: "50.000",
      popular: false,
    },
    {
      name: "Basic 3",
      slug: "basic-3",
      price: 197,
      range: "Até 5.000 pedidos/mês",
      gamification: "250.000",
      popular: true,
    },
  ];

  const advancedPlans = [
    {
      name: "Advanced 1",
      slug: "advanced-1",
      price: 397,
      range: "Até 10.000 pedidos/mês",
      gamification: "500.000",
    },
    {
      name: "Advanced 2",
      slug: "advanced-2",
      price: 497,
      range: "Até 20.000 pedidos/mês",
      gamification: "1.000.000",
    },
    {
      name: "Advanced 3",
      slug: "advanced-3",
      price: 697,
      range: "Até 30.000 pedidos/mês",
      gamification: "1.500.000",
    },
    {
      name: "Advanced 4",
      slug: "advanced-4",
      price: 997,
      range: "Até 50.000 pedidos/mês",
      gamification: "2.500.000",
    },
    {
      name: "Advanced 5",
      slug: "advanced-5",
      price: 1297,
      range: "Até 70.000 pedidos/mês",
      gamification: "3.500.000",
    },
    {
      name: "Advanced 6",
      slug: "advanced-6",
      price: 2997,
      range: "Até 350.000 pedidos/mês",
      gamification: "3.500.000",
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

  function renderPlans(plans: any[]) {
    return plans.map((plan) => {
      const prices = calculatePrice(plan.price);

      return (
        <Card
          key={plan.name}
          className={`relative h-full border-border/40 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl ${
            plan.popular ? "border-primary/60 scale-[1.02]" : ""
          }`}
        >
          {plan.popular && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-tertiary to-primary text-white text-sm font-semibold flex items-center gap-2">
              <Star className="w-4 h-4" />
              Mais Popular
            </div>
          )}

          <CardHeader className="pt-10 pb-6 px-8">
            <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>

            <div className="mt-6 space-y-2">
              <div className="text-4xl font-bold">
                R$ {prices.card.toLocaleString("pt-BR")}
                <span className="text-sm text-muted-foreground ml-2">
                  {billing === "monthly"
                    ? "/mês no cartão"
                    : "/ano no cartão (-20%)"}
                </span>
              </div>

              <div className="text-lg font-semibold text-green-600">
                R$ {prices.pix.toLocaleString("pt-BR")} no PIX
                <span className="text-sm ml-2">
                  {billing === "monthly" ? "(-3%)" : "(-25%)"}
                </span>
              </div>

              {billing === "annual" && (
                <div className="text-sm text-muted-foreground">
                  Economize até 25% pagando anual
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <span className="text-base font-medium">{plan.range}</span>
              </li>

              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <span className="text-base">
                  Bônus de gamificação: R$ {plan.gamification}
                </span>
              </li>

              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span className="text-base">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>

          <CardFooter className="px-8 pb-8">
            <Button
              variant={plan.popular ? "default" : "outline"}
              className="w-full rounded-xl py-6 text-base"
              onClick={() => handlePlanClick(plan.slug)}
            >
              Testar grátis
              {plan.popular && <Rocket className="w-5 h-5 ml-2" />}
            </Button>
          </CardFooter>
        </Card>
      );
    });
  }

  return (
    <DefaultSectionWrapper sectionId={SectionID.PRICING}>
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Escolha o plano ideal para{" "}
            <span className="text-primary">o seu negócio</span>
          </h2>

          <p className="text-xl text-muted-foreground">
            Todos os planos incluem 20 dias grátis. Sem compromisso.
          </p>

          {/* Toggle */}
          <div className="flex justify-center mt-10">
            <div className="bg-white border border-border shadow-sm rounded-2xl p-1.5 flex items-center gap-1">
              <button
                onClick={() => setBilling("monthly")}
                className={`relative px-8 py-3 rounded-xl text-base font-semibold transition-all duration-300 ${
                  billing === "monthly"
                    ? "bg-primary text-white shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Mensal
              </button>

              <button
                onClick={() => setBilling("annual")}
                className={`relative px-8 py-3 rounded-xl text-base font-semibold transition-all duration-300 ${
                  billing === "annual"
                    ? "bg-primary text-white shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Anual
                <span className="absolute -top-2 -right-3 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                  -25%
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="mb-24">
          <h3 className="text-3xl font-semibold mb-10">Planos Basic</h3>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {renderPlans(basicPlans)}
          </div>
        </div>

        <div className="mb-24">
          <h3 className="text-3xl font-semibold mb-10">Planos Advanced</h3>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {renderPlans(advancedPlans)}
          </div>
        </div>

        <div className="text-center mt-20">
          <p className="text-base text-muted-foreground">
            ✓ Sem cartão de crédito ✓ Sem compromisso ✓ Cancele quando quiser
          </p>

          <Link
            href="#"
            className="inline-flex mt-6 items-center text-primary font-medium hover:text-primary/80 transition-colors group text-lg"
          >
            Fale com nossa equipe
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </DefaultSectionWrapper>
  );
}
