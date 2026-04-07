const LOGO = "https://app.sellermind.com.br/images/logo_dark.png";
const APP_URL = "https://app.sellermind.com.br";

function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#13131f;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#13131f;padding:40px 20px;">
    <tr><td align="center">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0"
        style="background-color:#1c1c2e;border-radius:16px;overflow:hidden;border:1px solid #2a2a40;">
        <tr>
          <td style="padding:36px 40px 0;text-align:center;">
            <img src="${LOGO}" alt="Sellermind" width="160" style="display:inline-block;height:auto;" />
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px 0;">
            <div style="height:1px;background:linear-gradient(90deg,transparent,#7c3aed,transparent);"></div>
          </td>
        </tr>
        ${content}
        <tr>
          <td style="padding:20px 40px 28px;border-top:1px solid #2a2a40;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;color:#6b6b88;">&copy; 2026 Sellermind</p>
            <p style="margin:0;font-size:11px;color:#50506a;">Este é um e-mail automático. Não responda.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildTrialStartedTemplate(firstName: string, trialDays: number): string {
  return baseLayout(`
    <tr><td style="padding:32px 40px;">
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#f0f0ff;text-align:center;">
        Bem-vindo ao Sellermind! 🎉
      </h1>
      <p style="margin:0 0 16px;font-size:15px;color:#b0b0c8;line-height:1.6;">
        Olá, <strong style="color:#f0f0ff;">${firstName}</strong>!
      </p>
      <p style="margin:0 0 16px;font-size:15px;color:#b0b0c8;line-height:1.6;">
        Seu período de avaliação gratuita de <strong style="color:#a78bfa;">${trialDays} dias</strong> começou agora.
        Explore todas as funcionalidades sem precisar de cartão de crédito.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="padding:16px 0;">
          <a href="${APP_URL}/dashboard" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;">
            Acessar o Dashboard
          </a>
        </td></tr>
      </table>
      <p style="margin:16px 0 0;font-size:13px;color:#6b6b88;line-height:1.5;">
        Ao final do período, escolha um plano para continuar usando.
      </p>
    </td></tr>`);
}

export function buildTrialEndingTemplate(firstName: string, daysLeft: number): string {
  return baseLayout(`
    <tr><td style="padding:32px 40px;">
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#f0f0ff;text-align:center;">
        Seu trial encerra em ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"}
      </h1>
      <p style="margin:0 0 16px;font-size:15px;color:#b0b0c8;line-height:1.6;">
        Olá, <strong style="color:#f0f0ff;">${firstName}</strong>!
      </p>
      <p style="margin:0 0 16px;font-size:15px;color:#b0b0c8;line-height:1.6;">
        Seu período de avaliação está quase encerrando. Escolha um plano agora para não perder o acesso.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="padding:16px 0;">
          <a href="${APP_URL}/plans" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;">
            Escolher Plano
          </a>
        </td></tr>
      </table>
    </td></tr>`);
}

export function buildPaymentConfirmedTemplate(firstName: string, planName: string, amount: number): string {
  const formatted = amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  return baseLayout(`
    <tr><td style="padding:32px 40px;">
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#f0f0ff;text-align:center;">
        Pagamento confirmado ✓
      </h1>
      <p style="margin:0 0 16px;font-size:15px;color:#b0b0c8;line-height:1.6;">
        Olá, <strong style="color:#f0f0ff;">${firstName}</strong>!
      </p>
      <p style="margin:0 0 16px;font-size:15px;color:#b0b0c8;line-height:1.6;">
        Recebemos seu pagamento de <strong style="color:#a78bfa;">${formatted}</strong>
        referente ao <strong style="color:#f0f0ff;">Plano ${planName}</strong>.
        Sua assinatura está ativa.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="padding:16px 0;">
          <a href="${APP_URL}/dashboard" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;">
            Ir para o Dashboard
          </a>
        </td></tr>
      </table>
    </td></tr>`);
}

export function buildPaymentFailedTemplate(firstName: string, toleranceDays: number): string {
  return baseLayout(`
    <tr><td style="padding:32px 40px;">
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#f0f0ff;text-align:center;">
        Problema com seu pagamento
      </h1>
      <p style="margin:0 0 16px;font-size:15px;color:#b0b0c8;line-height:1.6;">
        Olá, <strong style="color:#f0f0ff;">${firstName}</strong>!
      </p>
      <p style="margin:0 0 16px;font-size:15px;color:#b0b0c8;line-height:1.6;">
        Não conseguimos processar seu pagamento. Você tem <strong style="color:#f87171;">${toleranceDays} dias</strong>
        para regularizar antes de seu acesso ser suspenso.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="padding:16px 0;">
          <a href="${APP_URL}/plans" style="display:inline-block;padding:14px 32px;background:#dc2626;color:#fff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;">
            Regularizar Pagamento
          </a>
        </td></tr>
      </table>
      <p style="margin:16px 0 0;font-size:13px;color:#6b6b88;line-height:1.5;">
        Se você já regularizou, ignore este e-mail.
      </p>
    </td></tr>`);
}
