import { env } from "@/env";
import { Resend } from "resend";

export type SendMailParams = {
  from: string;
  to: string;
  subject: string;
  html: string;
};

export async function sendMail({ from, to, subject, html }: SendMailParams) {
  const resend = new Resend(env.RESEND_API_KEY);

  return resend.emails.send({
    from,
    to,
    subject,
    html,
  });
}
