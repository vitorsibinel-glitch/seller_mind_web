"use client";

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import PlansPageContent from "./plans-content";

export default function PlansPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Carregando...</div>}>
      <PlansPageContent />
    </Suspense>
  );
}
