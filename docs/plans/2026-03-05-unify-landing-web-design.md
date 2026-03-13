# Design: Unificação Landing + Web em Projeto Standalone

## Contexto

O monorepo contém apps/landing, apps/web e packages compartilhados. A landing é simples (2200 LOC, usa apenas @workspace/ui). Vamos unificar tudo num único projeto Next.js standalone.

## Decisões

- Landing na raiz `/`, app nas rotas autenticadas
- Um repo, um deploy, um domínio (sellermind.com.br)
- Componentes da landing em `components/landing/`
- Packages (mongodb, ui, redis) movidos para dentro do projeto
- Sem monorepo (sem turbo, sem pnpm workspaces)

## Estrutura final

```
sellermind-web/
├── app/
│   ├── page.tsx              (landing)
│   ├── (landing)/            (grupo de rotas públicas da landing)
│   │   ├── get-in-touch/
│   │   └── privacy-policy/
│   ├── login/
│   ├── signup/
│   ├── dashboard/
│   ├── plans/
│   ├── checkout/success/
│   └── api/
├── components/
│   ├── landing/
│   └── ...
├── packages/
│   ├── mongodb/
│   ├── ui/
│   └── redis/
├── package.json
└── Dockerfile
```

## Rotas

| Rota | Tipo | Origem |
|------|------|--------|
| `/` | Pública | Landing |
| `/get-in-touch` | Pública | Landing |
| `/privacy-policy` | Pública | Landing |
| `/login` | Pública | Web |
| `/signup` | Pública | Web |
| `/dashboard/*` | Protegida | Web |
| `/plans` | Protegida | Web |
| `/checkout/success` | Protegida | Web |
| `/api/*` | Misto | Web |
