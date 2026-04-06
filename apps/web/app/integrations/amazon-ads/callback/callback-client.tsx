"use client";

import { usePost } from "@/hooks/use-api";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AmazonAdsCallbackPage() {
  const params = useSearchParams();
  const router = useRouter();

  const { mutateAsync: connectingToAmazonAds } = usePost(
    "/api/integrations/amazon/ads/callback"
  );

  useEffect(() => {
    const code = params.get("code");
    const state = params.get("state");

    if (code && state) {
      connectingToAmazonAds({ code, state }).then(() => {
        const decodedState = Buffer.from(state, "base64").toString("utf-8");
        const parsedState = JSON.parse(decodedState);

        router.push(
          `/dashboard/settings/integrations/${parsedState.storeId}?connected=amazon_ads`
        );
      });
    }
  }, [params]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <p className="text-muted-foreground mb-4">
        Conectando sua conta Amazon Ads...
      </p>
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
    </div>
  );
}
