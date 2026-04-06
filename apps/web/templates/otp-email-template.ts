const logoDataUri = "https://app.sellermind.com.br/images/logo_dark.png";

export function buildOtpTemplate(otp: string) {
  return `
  <!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#13131f;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#13131f;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background-color:#1c1c2e;border-radius:16px;overflow:hidden;border:1px solid #2a2a40;">
          
          <!-- Logo Header -->
          <tr>
            <td style="padding:36px 40px 0;text-align:center;">
              <img src="${logoDataUri}" alt="Sellermind" width="160" style="display:inline-block;height:auto;" />
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:24px 40px 0;">
              <div style="height:1px;background:linear-gradient(90deg,transparent,#7c3aed,transparent);"></div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px 40px 32px;">
              <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#f0f0ff;text-align:center;">
                Verificação de Login
              </h1>
              <p style="margin:0 0 6px;font-size:15px;color:#b0b0c8;line-height:1.6;">
                Recebemos uma solicitação de login na sua conta.
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#b0b0c8;line-height:1.6;">
                Use o código abaixo para continuar:
              </p>

              <!-- OTP Code Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="display:inline-block;padding:20px 44px;background:linear-gradient(135deg,#1e1e34,#25254a);border:1.5px solid #7c3aed;border-radius:12px;">
                      <span style="font-size:34px;font-weight:700;letter-spacing:12px;color:#ffffff;font-family:'Courier New',monospace;">
                        ${otp}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;font-size:14px;color:#b0b0c8;line-height:1.6;">
                Este código expira em <strong style="color:#a78bfa;">5 minutos</strong>.
              </p>
              <p style="margin:16px 0 0;font-size:13px;color:#6b6b88;line-height:1.5;">
                Se você não solicitou esse login, ignore este e-mail.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 28px;border-top:1px solid #2a2a40;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:#6b6b88;">
                &copy; 2026 Sellermind
              </p>
              <p style="margin:0;font-size:11px;color:#50506a;">
                Este é um e-mail automático. Não responda.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
