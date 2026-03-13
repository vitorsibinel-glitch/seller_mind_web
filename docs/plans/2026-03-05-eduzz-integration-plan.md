# Eduzz Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrar de Ultralinks/DIG2PAY para Eduzz como gateway de pagamento, com checkout externo e webhook, eliminando armazenamento de dados de cartão.

**Architecture:** O usuário faz trial de 20 dias sem pagamento. Ao escolher um plano, é redirecionado ao checkout da Eduzz. A Eduzz gerencia recorrência e notifica via webhook. Todo usuário tem uma Subscription criada no signup (status TRIALING).

**Tech Stack:** Next.js 15, MongoDB/Mongoose, Redis, TypeScript

---

## Task 1: Remover código Ultralinks (limpeza de segurança)

**Files:**
- Delete: `apps/web/hooks/use-ultralinks-payment.tsx`
- Delete: `apps/web/hooks/use-save-card.tsx`
- Delete: `apps/web/services/billing/ultralinks.ts`
- Delete: `apps/web/app/api/subscriptions/intent/route.ts`
- Delete: `apps/web/app/api/subscriptions/save-card/route.ts`
- Delete: `apps/web/app/api/subscriptions/route.ts` (POST de criação via Ultralinks)
- Delete: `apps/web/app/api/subscriptions/[subscriptionId]/cancel/route.ts`
- Delete: `apps/web/app/api/subscriptions/[subscriptionId]/reactivate/route.ts`
- Delete: `apps/web/app/api/subscriptions/billing-account/[billingAccountId]/route.ts`
- Delete: `apps/web/app/api/subscriptions/billing-account/seed/route.ts`
- Delete: `apps/web/app/api/subscriptions/seed/r.ts`
- Delete: `apps/web/app/checkout/page.tsx` (formulário de cartão)

**Step 1: Deletar os arquivos listados acima**

```bash
rm apps/web/hooks/use-ultralinks-payment.tsx
rm apps/web/hooks/use-save-card.tsx
rm apps/web/services/billing/ultralinks.ts
rm -rf apps/web/app/api/subscriptions/intent
rm -rf apps/web/app/api/subscriptions/save-card
rm apps/web/app/api/subscriptions/route.ts
rm -rf apps/web/app/api/subscriptions/[subscriptionId]/cancel
rm -rf apps/web/app/api/subscriptions/[subscriptionId]/reactivate
rm -rf apps/web/app/api/subscriptions/billing-account
rm -rf apps/web/app/api/subscriptions/seed
rm apps/web/app/checkout/page.tsx
```

**Step 2: Verificar que não há imports quebrados**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -50
```

Corrigir quaisquer imports quebrados apontados pelo TypeScript.

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove Ultralinks payment code and card storage (security fix)"
```

---

## Task 2: Limpar model BillingAccount (remover dados de cartão)

**Files:**
- Modify: `packages/mongodb/models/billing-account.ts`

**Step 1: Reescrever billing-account.ts removendo CardData, PaymentMethod e campos de gateway**

O arquivo final deve ficar:

```typescript
import mongoose from "mongoose";
import type { Document, Model, Types } from "mongoose";

export interface BillingAccount {
  userId: Types.ObjectId;
  name: string;
  email: string;
  document: string;
  phone?: string;
  metadata: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface BillingAccountDocument extends BillingAccount, Document {}

const billingAccountSchema = new mongoose.Schema<BillingAccountDocument>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    document: { type: String, default: "" },
    phone: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
);

billingAccountSchema.index({ userId: 1 });
billingAccountSchema.index({ document: 1 });

export const BillingAccountModel: Model<BillingAccountDocument> =
  (mongoose.models.BillingAccount as Model<BillingAccountDocument>) ||
  mongoose.model<BillingAccountDocument>(
    "BillingAccount",
    billingAccountSchema,
  );
```

**Step 2: Verificar compilação**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -30
```

**Step 3: Commit**

```bash
git add packages/mongodb/models/billing-account.ts
git commit -m "fix(security): remove card data storage from BillingAccount model"
```

---

## Task 3: Adicionar campo eduzzProductId no model Plan

**Files:**
- Modify: `packages/mongodb/models/plan.ts`

**Step 1: Adicionar campo eduzzProductId à interface e schema**

Na interface `Plan` (linha 14), adicionar após `isPopular`:

```typescript
  eduzzProductId?: {
    monthly?: string;
    annual?: string;
  };
