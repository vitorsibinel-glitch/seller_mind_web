import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, type JWTPayload } from "jose";
import { env } from "./env";

interface UserPayload extends JWTPayload {
  userId: string;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("auth_token")?.value;

  // Define rotas públicas (não precisam de autenticação)
  const publicRoutes = ["/login", "/signup", "/otp-validation"];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // Define rotas protegidas de página
  const protectedPageRoutes = ["/dashboard"];
  const isProtectedPage = protectedPageRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // Define rotas de API protegidas
  const protectedApiRoutes = [
    "/api/integrations/amazon/ads/oauth",
    "/api/integrations/amazon/ads/callback",
    "/api/integrations/amazon/sp/oauth",
    "/api/integrations/amazon/sp/callback",
    "/api/integrations/amazon/sp/orders",
    "/api/integrations/amazon/sp/fba-inventory",
    "/api/users",
    "/api/users/me",
    "/api/stores",
    "/api/products",
    "/api/stock/add",
    "/api/stock/movements",
    "/api/gamification/progress",
    "/api/finances/dre",
    "/api/finances/invoices",
    "/api/finances/expenses",
    "/api/subscriptions",
    "/api/subscriptions/status",
    "/api/subscriptions/me",
    "/api/plans",
    "/api/checkout/eduzz",
  ];
  const isProtectedApi = protectedApiRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // === ROTAS PÚBLICAS ===
  if (isPublicRoute) {
    // Se não tem token, permite acesso normalmente
    if (!token) {
      return NextResponse.next();
    }

    // Se tem token, verifica se é válido
    try {
      const secret = new TextEncoder().encode(env.JWT_SECRET!);
      await jwtVerify<UserPayload>(token, secret, { algorithms: ["HS256"] });

      // Token válido: redireciona para dashboard
      return NextResponse.redirect(new URL("/dashboard", req.url));
    } catch {
      // Token inválido: remove e permite acesso à página pública
      const response = NextResponse.next();
      response.cookies.delete("auth_token");
      return response;
    }
  }

  // === PÁGINAS PROTEGIDAS ===
  if (isProtectedPage) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    try {
      const secret = new TextEncoder().encode(env.JWT_SECRET!);
      await jwtVerify<UserPayload>(token, secret, { algorithms: ["HS256"] });

      // Token válido: permite acesso
      return NextResponse.next();
    } catch (err) {
      console.error("❌ Erro JWT na página protegida:", err);

      // Token inválido: remove e redireciona para login
      const response = NextResponse.redirect(new URL("/login", req.url));
      response.cookies.delete("auth_token");
      return response;
    }
  }

  // === APIs PROTEGIDAS ===
  if (isProtectedApi) {
    if (!token) {
      return NextResponse.json({ message: "Token ausente" }, { status: 401 });
    }

    try {
      const secret = new TextEncoder().encode(env.JWT_SECRET!);
      const verified = await jwtVerify<UserPayload>(token, secret, {
        algorithms: ["HS256"],
      });

      const payload = verified.payload;

      if (!payload.userId) {
        throw new Error("userId não encontrado no token");
      }

      // Adiciona userId nos headers
      const reqHeaders = new Headers(req.headers);
      reqHeaders.set("x-user-id", payload.userId);

      return NextResponse.next({
        request: { headers: reqHeaders },
      });
    } catch (err) {
      console.error("❌ Erro JWT na API:", err);
      return NextResponse.json(
        { message: "Token inválido ou expirado" },
        { status: 403 },
      );
    }
  }

  // Rota não matched: permite acesso
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Páginas protegidas
    "/dashboard/:path*",
    // Rotas públicas (para redirecionar se já estiver logado)
    "/login",
    "/signup",
    "/otp-validation",
    // APIs protegidas
    "/api/integrations/amazon/ads/oauth",
    "/api/integrations/amazon/ads/callback",
    "/api/integrations/amazon/sp/oauth",
    "/api/integrations/amazon/sp/callback",
    "/api/integrations/amazon/sp/orders",
    "/api/integrations/amazon/sp/fba-inventory",
    "/api/users/me",
    "/api/stores",
    "/api/stores/:path*",
    "/api/products",
    "/api/products/:path*",
    "/api/users/:path*",
    "/api/stock/:path*",
    "/api/gamification/:path*",
    "/api/finances/:path*",
    "/api/subscriptions",
    "/api/subscriptions/status",
    "/api/subscriptions/me",
    "/api/subscriptions/:path*",
    "/api/plans",
    "/api/plans/:path*",
    "/api/checkout/eduzz",
  ],
};
