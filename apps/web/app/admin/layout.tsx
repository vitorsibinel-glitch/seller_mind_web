"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Loader2, Users, CreditCard, Handshake, FileText, ScrollText, ShieldCheck } from "lucide-react";
import { useGet } from "@/hooks/use-api";

const navItems = [
  { href: "/admin/users", label: "Usuários", icon: Users },
  { href: "/admin/subscriptions", label: "Assinaturas", icon: CreditCard },
  { href: "/admin/partners", label: "Parceiros", icon: Handshake },
  { href: "/admin/invoices", label: "Faturas", icon: FileText },
  { href: "/admin/audit", label: "Auditoria", icon: ScrollText },
];

function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  const { refetch } = useGet<{ isAdmin: boolean }>("/api/admin/me", {
    enabled: false,
  });

  useEffect(() => {
    refetch()
      .then((result) => {
        if (!result?.data?.isAdmin) {
          router.push("/dashboard");
        }
      })
      .catch(() => {
        router.push("/dashboard");
      })
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-background">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 border-r bg-sidebar flex flex-col">
          <div className="flex items-center gap-2 px-4 py-5 border-b">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">Admin Center</span>
          </div>
          <nav className="flex flex-col gap-1 p-3 flex-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="p-3 border-t">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
            >
              ← Voltar ao Dashboard
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </AdminGuard>
  );
}