```

No schema (linha 45), adicionar após `isPopular` (linha 74):

```typescript
    eduzzProductId: {
      monthly: { type: String },
      annual: { type: String },
    },
```

**Step 2: Verificar compilação**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -30
```

**Step 3: Commit**

```bash
git add packages/mongodb/models/plan.ts
git commit -m "feat: add eduzzProductId to Plan model"
```

---

## Task 4: Atualizar model Subscription (eduzzSubscriptionId + planId opcional)

**Files:**
- Modify: `packages/mongodb/models/subscription.ts`

**Step 1: Adicionar eduzzSubscriptionId e tornar planId opcional**

Na interface `Subscription` (linha 19), alterar:
- `planId: Types.ObjectId;` → `planId?: Types.ObjectId;`
- Adicionar: `eduzzSubscriptionId?: string;`

No schema (linha 39), alterar:
- `planId` (linha 46-49): remover `required: true`
- Adicionar após `lastPaymentAttempt` (linha 69):

```typescript
    eduzzSubscriptionId: { type: String },
```

- Tornar opcionais os campos que não existem no trial:
  - `billingCycle` (linha 57-59): remover `required: true`
  - `currentPeriodStart` (linha 61): remover `required: true` → `{ type: Date }`
  - `currentPeriodEnd` (linha 62): remover `required: true` → `{ type: Date }`
  - `nextBillingDate` (linha 66): remover `required: true` → `{ type: Date }`
  - `priceAtSubscription` (linha 67): remover `required: true` → `{ type: Number, default: 0 }`

Na interface, tornar opcionais:

```typescript
  billingCycle?: BillingCycle;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  nextBillingDate?: Date;
  priceAtSubscription?: number;
```

Adicionar index:

```typescript
subscriptionSchema.index({ eduzzSubscriptionId: 1 });
```

**Step 2: Verificar compilação**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -30
```

**Step 3: Commit**

```bash
git add packages/mongodb/models/subscription.ts
git commit -m "feat: add eduzzSubscriptionId, make trial-friendly fields optional"
```

---

## Task 5: Criar Subscription no signup (todo usuário nasce com subscription TRIALING)

**Files:**
- Modify: `apps/web/app/api/auth/signup/route.ts`

**Step 1: Importar SubscriptionModel e criar subscription no signup**

Adicionar import no topo:

```typescript
import { SubscriptionModel, SubscriptionStatus } from "@workspace/mongodb/models/subscription";
```

Após a criação do BillingAccount (linha 44-49), adicionar:

```typescript
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 20);

    await SubscriptionModel.create({
      billingAccountId: billingAccount._id,
      status: SubscriptionStatus.TRIALING,
      trialEnd,
    });
```

Nota: precisa capturar o retorno do `BillingAccountModel.create` numa variável:

```typescript
    const billingAccount = await BillingAccountModel.create({
      userId: user._id,
      name: `${firstName} ${lastName}`,
      email,
      document: "",
    });
```

**Step 2: Verificar compilação**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -30
```

**Step 3: Commit**

```bash
git add apps/web/app/api/auth/signup/route.ts
git commit -m "feat: create TRIALING subscription on user signup"
```

---

## Task 6: Adicionar variáveis de ambiente da Eduzz

**Files:**
- Modify: `apps/web/env/index.ts`

**Step 1: Substituir variáveis Ultralinks por Eduzz**

No `envSchema` (linhas 17-18), substituir:

```typescript
  DIG2PAY_BASE_URL: z.string().default("https://payments.dig2pay.com"),
  ULTRALINKS_ACCESS_TOKEN: z.string().default(""),
```

Por:

```typescript
  EDUZZ_API_TOKEN: z.string().default(""),
  EDUZZ_WEBHOOK_SECRET: z.string().default(""),
```

**Step 2: Commit**

```bash
git add apps/web/env/index.ts
git commit -m "feat: replace Ultralinks env vars with Eduzz"
```

---

## Task 7: Criar endpoint de redirect para checkout Eduzz

**Files:**
- Create: `apps/web/app/api/checkout/eduzz/route.ts`

**Step 1: Criar o endpoint**

