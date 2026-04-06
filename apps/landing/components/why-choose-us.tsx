"use client";

import { Button } from "@workspace/ui/components/button";
import { Target, TrendingUp, ChartColumnBig } from "lucide-react";
import { FeatureItem } from "./ui/feature-item";
import { SectionID } from "@/sections";
import { DefaultSectionWrapper } from "./ui/default-section-wrapper";
import { useRouter } from "next/navigation";

export function WhyChooseUs() {
  const navigate = useRouter();

  return (
    <DefaultSectionWrapper sectionId={SectionID.RESOURCES}>
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-12">
          <div className="sm:max-w-full md:max-w-[60%] space-y-4">
            <div className="inline-flex items-center py-1.5 text-base font-medium text-foreground/80">
              <span className="mr-2 text-primary font-extrabold">|</span>
              <span>Por que a Sellermind é a sua melhor escolha?</span>
            </div>
            <h2 className="text-xl md:text-5xl font-bold leading-tight tracking-tight bg-gradient-to-b from-foreground to-foreground/90 bg-clip-text text-transparent">
              Porque aqui você encontra mais do que uma plataforma
              <br />
              <span className="text-primary text-lg md:text-4xl">
                Você encontra um parceiro estratégico
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-lg">
              Na Sellermind, entendemos que vender em marketplaces vai muito
              além de cadastrar produtos. É sobre ter clareza nos números,
              inteligência para decisões e ferramentas que realmente fazem
              diferença. E é exatamente por isso que somos diferentes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Button
                size="lg"
                className="rounded-full gap-2 cursor-pointer p-8"
                onClick={() => navigate.push(`#${SectionID.PRICING}`)}
              >
                CADASTRE-SE AGORA
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            <FeatureItem
              icon={<ChartColumnBig className="w-8 h-8 text-primary" />}
              title="Análise Completa"
              description="Visão 360º da sua operação com dados precisos e atualizados"
            />

            <FeatureItem
              icon={<Target className="w-8 h-8 text-primary" />}
              title="Foco no Lucro"
              description="Identifique exatamente onde você está ganhando ou perdendo dinheiro"
            />

            <FeatureItem
              icon={<TrendingUp className="w-8 h-8 text-primary" />}
              title="Crescimento Inteligente"
              description="Decisões baseadas em dados para expandir seus negócios"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-8 mt-28">
        <div className="bg-gradient-to-br from-slate-50/50 to-primary/10 rounded-3xl p-8 md:p-12 border border-slate-200/50">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex-1 space-y-6">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-slate-900">
                Pare de trabalhar no escuro
              </h2>

              <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
                Enquanto a maioria dos vendedores usa planilhas confusas e perde
                tempo tentando entender seus números, você terá clareza total
                sobre cada aspecto do seu negócio.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-500 mt-3 flex-shrink-0"></div>
                  <span className="text-slate-700 font-medium">
                    Lucro real por produto e categoria
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-500 mt-3 flex-shrink-0"></div>
                  <span className="text-slate-700 font-medium">
                    Performance comparativa entre marketplaces
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-500 mt-3 flex-shrink-0"></div>
                  <span className="text-slate-700 font-medium">
                    Identificação de oportunidades de crescimento
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center lg:items-end">
              <div className="relative">
                <div className="relative w-48 h-48 md:w-56 md:h-56">
                  <svg
                    className="w-full h-full transform -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-slate-200"
                    />

                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${90 * 2.827} ${100 * 2.827}`}
                      className="text-purple-500"
                      strokeLinecap="round"
                    />
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl md:text-6xl font-bold text-purple-600">
                      90%
                    </span>
                  </div>
                </div>

                <p className="text-center text-slate-600 font-medium mt-4 max-w-[200px]">
                  dos vendedores não sabem seu lucro real
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DefaultSectionWrapper>
  );
}
