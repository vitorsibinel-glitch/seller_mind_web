import { Button } from "@workspace/ui/components/button";
import { DefaultSectionWrapper } from "./ui/default-section-wrapper";
import { SectionID } from "@/sections";
import { useRouter } from "next/navigation";

export function ImpactSection() {
  const stats = [
    {
      number: "500 +",
      description: "Vendedores ativos",
    },
    {
      number: "R$ 50M+",
      description: "Em vendas gerenciadas",
    },
    {
      number: "98%",
      description: "Taxa de satisfação",
    },
  ];

  const testimonials = [
    {
      stars: 5,
      quote:
        "Finalmente consegui entender onde estava perdendo dinheiro. Em 2 meses aumentei meu lucro em 40%!",
      author: "Carlos Silva",
      role: "Vendedor na Amazon",
    },
    {
      stars: 5,
      quote:
        "A Sellermind transformou minha forma de gerenciar as vendas. Agora tomo decisões baseadas em dados reais.",
      author: "Marina Santos",
      role: "Multi-marketplace",
    },
  ];

  const renderStars = (count: number) => {
    return Array.from({ length: count }, (_, i) => (
      <span key={i} className="text-yellow-400 text-lg">
        ★
      </span>
    ));
  };

  const navigate = useRouter();

  return (
    <DefaultSectionWrapper>
      <div className="bg-foreground text-white py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Chega de perder tempo com{" "}
              <span className="text-secondary">planilhas</span>!
            </h2>
            <p className="text-xl text-muted">
              Tenha clareza, controle e mais lucro com a Sellermind.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2 text-secondary">
                  {stat.number}
                </div>
                <div className="text-muted text-lg">{stat.description}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-6">
                <div className="flex mb-4">
                  {renderStars(testimonial.stars)}
                </div>
                <blockquote className="text-gray-200 italic mb-4 text-lg leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>
                <div className="text-gray-400">
                  <div className="font-semibold text-white">
                    {testimonial.author}
                  </div>
                  <div className="text-sm">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <h3 className="text-3xl md:text-4xl font-bold mb-8">
              Pronto para descobrir seu verdadeiro potencial de lucro?
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                className="rounded-full gap-2 cursor-pointer p-8"
                onClick={() => navigate.push(`#${SectionID.PRICING}`)}
              >
                TESTAR 20 DIAS GRÁTIS
              </Button>
              <Button
                size="lg"
                className="rounded-full gap-2 cursor-pointer p-8 border border-primary"
                variant={"ghost"}
              >
                FALAR COM ESPECIALISTA
              </Button>
            </div>
            <div className="mt-6 text-sm text-muted/50 flex flex-wrap justify-center gap-4">
              <span>✓ Sem cartão de crédito</span>
              <span>✓ Sem compromisso</span>
              <span>✓ Cancele quando quiser</span>
            </div>
          </div>
        </div>
      </div>
    </DefaultSectionWrapper>
  );
}