```typescript
import { withDB } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PlanModel } from "@workspace/mongodb/models/plan";
import { BillingAccountModel } from "@workspace/mongodb/models/billing-account";
import { SubscriptionModel, SubscriptionStatus } from "@workspace/mongodb/models/subscription";

export async function GET(req: NextRequest) {
  return withDB(async () => {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const planSlug = searchParams.get("planSlug");
    const billingCycle = searchParams.get("billingCycle") as "monthly" | "annual";

    if (!planSlug || !billingCycle || !["monthly", "annual"].includes(billingCycle)) {
      return NextResponse.json(
        { message: "planSlug e billingCycle (monthly|annual) são obrigatórios" },
        { status: 400 },
      );
    }

    const plan = await PlanModel.findOne({ slug: planSlug, isActive: true });
    if (!plan) {
      return NextResponse.json({ message: "Plano não encontrado" }, { status: 404 });
    }

    const eduzzProductId = plan.eduzzProductId?.[billingCycle];
    if (!eduzzProductId) {
      return NextResponse.json(
        { message: "Produto Eduzz não configurado para este plano/ciclo" },
        { status: 400 },
      );
    }

    const billingAccount = await BillingAccountModel.findOne({ userId });
    if (!billingAccount) {
      return NextResponse.json({ message: "Conta de billing não encontrada" }, { status: 404 });
    }

    const subscription = await SubscriptionModel.findOne({
      billingAccountId: billingAccount._id,
      status: { $in: [SubscriptionStatus.TRIALING, SubscriptionStatus.CANCELED, SubscriptionStatus.EXPIRED] },
    });

    if (!subscription) {
      return NextResponse.json({ message: "Assinatura não encontrada" }, { status: 404 });
    }

    // Monta URL do checkout Eduzz
    // Docs Eduzz: a URL inclui o productId e parâmetros de rastreamento
    const checkoutUrl = new URL(`https://sun.eduzz.com/checkout/${eduzzProductId}`);
    checkoutUrl.searchParams.set("email", billingAccount.email);
    checkoutUrl.searchParams.set("name", billingAccount.name);
    checkoutUrl.searchParams.set("utm_source", "omniseller");
    // Metadata para identificar no webhook
    checkoutUrl.searchParams.set("tracker", `${subscription._id}`);

    return NextResponse.json({ checkoutUrl: checkoutUrl.toString() });
  });
}
```

**Step 2: Adicionar rota ao middleware**

Em `apps/web/middleware.ts`, adicionar na lista `protectedApiRoutes` (linha 27):

```typescript
    "/api/checkout/eduzz",
```

E no `config.matcher` (linha 136):

```typescript
    "/api/checkout/eduzz",
```

**Step 3: Verificar compilação**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -30
```

**Step 4: Commit**

```bash
git add apps/web/app/api/checkout/eduzz/route.ts apps/web/middleware.ts
git commit -m "feat: add Eduzz checkout redirect endpoint"
```

---

## Task 8: Criar webhook handler da Eduzz

**Files:**
- Create: `apps/web/app/api/webhooks/eduzz/route.ts`

**Step 1: Criar o endpoint de webhook**

