"use client";

import { useGet } from "@/hooks/use-api";
import { Loader2 } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { useState } from "react";

interface TierData {
  index: number;
  targetAmount: number;
  name: string;
  badge: string;
  color: string;
  storeCount: number;
  userCount: number;
  totalAchievements: number;
}

interface TopStore {
  storeName: string;
  storeId: string;
  highestTier: number;
  ownerEmail: string;
}

interface UserInTier {
  userId: string;
  userEmail: string;
  storeCount: number;
  highestAchievement: number;
}

interface GamificationResponse {
  tiers: TierData[];
  topStores: TopStore[];
}

interface TierUsersResponse {
  users: UserInTier[];
  total: number;
  targetAmount: number;
}

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function TierUsersPanel({
  tier,
  onClose,
}: {
  tier: TierData;
  onClose: () => void;
}) {
  const { data, isLoading } = useGet<TierUsersResponse>(
    `/api/admin/gamification/users?targetAmount=${tier.targetAmount}`,
  );

  return (
    <div className="mt-4 rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{tier.badge}</span>
          <div>
            <p className="font-semibold text-sm">{tier.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatBRL(tier.targetAmount)} — usuários que atingiram este nível
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Fechar ✕
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : !data?.users.length ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          Nenhum usuário atingiu este nível ainda.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Lojas</TableHead>
              <TableHead className="text-right">Maior nível (R$)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.users.map((u) => (
              <TableRow key={u.userId}>
                <TableCell className="text-sm">{u.userEmail}</TableCell>
                <TableCell className="text-right text-sm">{u.storeCount}</TableCell>
                <TableCell className="text-right text-sm">
                  {formatBRL(u.highestAchievement)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

export default function AdminGamificationPage() {
  const { data, isLoading } = useGet<GamificationResponse>(
    "/api/admin/gamification",
  );
  const [selectedTier, setSelectedTier] = useState<TierData | null>(null);

  const totalStoresInSystem = data?.tiers.reduce(
    (acc, t) => Math.max(acc, t.storeCount),
    0,
  ) ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Gamificação</h1>
        <p className="text-sm text-muted-foreground">
          Distribuição de usuários e lojas por nível de gamificação
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Grade de tiers */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {data?.tiers.map((tier) => (
              <button
                key={tier.targetAmount}
                onClick={() =>
                  setSelectedTier(
                    selectedTier?.targetAmount === tier.targetAmount
                      ? null
                      : tier,
                  )
                }
                className={`rounded-xl border p-4 text-left transition-all hover:border-primary/50 ${
                  selectedTier?.targetAmount === tier.targetAmount
                    ? "border-primary bg-primary/5"
                    : "bg-card"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-2xl">{tier.badge}</span>
                  <Badge
                    className="text-xs shrink-0"
                    style={{
                      backgroundColor: `${tier.color}20`,
                      color: tier.color,
                      border: `1px solid ${tier.color}40`,
                    }}
                  >
                    {formatBRL(tier.targetAmount)}
                  </Badge>
                </div>
                <p className="mt-2 text-sm font-medium leading-tight">
                  {tier.name}
                </p>
                <div className="mt-2 space-y-0.5">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {tier.storeCount}
                    </span>{" "}
                    {tier.storeCount === 1 ? "loja" : "lojas"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {tier.userCount}
                    </span>{" "}
                    {tier.userCount === 1 ? "usuário" : "usuários"}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Painel de usuários do tier selecionado */}
          {selectedTier && (
            <TierUsersPanel
              tier={selectedTier}
              onClose={() => setSelectedTier(null)}
            />
          )}

          {/* Top 10 stores */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Top 10 Lojas por Nível
            </h2>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Loja</TableHead>
                    <TableHead>Proprietário</TableHead>
                    <TableHead>Nível mais alto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!data?.topStores.length ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground py-8"
                      >
                        Nenhuma loja atingiu metas ainda
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.topStores.map((store, i) => {
                      const tier = data.tiers.find(
                        (t) => t.targetAmount === store.highestTier,
                      );
                      return (
                        <TableRow key={store.storeId}>
                          <TableCell className="text-muted-foreground text-sm w-8">
                            {i + 1}
                          </TableCell>
                          <TableCell className="font-medium text-sm">
                            {store.storeName}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {store.ownerEmail}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{tier?.badge ?? "—"}</span>
                              <div>
                                <p className="text-sm font-medium">
                                  {tier?.name ?? formatBRL(store.highestTier)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatBRL(store.highestTier)}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
