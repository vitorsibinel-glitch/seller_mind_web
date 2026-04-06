import { Resend } from "resend";

const FROM = "Sellermind <noreply@sellermind.com.br>";

/** Injetado no bootstrap para evitar dependência circular com apps/web */
let resendInstance: Resend | null = null;

export function initBillingEmails(apiKey: string) {
  resendInstance = new Resend(apiKey);
}

async function send(to: string, subject: string, html: string) {
  if (!resendInstance) {
    console.warn("[billing.emails] Resend não inicializado — email não enviado.");
    return;
  }
  try {
    await resendInstance.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    // Email não bloqueia fluxo de billing — apenas loga
    console.error("[billing.emails] Falha ao enviar email:", err);
  }
}

// ─── Defaults ────────────────────────────────────────────────────────────────

function defaultTrialStartedHtml(firstName: string, trialDays: number) {
  return `<p>Olá, ${firstName}! Seu período de avaliação de ${trialDays} dias começou. Aproveite todos os recursos da plataforma.</p>`;
}

function defaultTrialEndingHtml(firstName: string, daysLeft: number) {
  return `<p>Olá, ${firstName}! Seu trial encerra em ${daysLeft} dia(s). Escolha um plano para continuar.</p>`;
}

function defaultTrialExpiredHtml(firstName: string) {
  return `<p>Olá, ${firstName}. Seu período de trial expirou. Assine um plano para recuperar o acesso.</p>`;
}

function defaultPaymentConfirmedHtml(firstName: string, planName: string, amount: number) {
  const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount / 100);
  return `<p>Olá, ${firstName}! Seu pagamento de ${fmt} foi confirmado. Plano ${planName} ativo.</p>`;
}

function defaultPaymentFailedHtml(firstName: string, toleranceDays: number) {
  return `<p>Olá, ${firstName}. Houve um problema com seu pagamento. Você tem ${toleranceDays} dias para regularizar antes da suspensão.</p>`;
}

function defaultSubscriptionSuspendedHtml(firstName: string) {
  return `<p>Olá, ${firstName}. Sua assinatura foi suspensa por falta de pagamento. Renove para recuperar o acesso.</p>`;
}

// ─── Funções públicas ─────────────────────────────────────────────────────────

export async function sendTrialStarted(
  to: string,
  firstName: string,
  trialDays: number,
  buildHtml?: (firstName: string, trialDays: number) => string,
) {
  const html = buildHtml
    ? buildHtml(firstName, trialDays)
    : defaultTrialStartedHtml(firstName, trialDays);
  await send(to, "Seu período de avaliação começou 🎉", html);
}

export async function sendTrialEnding(
  to: string,
  firstName: string,
  daysLeft: number,
  buildHtml?: (firstName: string, daysLeft: number) => string,
) {
  const subject =
    daysLeft <= 1
      ? "⚠️ Último dia do seu trial — escolha um plano"
      : `Seu trial encerra em ${daysLeft} dias`;
  const html = buildHtml
    ? buildHtml(firstName, daysLeft)
    : defaultTrialEndingHtml(firstName, daysLeft);
  await send(to, subject, html);
}

export async function sendTrialExpired(
  to: string,
  firstName: string,
  buildHtml?: (firstName: string) => string,
) {
  const html = buildHtml
    ? buildHtml(firstName)
    : defaultTrialExpiredHtml(firstName);
  await send(to, "Seu trial expirou — escolha um plano", html);
}

export async function sendPaymentConfirmed(
  to: string,
  firstName: string,
  planName: string,
  amount: number,
  buildHtml?: (firstName: string, planName: string, amount: number) => string,
) {
  const html = buildHtml
    ? buildHtml(firstName, planName, amount)
    : defaultPaymentConfirmedHtml(firstName, planName, amount);
  await send(to, "Pagamento confirmado ✓", html);
}

export async function sendPaymentFailed(
  to: string,
  firstName: string,
  toleranceDays: number,
  buildHtml?: (firstName: string, toleranceDays: number) => string,
) {
  const html = buildHtml
    ? buildHtml(firstName, toleranceDays)
    : defaultPaymentFailedHtml(firstName, toleranceDays);
  await send(to, "⚠️ Problema com seu pagamento", html);
}

export async function sendSubscriptionSuspended(
  to: string,
  firstName: string,
  buildHtml?: (firstName: string) => string,
) {
  const html = buildHtml
    ? buildHtml(firstName)
    : defaultSubscriptionSuspendedHtml(firstName);
  await send(to, "Sua assinatura foi suspensa", html);
}