```typescript
import { withDB } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SubscriptionModel, SubscriptionStatus, BillingCycle } from "@workspace/mongodb/models/subscription";
import { BillingInvoiceModel } from "@workspace/mongodb/models/billing-invoice";
import { AuditLogModel } from "@workspace/mongodb/models/audit-log";
import { env } from "@/env";

// Eduzz envia webhooks com diferentes event types
// Docs: https://developers.eduzz.com/reference/webhooks
interface EduzzWebhookPayload {
  event_type: string;
  contract: {
    contract_id: number;
    status: string;
  };
  sale: {
    sale_id: number;
    contract_id?: number;
    sale_status: string; // "completed", "refunded", "waiting_payment", "canceled"
    tracker?: string;
    client_email: string;
    sale_amount: number;
    date_create: string;
    product_id: number;
  };
}

function validateWebhookToken(req: NextRequest): boolean {
  const token = req.headers.get("x-api-token") || req.nextUrl.searchParams.get("api_key");
  return token === env.EDUZZ_WEBHOOK_SECRET;
}

export async function POST(req: NextRequest) {
  return withDB(async () => {
    if (!validateWebhookToken(req)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload: EduzzWebhookPayload = await req.json();
    const { sale } = payload;

    if (!sale?.tracker) {
      // Sem tracker = não é uma venda que podemos mapear
      return NextResponse.json({ message: "OK - no tracker" }, { status: 200 });
    }

    const subscriptionId = sale.tracker;
    const subscription = await SubscriptionModel.findById(subscriptionId);

    if (!subscription) {
      console.error(`Webhook Eduzz: subscription ${subscriptionId} não encontrada`);
      return NextResponse.json({ message: "Subscription not found" }, { status: 200 });
    }

    const saleStatus = sale.sale_status;

    if (saleStatus === "completed") {
      // Pagamento confirmado
      const now = new Date();

      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.eduzzSubscriptionId = String(sale.contract_id || sale.sale_id);
      subscription.currentPeriodStart = now;
      // Determinar ciclo pelo valor ou pelo contrato
      const periodEnd = new Date(now);
      if (subscription.billingCycle === BillingCycle.ANNUAL) {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }
      subscription.currentPeriodEnd = periodEnd;
      subscription.nextBillingDate = periodEnd;
      subscription.priceAtSubscription = sale.sale_amount;
      subscription.retryCount = 0;
      await subscription.save();

      // Criar invoice
      const invoiceCount = await BillingInvoiceModel.countDocuments({
        subscriptionId: subscription._id,
      });

      await BillingInvoiceModel.create({
        invoiceNumber: `INV-${subscription._id}-${invoiceCount + 1}`,
        billingAccountId: subscription.billingAccountId,
        subscriptionId: subscription._id,
        amount: sale.sale_amount,
        currency: "BRL",
        status: "paid",
        dueDate: now,
        paidAt: now,
        periodStart: subscription.currentPeriodStart,
        periodEnd: subscription.currentPeriodEnd,
        paymentGatewayTransactionId: String(sale.sale_id),
        description: `Pagamento assinatura - Eduzz Sale #${sale.sale_id}`,
      });

      await AuditLogModel.create({
        action: "PAYMENT_SUCCESS",
        subscriptionId: subscription._id,
        billingAccountId: subscription.billingAccountId,
        metadata: { saleId: sale.sale_id, amount: sale.sale_amount },
      });
    } else if (saleStatus === "waiting_payment") {
      // Pagamento pendente/falhou
      subscription.status = SubscriptionStatus.PAST_DUE;
      subscription.retryCount = (subscription.retryCount || 0) + 1;
      subscription.lastPaymentAttempt = new Date();
      await subscription.save();

      await AuditLogModel.create({
        action: "PAYMENT_FAILED",
        subscriptionId: subscription._id,
        billingAccountId: subscription.billingAccountId,
        metadata: { saleId: sale.sale_id },
      });
    } else if (saleStatus === "refunded") {
      // Reembolso
      subscription.status = SubscriptionStatus.CANCELED;
      subscription.canceledAt = new Date();
      subscription.cancelReason = "Reembolso via Eduzz";
      await subscription.save();

      // Atualizar invoice se existir
      await BillingInvoiceModel.findOneAndUpdate(
        { paymentGatewayTransactionId: String(sale.sale_id) },
        { status: "refunded" },
      );

      await AuditLogModel.create({
        action: "INVOICE_REFUNDED",
        subscriptionId: subscription._id,
        billingAccountId: subscription.billingAccountId,
        metadata: { saleId: sale.sale_id },
      });
    } else if (saleStatus === "canceled") {
      // Cancelamento
      subscription.status = SubscriptionStatus.CANCELED;
      subscription.canceledAt = new Date();
      subscription.cancelReason = "Cancelado via Eduzz";
      await subscription.save();

      await AuditLogModel.create({
        action: "SUBSCRIPTION_CANCELED",
        subscriptionId: subscription._id,
        billingAccountId: subscription.billingAccountId,
        metadata: { saleId: sale.sale_id },
      });
    }

    return NextResponse.json({ message: "OK" }, { status: 200 });
  });
}
```

**Step 2: Garantir que a rota do webhook NÃO está protegida por JWT**

Verificar em `apps/web/middleware.ts` que `/api/webhooks/eduzz` NÃO está na lista `protectedApiRoutes` nem no `config.matcher`. Isso é importante — a Eduzz chama esse endpoint, não um usuário logado.

**Step 3: Verificar compilação**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -30
```

**Step 4: Commit**

```bash
git add apps/web/app/api/webhooks/eduzz/route.ts
git commit -m "feat: add Eduzz webhook handler for payment events"
```

---

## Task 9: Atualizar página de planos para redirecionar pro Eduzz

**Files:**
- Modify: `apps/web/app/plans/page.tsx`

**Step 1: Alterar handleSelectPlan para chamar o endpoint de checkout Eduzz**

Substituir a função `handleSelectPlan` (linha 201-204) e adicionar state de billing cycle:

