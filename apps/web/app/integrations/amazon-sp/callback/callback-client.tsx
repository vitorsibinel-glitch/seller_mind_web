"use client";

import { usePost } from "@/hooks/use-api";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AmazonSpCallbackPage() {
  const params = useSearchParams();
  const router = useRouter();

  const { mutateAsync: connectAmazonSp } = usePost(
    "/api/integrations/amazon/sp/callback"
  );

  useEffect(() => {
    const amazonCallbackUri = params.get("amazon_callback_uri");
    const amazonState = params.get("amazon_state");
    const sellingPartnerId = params.get("selling_partner_id");

    if (amazonCallbackUri && amazonState && sellingPartnerId) {
      connectAmazonSp({
        amazon_callback_uri: amazonCallbackUri,
        amazon_state: amazonState,
        selling_partner_id: sellingPartnerId,
      }).then(() => {
        router.push(`/dashboard/integrations?connected=amazon_sp`);
      });
    }
  }, [params]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <p className="text-muted-foreground mb-4">
        Conectando sua conta Amazon SP-API...
      </p>
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
}
