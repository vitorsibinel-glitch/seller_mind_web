import { Suspense } from "react";
import AmazonSpCallbackPage from "./callback-client";

export default function Page() {
  return (
    <Suspense>
      <AmazonSpCallbackPage />
    </Suspense>
  );
}
