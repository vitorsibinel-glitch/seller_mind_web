import { SectionID } from "@/sections";
import { DefaultSectionWrapper } from "./ui/default-section-wrapper";
import {
  BarChart3,
  ChartColumnBig,
  Eye,
  NotebookText,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { useRouter } from "next/navigation";

export function FeaturesSection() {
  const navigate = useRouter();

  return (
    <DefaultSectionWrapper sectionId={SectionID.HOME}>
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="text-center space-y-6 mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-slate-900">
            Funcionalidades que fazem a{" "}
            <span className="text-purple-600">diferença</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Tudo que você precisa para ter controle total sobre seu negócio em
            marketplaces, em uma plataforma simples e poderosa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-8 border border-slate-200/50 hover:border-purple-200 hover:shadow-lg transition-all duration-300">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              O que realmente vende
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Identifique seus produtos mais lucrativos e entenda as tendências
              de mercado que impulsionam suas vendas.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-slate-200/50 hover:border-purple-200 hover:shadow-lg transition-all duration-300">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
              <div className="text-purple-600 text-2xl font-bold">$</div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Lucro em tempo real
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Acompanhe seus ganhos reais instantaneamente, com cálculos
              precisos de custos, taxas e margem de lucro.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-slate-200/50 hover:border-purple-200 hover:shadow-lg transition-all duration-300">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
              <Trophy className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Descubra seus campeões de venda
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Encontre os produtos que geram mais resultado e replique o sucesso
              em toda sua operação.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-slate-200/50 hover:border-purple-200 hover:shadow-lg transition-all duration-300">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Dashboards inteligentes
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Visualize dados complexos de forma simples e tome decisões
              estratégicas baseadas em informações claras.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-slate-200/50 hover:border-purple-200 hover:shadow-lg transition-all duration-300">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
              <NotebookText className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Relatórios detalhados
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Relatórios completos e personalizados que mostram exatamente onde
              seu negócio está ganhando ou perdendo.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-slate-200/50 hover:border-purple-200 hover:shadow-lg transition-all duration-300">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
              <Target className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Análise de vendas avançada
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Insights profundos sobre performance, sazonalidade e oportunidades
              de otimização em todos os canais.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-tertiary to-secondary text-white rounded-2xl mt-24 p-10 text-center shadow-lg">
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para ter clareza total sobre seus lucros?
          </h3>
          <p className="text-lg md:text-xl mb-6 max-w-3xl mx-auto">
            Junte-se a centenas de vendedores que já descobriram como maximizar
            seus resultados com dados precisos e insights acionáveis.
          </p>
          <Button
            className="cursor-pointer bg-white text-purple-700 font-semibold px-8 py-6 rounded-full hover:bg-purple-100 transition"
            onClick={() => navigate.push(`#${SectionID.PRICING}`)}
          >
            CADASTRE-SE AGORA
          </Button>
        </div>
      </div>
    </DefaultSectionWrapper>
  );
}
