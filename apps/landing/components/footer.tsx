import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-foreground text-muted">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="text-lg font-bold tracking-wide flex items-center gap-2">
                <Image
                  src="https://sogchbwaqvfxowsrnmzh.supabase.co/storage/v1/object/public/images/logo.svg"
                  alt="SELLERMIND"
                  width={175}
                  height={175}
                  blurDataURL="https://sogchbwaqvfxowsrnmzh.supabase.co/storage/v1/object/public/images/logo.svg"
                />
              </div>
            </div>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              A plataforma de gestão inteligente que oferece visão completa da
              sua operação em marketplaces. Transforme dados em lucro.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">📧</span>
                <Link
                  href="mailto:contato@sellermind.com"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  contato@sellermind.com
                </Link>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">📞</span>
                <span className="text-slate-400">(11) 99999-9999</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">
              Links Rápidos
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="#"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Início
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Planos
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Funções
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Contato
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Login
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">
              Redes Sociais
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Link
                  href="#"
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
                >
                  <span className="text-blue-400">💼</span>
                  LinkedIn
                </Link>
                <Link
                  href="#"
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
                >
                  <span className="text-pink-400">📷</span>
                  Instagram
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="#"
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
                >
                  <span className="text-red-400">📺</span>
                  YouTube
                </Link>
                <Link
                  href="#"
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
                >
                  <span className="text-blue-500">👤</span>
                  Facebook
                </Link>
              </div>
            </div>
          </div>
          <div></div>
        </div>

        <div className="border-t border-slate-700 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <div className="flex items-center gap-6">
              <span className="text-slate-400">
                © 2025 Sellermind. Todos os direitos reservados.
              </span>
            </div>

            <div className="flex items-center gap-6">
              <Link
                href="/privacy-policy"
                className="text-slate-400 hover:text-white transition-colors"
              >
                Política de Privacidade
              </Link>
              <Link
                href="#"
                className="text-slate-400 hover:text-white transition-colors"
              >
                Termos de Uso
              </Link>
            </div>
          </div>

          <div className="text-center mt-4">
            <p className="text-slate-500 text-xs">
              CNPJ: 62.334.716/0001-82 | Sellermind Tecnologia Ltda.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
