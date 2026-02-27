"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { Header } from "@/components/header";
import { ProtectedRoute } from "@/components/protected-route";
import type { StoreDTO } from "@/dtos/store-dto";
import { useGet } from "@/hooks/use-api";
import {
  SidebarInset,
  SidebarProvider,
} from "@workspace/ui/components/sidebar";
import { useEffect, useState, type ReactNode } from "react";
import { useGlobalFilter } from "@/contexts/global-filter-context";
import type { GamificationResponseDTO } from "@/dtos/gamification-response-dto";
import { useAuth } from "@/contexts/auth-context";
import { SubscriptionGuard } from "@/components/subscription-guard";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { fetchUser } = useAuth();

  useEffect(() => {
    fetchUser();
  }, []);

  const { handleSelectedStoreId, selectedStoreId, handleIsStoreIntegrated } =
    useGlobalFilter();
  const [hasInitialized, setHasInitialized] = useState(false);

  const { data: storesData } = useGet<{ stores: StoreDTO[] }>("/api/stores");
  const stores = storesData?.stores ?? [];

  useEffect(() => {
    if (stores.length > 0 && !selectedStoreId && !hasInitialized) {
      handleSelectedStoreId(stores[0]!._id);
      setHasInitialized(true);
      handleIsStoreIntegrated(true);
    }
  }, [stores.length, selectedStoreId, hasInitialized]);

  const gamificationUrl = `/api/gamification/progress?storeId=${selectedStoreId}`;

  const { data: gamificationData } = useGet<GamificationResponseDTO>(
    gamificationUrl,
    {
      enabled: !!selectedStoreId,
      refetchInterval: false,
    },
  );

  return (
    <ProtectedRoute>
      <SubscriptionGuard>
        <SidebarProvider
          style={
            {
              "--sidebar-width": "calc(var(--spacing) * 72)",
              "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties
          }
        >
          <AppSidebar variant="inset" />
          <SidebarInset>
            <Header gamification={gamificationData} />
            <div className="flex flex-1 flex-col">
              <div className="@container/main flex flex-1 flex-col gap-2">
                <main className="flex flex-col gap-4 p-4 md:gap-6 md:py-6 lg:px-6 bg-card/10">
                  {children}
                </main>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </SubscriptionGuard>
    </ProtectedRoute>
  );
}
