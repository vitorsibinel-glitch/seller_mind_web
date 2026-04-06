"use client";

import { SectionID } from "@/sections";
import { Button } from "@workspace/ui/components/button";
import { useRouter } from "next/navigation";

export function HeroSection() {
  const navigate = useRouter();

  return (
    <div id={SectionID.HOME}>
      <div className="relative flex flex-col items-center justify-center min-h-screen px-6 md:px-8">
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/videos/video.mp4" type="video/mp4" />
            Seu navegador não suporta vídeos.
          </video>
          <div className="absolute inset-0 bg-black md:bg-black/70" />
        </div>

        <div className="relative z-10 text-center max-w-7xl">
          <h1 className="text-4xl md:text-4xl lg:text-6xl font-extrabold leading-tight tracking-tight bg-clip-text text-white break-words text-center">
            Automatize o que importa e foque no crescimento do seu negócio!
          </h1>

          <p className="mt-6 text-lg text-white/80 text-center">
            Conquiste clareza financeira e escale seu marketplace com segurança.
          </p>

          <Button
            className="cursor-pointer font-semibold text-lg mt-8 px-8 py-6 rounded-full"
            onClick={() => navigate.push(`#${SectionID.PRICING}`)}
          >
            Cadastre-se gratuitamente
          </Button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-black/90 to-primary py-12 px-6 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-center justify-between gap-8 text-center md:text-left">
          <div className="flex-1">
            <h2 className="text-3xl sm:text-4xl md:text-4xl font-bold leading-tight tracking-wide text-white">
              Você fatura mais de 300 mil por mês?
            </h2>
            <p className="mt-4 text-xl md:text-2xl text-white/80 max-w-3xl mx-auto md:mx-0">
              A Sellermind tem benefícios exclusivos para quem está jogando
              grande.
            </p>
          </div>

          <div className="flex-shrink-0">
            <Button
              size="lg"
              variant="secondary"
              className="rounded-full gap-2 cursor-pointer p-6 bg-white text-black transition-colors w-full"
              onClick={() => navigate.push("/get-in-touch")}
            >
              ENTRE EM CONTATO CONOSCO!
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
