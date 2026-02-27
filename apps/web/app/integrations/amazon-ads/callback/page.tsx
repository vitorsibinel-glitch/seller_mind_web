import { Suspense } from "react";
import AmazonAdsCallbackPage from "./callback-client";

export default function Page() {
  return (
    <Suspense>
      <AmazonAdsCallbackPage />
    </Suspense>
  );
}
