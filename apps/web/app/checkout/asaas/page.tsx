"use client";

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import CheckoutAsaasPageContent from "./asaas-content";

export default function CheckoutAsaasPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Carregando...</div>}>
      <CheckoutAsaasPageContent />
    </Suspense>
  );
}