```typescript
  const handleSelectPlan = async (slug: string) => {
    try {
      const res = await fetch(
        `/api/checkout/eduzz?planSlug=${slug}&billingCycle=${billing}`,
      );
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Erro ao gerar checkout");
        return;
      }

      window.location.href = data.checkoutUrl;
    } catch {
      toast.error("Erro ao redirecionar para pagamento");
    }
  };
```

Adicionar import do toast no topo se não existir:

```typescript
import { toast } from "sonner";
```

**Step 2: Verificar compilação**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -30
```

**Step 3: Commit**

```bash
git add apps/web/app/plans/page.tsx
git commit -m "feat: redirect to Eduzz checkout from plans page"
```

---

## Task 10: Criar página de sucesso pós-checkout

**Files:**
- Create: `apps/web/app/checkout/success/page.tsx`

**Step 1: Criar a página**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { useGet } from "@/hooks/use-api";

interface SubscriptionStatus {
  hasAccess: boolean;
  status: string;
}

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const { data } = useGet<SubscriptionStatus>("/api/subscriptions/status");

  useEffect(() => {
    if (data) {
      setChecking(false);
      // Se a subscription já está ativa, o webhook já processou
      if (data.hasAccess && data.status === "active") {
        setTimeout(() => router.push("/dashboard"), 3000);
      }
    }
  }, [data, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {checking ? (
          <>
            <Loader2 className="h-16 w-16 text-primary mx-auto animate-spin" />
            <h1 className="text-2xl font-bold">Processando pagamento...</h1>
            <p className="text-muted-foreground">
              Aguarde enquanto confirmamos seu pagamento.
            </p>
          </>
        ) : (
          <>
            <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto" />
            <h1 className="text-2xl font-bold">Pagamento confirmado!</h1>
            <p className="text-muted-foreground">
              Sua assinatura está ativa. Você será redirecionado em instantes.
            </p>
            <Button onClick={() => router.push("/dashboard")}>
              Ir para o Dashboard
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/app/checkout/success/page.tsx
git commit -m "feat: add checkout success page"
```

---

## Task 11: Adicionar controle de acesso por subscription no middleware

**Files:**
- Modify: `apps/web/middleware.ts`

**Step 1: Adicionar checagem de subscription nas páginas protegidas**

O middleware do Next.js roda no Edge e não tem acesso ao Mongoose. A abordagem é:
- Manter o middleware apenas com JWT (como está)
- Usar o hook `use-subscription-guard.ts` que já existe no lado client para checar a subscription e redirecionar

Verificar o conteúdo de `apps/web/hooks/use-subscription-guard.ts` e garantir que ele:
1. Chama `GET /api/subscriptions/status`
2. Redireciona para `/plans` se não tem acesso

**Step 2: Atualizar endpoint /api/subscriptions/status**

Modificar `apps/web/app/api/subscriptions/status/route.ts` para checar trial:

```typescript
import { withDB } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { BillingAccountModel } from "@workspace/mongodb/models/billing-account";
import { SubscriptionModel, SubscriptionStatus } from "@workspace/mongodb/models/subscription";

export async function GET(req: NextRequest) {
  return withDB(async () => {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const billingAccount = await BillingAccountModel.findOne({ userId });
    if (!billingAccount) {
      return NextResponse.json({ hasAccess: false, status: "no_account" });
    }

    const subscription = await SubscriptionModel.findOne({
      billingAccountId: billingAccount._id,
    }).sort({ createdAt: -1 });

    if (!subscription) {
      return NextResponse.json({ hasAccess: false, status: "no_subscription" });
    }

    const now = new Date();

    // Trial válido
    if (
      subscription.status === SubscriptionStatus.TRIALING &&
      subscription.trialEnd &&
      subscription.trialEnd > now
    ) {
      return NextResponse.json({
        hasAccess: true,
        status: "trialing",
        trialEnd: subscription.trialEnd,
        planId: subscription.planId || null,
      });
    }

    // Assinatura ativa
    if (subscription.status === SubscriptionStatus.ACTIVE) {
      return NextResponse.json({
        hasAccess: true,
        status: "active",
        planId: subscription.planId,
        currentPeriodEnd: subscription.currentPeriodEnd,
      });
    }

    // Qualquer outro status = sem acesso
    return NextResponse.json({
      hasAccess: false,
      status: subscription.status,
      planId: subscription.planId || null,
    });
  });
}
```

