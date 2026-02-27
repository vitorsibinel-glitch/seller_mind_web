"use client";

import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Check } from "lucide-react";
import { DefaultSectionWrapper } from "./ui/default-section-wrapper";
import Image from "next/image";
import { SectionID } from "@/sections";
import { useRouter } from "next/navigation";

export function BenefitsSection() {
  const navigate = useRouter();

  return (
    <DefaultSectionWrapper className="bg-secondary/10">
      <div className="max-w-7xl mx-auto px-6 md:px-8 flex flex-col lg:flex-row gap-16 items-center">
        <div className="flex-1 space-y-6">
          <div className="space-y-3">
            <p className="text-purple-600 font-medium text-sm uppercase tracking-wider">
              Menos taxas escondidas, mais dinheiro no seu caixa
            </p>

            <h2 className="text-4xl md:text-5xl font-bold leading-tight text-gray-900">
              Domine a Amazon e aumente seus lucros agora !
            </h2>

            <p className="text-lg text-gray-600 max-w-lg leading-relaxed">
              Conecte sua conta Amazon à SellerMind e tenha controle total de
              taxas, anúncios e vendas. Nada de achismos: decida com dados e
              escale sua operação.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4 bg-white p-4 rounded-3xl">
              <div className="bg-purple-100 p-2 rounded-full mt-1">
                <Check className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Integração com marketplace
                </h3>
                <p className="text-gray-600 text-sm">
                  Conecte sua conta em poucos cliques e tenha visão completa
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-white p-4 rounded-3xl">
              <div className="bg-purple-100 p-2 rounded-full mt-1">
                <Check className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Sincronização em tempo real
                </h3>
                <p className="text-gray-600 text-sm">
                  Dados claros e precisos 100% integrados com a Amazon
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-white p-4 rounded-3xl">
              <div className="bg-purple-100 p-2 rounded-full mt-1">
                <Check className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Análise de Margem por Item
                </h3>
                <p className="text-gray-600 text-sm">
                  Veja quais itens geram mais retorno e tome decisões
                  estratégicas com dados reais.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-white p-4 rounded-3xl">
              <div className="bg-purple-100 p-2 rounded-full mt-1">
                <Check className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Dashboard unificado
                </h3>
                <p className="text-gray-600 text-sm">
                  Todas as métricas em uma única tela.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-start items-center gap-4 bg-white p-4 rounded-3xl">
            <Button
              size="lg"
              className="rounded-full gap-2 cursor-pointer p-4"
              onClick={() => navigate.push(`#${SectionID.PRICING}`)}
            >
              FAÇA PARTE
            </Button>
            <p className="text-sm text-gray-600">
              Junte-se aos vendedores que já lucram <br />
              mais a nossa plataforma
            </p>
          </div>
        </div>

        <div className="flex-1 relative">
          <div className="relative z-10">
            <Image
              src="https://sellermind.nyc3.cdn.digitaloceanspaces.com/phone.jpeg"
              alt="Dashboard Mobile"
              width={400}
              height={800}
              className="rounded-3xl shadow-2xl w-full max-w-md mx-auto border border-border/50"
            />

            <Card className="bg-card/50 backdrop-blur-sm border-border/30 absolute -bottom-6 -right-6 w-72 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">+300</p>
                    <p className="text-sm text-muted-foreground">
                      Usuários confiam na nossa plataforma
                    </p>
                  </div>
                </div>
                <div className="flex -space-x-2 mt-4">
                  {[1, 2, 3, 4].map((item) => (
                    <img
                      key={item}
                      src={`https://randomuser.me/api/portraits/men/${item}.jpg`}
                      className="w-10 h-10 rounded-full border-2 border-background"
                      alt={`User ${item}`}
                    />
                  ))}
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm text-muted-foreground border-2 border-background">
                    +
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DefaultSectionWrapper>
  );
}
