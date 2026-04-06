/**
 * Next.js Instrumentation Hook — executa uma vez no boot do servidor.
 * Referência: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initBillingEmails } = await import("@workspace/billing");
    const apiKey = process.env.RESEND_API_KEY ?? "";

    if (apiKey) {
      initBillingEmails(apiKey);
    } else {
      console.warn(
        "[instrumentation] RESEND_API_KEY ausente — emails de billing desabilitados.",
      );
    }
  }
}
