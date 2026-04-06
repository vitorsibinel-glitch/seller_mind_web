import * as resend from "@/lib/resend";

export type SendMailParams = {
  to: string;
  subject: string;
  htmlContent: string;
};

export async function send({ to, subject, htmlContent }: SendMailParams) {
  await resend.sendMail({
    from: "Sellermind <no-reply@sellermind.com.br>",
    to,
    subject,
    html: htmlContent,
  });
}
