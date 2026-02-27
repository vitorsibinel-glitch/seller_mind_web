"use client";

import { SectionID } from "@/sections";
import { Button } from "@workspace/ui/components/button";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isPrivacyPolicyPage = pathname === "/privacy-policy" ? true : false;

  const logoSrc = "/images/logo_dark.png";
  const logoMinimalistSrc = "/images/logo_minimalist_dark.png";

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const loginUrl = process.env.NEXT_PUBLIC_APP_URL as string;

  const redirectToAppLogin = () => {
    closeMobileMenu();
    window.location.href = "https://app.sellermind.com.br";
  };

  return (
    <>
      <nav className="hidden md:flex fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl items-center justify-between px-6 py-3 rounded-full bg-black border border-white/10 shadow-2xl">
        {/* Logo */}
        <div className="flex items-center">
          <Image
            src={logoSrc}
            alt="SELLERMIND"
            width={130}
            height={40}
            priority
          />
        </div>

        {/* Menu Central */}
        <div className="flex items-center gap-8 bg-zinc-900 px-8 py-2 rounded-full border border-white/5">
          <Link
            href={`#${SectionID.HOME}`}
            className="text-sm text-white/80 hover:text-white transition-colors"
          >
            Início
          </Link>

          <Link
            href={`#${SectionID.PRICING}`}
            className="text-sm text-white/80 hover:text-white transition-colors"
          >
            Planos
          </Link>

          <Link
            href={`#${SectionID.RESOURCES}`}
            className="text-sm text-white/80 hover:text-white transition-colors"
          >
            Funções
          </Link>

          <Link
            href={`#${SectionID.ABOUT_US}`}
            className="text-sm text-white/80 hover:text-white transition-colors"
          >
            Sobre nós
          </Link>
        </div>

        {/* Botões */}
        <div className="flex items-center gap-3">
          <button
            onClick={redirectToAppLogin}
            className="text-sm text-white/80 hover:text-white transition-colors"
          >
            Login
          </button>

          <Button
            className="rounded-full px-6 py-2 text-sm font-semibold bg-primary text-white shadow-lg"
            onClick={() => {
              window.location.href = "https://app.sellermind.com.br/signup";
            }}
          >
            Cadastre-se
          </Button>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed top-[56px] left-0 right-0 z-40 bg-black text-white border-b border-white/10">
          <div className="flex flex-col items-center gap-6 py-6 text-lg font-medium">
            <Link href={`#${SectionID.HOME}`} onClick={closeMobileMenu}>
              Início
            </Link>
            <Link href={`#${SectionID.PRICING}`} onClick={closeMobileMenu}>
              Planos
            </Link>
            <Link href={`#${SectionID.RESOURCES}`} onClick={closeMobileMenu}>
              Funções
            </Link>
            <Link href={`#${SectionID.ABOUT_US}`} onClick={closeMobileMenu}>
              Sobre nós
            </Link>
            <Link href="#login" onClick={redirectToAppLogin}>
              Login
            </Link>
            <Button
              className="w-11/12 py-4 text-lg font-medium rounded-full bg-primary hover:bg-primary/80 text-white"
              onClick={closeMobileMenu}
            >
              Cadastre-se
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
