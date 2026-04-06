# Design: Integração Eduzz + Correções de Segurança

## Contexto

O OmniSeller usava Ultralinks/DIG2PAY como gateway de pagamento, com coleta de cartão no próprio app e armazenamento de dados sensíveis no banco (violação PCI-DSS). A decisão é migrar para Eduzz, redirecionando o usuário pro checkout deles e reagindo via webhook.

## Decisões

- **1 produto na Eduzz por plano** (11 produtos totais)
- **Trial de 20 dias controlado internamente** (sem Eduzz no trial)
- **Cadastro sem plano** — usuário escolhe plano depois
- **Eduzz gerencia a recorrência** — cobrança automática mensal/anual
- **Todo usuário tem uma Subscription** — controle por status + planId

## Fluxo

### Signup
```
Usuário se cadastra
  -> Cria User
  -> Cria BillingAccount
  -> Cria Subscription (status: TRIALING, planId: null, trialEnd: now + 20 dias)
```

### Escolhendo plano e pagando
```
Usuário escolhe plano
  -> GET /api/checkout/eduzz?planSlug=basic-1&billingCycle=monthly
  -> Backend gera URL Eduzz com: productId, email, metadata (userId, subscriptionId)
  -> Redirect pro checkout Eduzz
  -> Usuário paga na Eduzz
  -> Eduzz redireciona pra /checkout/success
```

### Webhook confirma pagamento
```
POST /api/webhooks/eduzz
  -> Valida assinatura do webhook
  -> Evento: pagamento confirmado
    -> Subscription: status ACTIVE, planId, billingCycle, eduzzSubscriptionId
    -> Cria BillingInvoice (status: PAID)
    -> Cria AuditLog
  -> Evento: pagamento falhou
    -> Subscription status -> PAST_DUE
  -> Evento: cancelamento
    -> Subscription status -> CANCELED
  -> Evento: reembolso
    -> Subscription status -> CANCELED, Invoice -> REFUNDED
```

### Controle de acesso (middleware)
```
TRIALING + trialEnd > now     -> acesso liberado
TRIALING + trialEnd <= now    -> redireciona /plans
ACTIVE                        -> acesso liberado
PAST_DUE / CANCELED / EXPIRED -> redireciona /plans
```

## Ajustes nos Models

### Subscription — adicionar:
- `eduzzSubscriptionId` (string)

### Plan — adicionar:
- `eduzzProductId` ({ monthly: string, annual: string })

### BillingAccount — remover:
- `paymentGatewayId`, `paymentMethod` (cardToken, cardData com CVV, provider)

## Rotas

| Rota | Método | Propósito |
|---|---|---|
| `/api/checkout/eduzz` | GET | Gera URL do checkout Eduzz e redireciona |
| `/api/webhooks/eduzz` | POST | Recebe eventos da Eduzz (sem auth JWT, valida por token Eduzz) |
| `/api/subscriptions/me` | GET | Retorna subscription do usuário logado |
| `/api/subscriptions/status` | GET | Checa se tem acesso (trial válido ou active) |
| `/api/plans` | GET | Lista planos |

### Rotas removidas
- `POST /api/subscriptions`
- `/api/subscriptions/intent`
- `/api/subscriptions/save-card`
- `/api/subscriptions/[id]/cancel`
- `/api/subscriptions/[id]/reactivate`
- `/api/subscriptions/billing-account/*`

## Remoções (segurança)

- `hooks/use-ultralinks-payment.tsx`
- `hooks/use-save-card.tsx`
- `services/billing/ultralinks.ts`
- Campos de cartão do BillingAccount
- Página de checkout atual (formulário de cartão)
- Rotas de intent e save-card