**Step 3: Verificar compilação**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -30
```

**Step 4: Commit**

```bash
git add apps/web/app/api/subscriptions/status/route.ts
git commit -m "feat: update subscription status endpoint with trial check"
```

---

## Task 12: Atualizar endpoint /api/subscriptions/me

**Files:**
- Modify: `apps/web/app/api/subscriptions/me/route.ts`

**Step 1: Reescrever para retornar subscription com dados do plano**

```typescript
import { withDB } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { BillingAccountModel } from "@workspace/mongodb/models/billing-account";
import { SubscriptionModel } from "@workspace/mongodb/models/subscription";

export async function GET(req: NextRequest) {
  return withDB(async () => {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const billingAccount = await BillingAccountModel.findOne({ userId });
    if (!billingAccount) {
      return NextResponse.json({ message: "Conta não encontrada" }, { status: 404 });
    }

    const subscription = await SubscriptionModel.findOne({
      billingAccountId: billingAccount._id,
    })
      .sort({ createdAt: -1 })
      .populate("planId");

    if (!subscription) {
      return NextResponse.json({ message: "Assinatura não encontrada" }, { status: 404 });
    }

    return NextResponse.json({ subscription });
  });
}
```

**Step 2: Commit**

```bash
git add apps/web/app/api/subscriptions/me/route.ts
git commit -m "feat: simplify /subscriptions/me endpoint"
```

---

## Task 13: Limpar BillingService (packages/billing)

**Files:**
- Modify: `packages/billing/src/services/billing-service.ts`

**Step 1: Simplificar o service**

O BillingService não precisa mais criar subscriptions (feito no signup) nem cancelar/reativar (feito via webhook). Pode ser removido ou simplificado para apenas consultas.

Se não houver outros consumidores, deletar o arquivo e atualizar o index.ts do package:

```bash
rm packages/billing/src/services/billing-service.ts
```

Atualizar `packages/billing/src/index.ts` para remover o export do BillingService se existir.

**Step 2: Verificar compilação**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -30
```

Corrigir quaisquer imports que referenciem BillingService.

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove BillingService (subscription lifecycle managed by Eduzz)"
```

---

## Task 14: Atualizar middleware — limpar rotas removidas

**Files:**
- Modify: `apps/web/middleware.ts`

**Step 1: Atualizar listas de rotas protegidas**

Na lista `protectedApiRoutes` (linha 27), remover:

```
"/api/subscriptions/intent",
```

Adicionar:

```
"/api/checkout/eduzz",
```

No `config.matcher` (linha 136), remover:

```
"/api/subscriptions/intent",
```

Adicionar:

```
"/api/checkout/eduzz",
```

**Step 2: Commit**

```bash
git add apps/web/middleware.ts
git commit -m "chore: update middleware routes for Eduzz integration"
```

---

## Task 15: Seed dos eduzzProductId nos planos

**Files:**
- Modify: `apps/web/app/api/plans/seed/route.ts` (ou o arquivo de seed existente)

**Step 1: Atualizar seed para incluir eduzzProductId**

Para cada plano no seed, adicionar o campo `eduzzProductId` com os IDs reais dos produtos criados na Eduzz. Exemplo de formato:

```typescript
eduzzProductId: {
  monthly: "EDUZZ_PRODUCT_ID_MONTHLY",
  annual: "EDUZZ_PRODUCT_ID_ANNUAL",
},
```

> **NOTA:** Os IDs reais precisam ser preenchidos pelo time após criar os produtos na plataforma Eduzz. Usar placeholders como `"TODO_EDUZZ_ID"` até ter os IDs reais.

**Step 2: Commit**

```bash
git add apps/web/app/api/plans/seed/route.ts
git commit -m "feat: add eduzzProductId placeholders to plan seed"
```

---

## Task 16: Verificação final

**Step 1: Verificar compilação completa**

```bash
cd /home/marcelo/code/teste/seller_mind_web && pnpm build
```

**Step 2: Verificar que não restam referências ao Ultralinks/DIG2PAY**

```bash
grep -ri "ultralinks\|dig2pay\|cardToken\|cardData\|cvv" apps/ packages/ --include="*.ts" --include="*.tsx"
```

Esperado: nenhum resultado.

**Step 3: Verificar que o webhook não está protegido por JWT**

```bash
grep -n "webhooks" apps/web/middleware.ts
```

Esperado: nenhum resultado (não deve estar no matcher).

**Step 4: Commit final se necessário**

```bash
git add -A
git commit -m "chore: final cleanup and verification"
```
