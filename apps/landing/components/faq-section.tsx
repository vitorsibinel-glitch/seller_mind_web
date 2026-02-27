"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import Link from "next/link";
import { HelpCircle, ArrowRight } from "lucide-react";
import { SectionID } from "@/sections";
import { DefaultSectionWrapper } from "./ui/default-section-wrapper";

export function FaqSection() {
  return (
    <DefaultSectionWrapper sectionId={SectionID.FAQ} className="mb-16">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/3 -left-20 w-96 h-96 rounded-full bg-primary/10 blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-secondary/10 blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        <div className="space-y-6">
          <div className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
            <HelpCircle className="w-4 h-4 mr-2" />
            Dúvidas frequentes
          </div>

          <h2 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight bg-gradient-to-b from-foreground to-foreground/90 bg-clip-text text-transparent">
            Perguntas <span className="text-primary">frequentes</span>
          </h2>

          <p className="text-lg text-muted-foreground">
            Tudo que você precisa saber para começar a vender com autonomia e
            praticidade.
          </p>

          <Link
            href="#"
            className="inline-flex items-center text-primary font-medium hover:text-primary/80 transition-colors group"
          >
            Central de ajuda completa
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="w-full">
          <Accordion type="single" collapsible className="space-y-4">
            {faqItems.map((item) => (
              <AccordionItem
                key={item.value}
                value={item.value}
                className="border-border/50 rounded-lg overflow-hidden hover:border-primary/30 transition-colors"
              >
                <AccordionTrigger className="px-6 py-4 hover:no-underline text-left font-medium text-lg">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </DefaultSectionWrapper>
  );
}

const faqItems = [
  {
    value: "item-1",
    question: "Funciona em quais marketplaces?",
    answer: "Temos integração somente com a Amazon.",
  },
  {
    value: "item-2",
    question: "É necessário ter um ERP para utilizar o SellerMind?",
    answer: "Não, pois a integração é feita diretamente com os marketplaces.",
  },
  {
    value: "item-3",
    question: "Posso cancelar a qualquer momento?",
    answer: "Sim, o cancelamento pode ser feito a qualquer momento.",
  },
];
