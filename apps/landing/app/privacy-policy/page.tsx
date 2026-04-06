export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header com gradiente */}
      <div className="bg-gradient-to-br from-primary via-tertiary to-secondary pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Política de Privacidade
          </h1>
          <p className="text-white/90 text-lg max-w-3xl">
            Transparência e segurança no tratamento dos seus dados
          </p>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="max-w-7xl mx-auto px-6 -mt-8">
        <div className="bg-card rounded-xl shadow-lg p-8 md:p-12 mb-12">
          {/* Seção 1 */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-primary rounded-full"></div>
              <h2 className="text-3xl font-bold text-foreground">
                Informações que Coletamos
              </h2>
            </div>

            <div className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-6 border-l-4 border-primary">
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Informações Pessoais
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  "Informações pessoais" são informações que podem ser usadas
                  para identificar direta ou indiretamente um indivíduo. As
                  Informações Pessoais que coletamos podem incluir:
                </p>
                <ul className="space-y-2 text-foreground">
                  <li className="flex gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>
                      Nome, endereço postal, endereço de e-mail e número de
                      telefone
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>
                      Endereço IP, ID do dispositivo ou outros identificadores
                      persistentes
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>
                      Informações sobre suas contas de terceiros para integração
                      e análise
                    </span>
                  </li>
                </ul>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-accent/20 rounded-lg p-5 border border-accent">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    Dados de Uso
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Coletados automaticamente via cookies, web beacons e
                    ferramentas similares (IP, navegador, sistema operacional,
                    páginas acessadas)
                  </p>
                </div>

                <div className="bg-secondary/20 rounded-lg p-5 border border-secondary">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-tertiary rounded-full"></span>
                    Dados do Cliente
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Quando você vincula plataformas de terceiros, podemos
                    coletar dados sobre seus clientes e uso de serviços
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Seção 2 */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-tertiary rounded-full"></div>
              <h2 className="text-3xl font-bold text-foreground">
                Como e Quando Coletamos Informações
              </h2>
            </div>
            <p className="text-muted-foreground leading-relaxed bg-muted/30 rounded-lg p-6">
              Coletamos Informações Pessoais quando você as fornece através de
              formulários de inscrição, registro de conta, promoções e
              comunicação com o site. Também podemos coletar informações de
              terceiros, como corretores de dados e agregadores.
            </p>
          </section>

          {/* Seção 3 */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-secondary rounded-full"></div>
              <h2 className="text-3xl font-bold text-foreground">
                Como Usamos as Informações
              </h2>
            </div>

            <div className="bg-info/10 border border-info/30 rounded-lg p-6 mb-6">
              <p className="text-foreground leading-relaxed">
                Apenas processamos seus Dados Pessoais quando:{" "}
                <strong>(1)</strong> você deu consentimento,{" "}
                <strong>(2)</strong> for necessário para execução de contrato,{" "}
                <strong>(3)</strong> somos obrigados por lei, ou{" "}
                <strong>(4)</strong> quando for necessário para nossos
                interesses legítimos.
              </p>
              <p className="text-sm text-muted-foreground mt-3">
                Consentimento pode ser retirado a qualquer momento via{" "}
                <a
                  href="mailto:contato@sellermind.com.br"
                  className="text-primary hover:underline font-medium"
                >
                  contato@sellermind.com.br
                </a>
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                "Criar contas e perfis de usuário",
                "Rastrear e melhorar eficácia do site",
                "Gerenciar compras e pagamentos",
                "Personalizar experiências do usuário",
                "Realizar auditorias e requisitos legais",
                "Proteger direitos e prevenir fraudes",
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-muted/40 rounded-lg p-4 hover:bg-muted/60 transition-colors"
                >
                  <p className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">✓</span>
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Seção 4 */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-primary rounded-full"></div>
              <h2 className="text-3xl font-bold text-foreground">
                Como e Quando Compartilhamos Informações
              </h2>
            </div>

            <div className="space-y-4">
              {[
                {
                  title: "Provedores de Serviço",
                  desc: "Terceiros que auxiliam em pagamentos, hospedagem, segurança, manutenção e análise",
                  color: "primary",
                },
                {
                  title: "Sucessores",
                  desc: "Em caso de aquisição, fusão, falência ou liquidação",
                  color: "tertiary",
                },
                {
                  title: "Processo Legal",
                  desc: "Quando necessário para cumprir leis, prevenir fraudes ou proteger direitos",
                  color: "warning",
                },
                {
                  title: "Consentimento",
                  desc: "Compartilhamento com terceiros mediante seu consentimento explícito",
                  color: "success",
                },
                {
                  title: "Parceiros Analíticos",
                  desc: "Para monitorar tráfego e comportamento do usuário",
                  color: "secondary",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex gap-4 items-start p-5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div
                    className={`w-10 h-10 rounded-lg bg-${item.color}/20 flex items-center justify-center flex-shrink-0`}
                  >
                    <span className={`text-${item.color} font-bold`}>
                      {idx + 1}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Seção 5 */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-success rounded-full"></div>
              <h2 className="text-3xl font-bold text-foreground">
                Alterar e Excluir Informações Pessoais
              </h2>
            </div>

            <div className="bg-success/10 border-2 border-success/30 rounded-lg p-6">
              <p className="text-foreground leading-relaxed mb-4">
                Você pode solicitar acesso, atualização, correção, exclusão ou
                anonimização de suas informações pessoais, conforme a LGPD.
              </p>
              <a
                href="mailto:contato@sellermind.com"
                className="inline-flex items-center gap-2 bg-success text-success-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Entrar em Contato
              </a>
            </div>
          </section>

          {/* Divisor */}
          <div className="my-16 border-t-2 border-primary/20"></div>

          {/* Termos de Uso */}
          <section className="mb-12">
            <div className="bg-gradient-to-r from-primary/10 to-tertiary/10 rounded-xl p-8 mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Contrato de Adesão e Termo de Uso
              </h1>
            </div>

            {/* Assinatura */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-primary rounded-full"></div>
                <h2 className="text-2xl font-bold text-foreground">
                  1. Assinatura
                </h2>
              </div>

              <p className="text-muted-foreground mb-6 leading-relaxed">
                A assinatura do{" "}
                <strong className="text-primary">Sellermind</strong> está
                disponível nos formatos mensal e anual.
              </p>

              <div className="grid md:grid-cols-3 gap-6 mb-6">
                {/* Plano Start */}
                <div className="bg-gradient-to-br from-muted/40 to-muted/10 rounded-xl p-6 border border-border">
                  <h3 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
                    Plano Start
                  </h3>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-3xl font-bold text-primary">
                      R$ 97
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Cobrança automática a cada 30 dias no cartão cadastrado.
                  </p>
                  <div className="bg-background/50 rounded-lg p-3">
                    <p className="text-sm text-success font-medium">
                      ✓ Inclui 1 mês de teste gratuito
                    </p>
                  </div>
                </div>

                {/* Plano Pro */}
                <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl p-6 border-2 border-primary relative">
                  <h3 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
                    Plano Pro
                  </h3>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-3xl font-bold text-primary">
                      R$ 197
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Cobrança automática a cada 30 dias no cartão cadastrado.
                  </p>
                  <div className="bg-background/50 rounded-lg p-3">
                    <p className="text-sm text-success font-medium">
                      ✓ Inclui 1 mês de teste gratuito
                    </p>
                  </div>
                </div>

                {/* Plano Enterprise */}
                <div className="bg-gradient-to-br from-tertiary/20 to-tertiary/5 rounded-xl p-6 border border-tertiary/30">
                  <h3 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
                    Enterprise
                  </h3>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-3xl font-bold text-primary">
                      R$ 397
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Cobrança automática a cada 30 dias no cartão cadastrado.
                  </p>
                  <div className="bg-background/50 rounded-lg p-3">
                    <p className="text-sm text-success font-medium">
                      ✓ Inclui 1 mês de teste gratuito
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-info/10 border border-info/30 rounded-lg p-5 text-center">
                <p className="text-foreground font-medium mb-2">
                  🎁 Todos os planos incluem 1 mês de teste gratuito
                </p>
                <p className="text-sm text-muted-foreground">
                  Sem cartão de crédito • Sem compromisso • Cancele quando
                  quiser
                </p>
              </div>
            </div>

            {/* Cancelamento */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-warning rounded-full"></div>
                <h2 className="text-2xl font-bold text-foreground">
                  2. Cancelamento
                </h2>
              </div>

              <div className="bg-muted/30 rounded-lg p-6 mb-4">
                <p className="text-foreground leading-relaxed">
                  O plano mensal pode ser cancelado a qualquer momento, mantendo
                  acesso até o fim do ciclo já pago.
                </p>
              </div>

              <div className="bg-danger/10 border-2 border-danger/30 rounded-lg p-6">
                <h3 className="font-semibold text-danger mb-3 flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  Plano Anual – Sem Reembolso
                </h3>
                <p className="text-foreground leading-relaxed">
                  O usuário reconhece que o plano anual é um compromisso
                  irrevogável de 12 meses,{" "}
                  <strong>
                    sem possibilidade de cancelamento ou reembolso
                  </strong>
                  .
                </p>
              </div>
            </div>

            {/* Reembolso */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-info rounded-full"></div>
                <h2 className="text-2xl font-bold text-foreground">
                  3. Reembolso
                </h2>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4 items-start p-5 rounded-lg bg-success/10 border border-success/30">
                  <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-success font-bold">✓</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      Plano Mensal
                    </h3>
                    <p className="text-muted-foreground">
                      Reembolso integral se cancelado em até 7 dias após a
                      cobrança
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start p-5 rounded-lg bg-danger/10 border border-danger/30">
                  <div className="w-10 h-10 rounded-full bg-danger/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-danger font-bold">✗</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      Plano Anual
                    </h3>
                    <p className="text-muted-foreground">
                      Não há reembolso, mesmo dentro dos 7 dias, considerando
                      benefícios promocionais
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Aceitação */}
            <div className="bg-gradient-to-br from-primary via-tertiary to-secondary rounded-xl p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-4">
                4. Aceitação do Contrato
              </h2>
              <p className="text-white/90 leading-relaxed max-w-3xl mx-auto">
                Ao assinar o <strong>Sellermind</strong>, você declara estar de
                acordo com todos os termos descritos neste contrato.
              </p>
            </div>
          </section>

          {/* Rodapé */}
          <div className="mt-16 pt-8 border-t border-border text-center">
            <p className="text-lg font-semibold text-foreground mb-2">
              Atenciosamente,
            </p>
            <p className="text-primary font-bold text-xl">Equipe Sellermind</p>
          </div>
        </div>
      </div>
    </div>
  );
}
