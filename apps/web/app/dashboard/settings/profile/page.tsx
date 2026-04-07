"use client";

import React, { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  Mail,
  User,
  Phone,
  Loader2,
  CreditCard,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  ShoppingCart,
  Store,
  Users,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useDelete, useGet, usePatch } from "@/hooks/use-api";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateProfileSchema,
  type UpdateProfileFormData,
} from "@/schemas/updateProfileSchema";
import type { UserDTO } from "@/dtos/user-dto";
import {
  SubscriptionStatus,
  type SubscriptionInfoDTO,
  type SubscriptionInfoResponse,
} from "@/dtos/subscription-info-dto";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
}

const statusConfig: Record<
  SubscriptionStatus,
  {
    label: string;
    icon: React.ElementType;
    badgeClass: string;
  }
> = {
  [SubscriptionStatus.ACTIVE]: {
    label: "Ativa",
    icon: CheckCircle2,
    badgeClass: "bg-success/10 text-success border-success/20",
  },
  [SubscriptionStatus.TRIALING]: {
    label: "Em avaliação",
    icon: Clock,
    badgeClass: "bg-info/10 text-info border-info/20",
  },
  [SubscriptionStatus.PAST_DUE]: {
    label: "Pagamento pendente",
    icon: AlertTriangle,
    badgeClass: "bg-warning/10 text-warning border-warning/20",
  },
  [SubscriptionStatus.SUSPENDED]: {
    label: "Suspensa",
    icon: AlertTriangle,
    badgeClass: "bg-warning/10 text-warning border-warning/20",
  },
  [SubscriptionStatus.CANCELED]: {
    label: "Cancelada",
    icon: XCircle,
    badgeClass: "bg-danger/10 text-danger border-danger/20",
  },
  [SubscriptionStatus.EXPIRED]: {
    label: "Expirada",
    icon: XCircle,
    badgeClass: "bg-danger/10 text-danger border-danger/20",
  },
};

interface UsageResponse {
  usage: { ordersThisPeriod: number; storesCount: number; usersCount: number };
  limits: { maxOrders: number | null; stores: number | null; users: number | null; gamificationBonus: number | null };
}

function UsageBar({ used, max }: { used: number; max: number | null }) {
  if (!max) return null;
  const pct = Math.min(100, Math.round((used / max) * 100));
  const color = pct >= 90 ? "bg-destructive" : pct >= 70 ? "bg-warning" : "bg-primary";
  return (
    <div className="w-full mt-1">
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground">{pct}%</span>
    </div>
  );
}

function PlanUsageCard({ subscription }: { subscription: SubscriptionInfoDTO }) {
  const { data, isLoading } = useGet<UsageResponse>("/api/subscriptions/usage");

  const limits = subscription.planId.limits;

  const items = [
    {
      icon: ShoppingCart,
      label: "Pedidos/período",
      used: data?.usage.ordersThisPeriod ?? null,
      max: data?.limits.maxOrders ?? null,
      fallback: limits.maxOrders ? limits.maxOrders.toLocaleString("pt-BR") : "Ilimitado",
    },
    {
      icon: Store,
      label: "Lojas",
      used: data?.usage.storesCount ?? null,
      max: data?.limits.stores ?? null,
      fallback: limits.stores ? String(limits.stores) : "Ilimitado",
    },
    {
      icon: Users,
      label: "Usuários",
      used: data?.usage.usersCount ?? null,
      max: data?.limits.users ?? null,
      fallback: limits.users ? String(limits.users) : "Ilimitado",
    },
    ...(limits.gamificationBonus
      ? [{ icon: Zap, label: "Bônus Gamificação", used: null, max: null, fallback: `+${limits.gamificationBonus}%` }]
      : []),
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <Card className="shadow-md rounded-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-border/60">
          <h3 className="text-base font-semibold">Uso do Plano</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Plano {subscription.planId.name} — período atual
          </p>
        </div>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {items.map(({ icon: Icon, label, used, max, fallback }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl bg-muted/50 text-center"
                >
                  <Icon size={18} className="text-primary" />
                  <span className="text-lg font-bold tabular-nums">
                    {used !== null && max !== null
                      ? `${used.toLocaleString("pt-BR")} / ${max.toLocaleString("pt-BR")}`
                      : used !== null
                        ? used.toLocaleString("pt-BR")
                        : fallback}
                  </span>
                  <span className="text-xs text-muted-foreground">{label}</span>
                  {used !== null && <UsageBar used={used} max={max} />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SubscriptionSection({
  subscription,
  refetch,
}: {
  subscription: SubscriptionInfoDTO;
  refetch: () => void;
}) {
  const router = useRouter();
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);
  const [reactivateDialogOpen, setReactivateDialogOpen] = React.useState(false);
  const config = statusConfig[subscription.status];
  const StatusIcon = config.icon;

  const isCancelable =
    subscription.status === SubscriptionStatus.ACTIVE ||
    subscription.status === SubscriptionStatus.TRIALING;

  const price =
    subscription.billingCycle === "monthly"
      ? subscription.planId.prices.monthly
      : subscription.planId.prices.annual;

  const periodEndLabel = subscription.trialEnd
    ? "Fim do período de teste"
    : "Vigente até";

  const periodEndDate = subscription.trialEnd ?? subscription.currentPeriodEnd;

  const { mutate: cancelSubscription, isPending: isCanceling } = useDelete();

  const isReactivatable = subscription.status === SubscriptionStatus.CANCELED;

  const { mutate: reactivateSubscription, isPending: isReactivating } =
    usePatch<{ checkoutUrl?: string; redirectTo?: string }>({
      onSuccess: async (data) => {
        setReactivateDialogOpen(false);
        if (data?.checkoutUrl) {
          window.location.href = data.checkoutUrl;
          return;
        }
        if (data?.redirectTo) {
          router.push(data.redirectTo);
          return;
        }
        toast.success("Assinatura reativada com sucesso!");
        await refetch();
      },
      onError: () => {
        toast.error("Erro ao reativar assinatura. Tente novamente.");
      },
    });

  const handleReactivate = () => {
    reactivateSubscription({
      url: `/api/subscriptions/${subscription._id}/reactivate`,
    });
  };

  const handleCancelConfirm = () => {
    cancelSubscription(
      { url: `/api/subscriptions/${subscription._id}/cancel` },
      {
        onSuccess: async () => {
          toast.success("Assinatura cancelada com sucesso.");
          setCancelDialogOpen(false);
          await refetch();
        },
        onError: () => {
          toast.error("Erro ao cancelar assinatura. Tente novamente.");
        },
      },
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <Card className="shadow-md rounded-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-border/60">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-muted">
                <CreditCard size={20} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  Assinatura
                </p>
                <h3 className="text-lg font-semibold leading-tight">
                  Plano {subscription.planId.name}
                </h3>
              </div>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${config.badgeClass}`}
            >
              <StatusIcon size={12} />
              {config.label}
            </span>
          </div>
        </div>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Valor
              </span>
              <span className="text-2xl font-bold tabular-nums">
                {formatCurrency(price)}
              </span>
              <span className="text-xs text-muted-foreground">
                {subscription.billingCycle === "monthly"
                  ? "por mês"
                  : "por ano"}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Próxima cobrança
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <Calendar
                  size={15}
                  className="text-muted-foreground shrink-0"
                />
                <span className="text-sm font-medium">
                  {subscription.status === SubscriptionStatus.CANCELED ||
                  subscription.status === SubscriptionStatus.EXPIRED
                    ? "—"
                    : formatDate(subscription.nextBillingDate)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                {periodEndLabel}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <Calendar
                  size={15}
                  className="text-muted-foreground shrink-0"
                />
                <span className="text-sm font-medium">
                  {formatDate(periodEndDate)}
                </span>
              </div>
            </div>
          </div>

          {subscription.status === SubscriptionStatus.PAST_DUE && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 mb-6">
              <AlertTriangle
                size={16}
                className="text-amber-600 mt-0.5 shrink-0"
              />
              <p className="text-sm text-amber-800">
                Há um problema com seu pagamento. Por favor, atualize seu método
                de pagamento para evitar a suspensão do plano.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-border/60 flex-wrap gap-3">
            <p className="text-xs text-muted-foreground max-w-sm">
              {isCancelable
                ? "Ao cancelar, você manterá acesso ao plano até o fim do período atual."
                : isReactivatable
                  ? "Sua assinatura está cancelada. Reative para voltar a ter acesso ao plano."
                  : "Esta assinatura não pode ser cancelada no momento."}
            </p>

            {isReactivatable && (
              <>
                <Button
                  type="button"
                  disabled={isReactivating}
                  onClick={() => setReactivateDialogOpen(true)}
                >
                  Renovar Assinatura
                </Button>

                <Dialog
                  open={reactivateDialogOpen}
                  onOpenChange={setReactivateDialogOpen}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reativar assinatura?</DialogTitle>
                      <DialogDescription asChild>
                        <div className="space-y-3 pt-1">
                          <p>
                            Tem certeza que deseja reativar sua assinatura do{" "}
                            <strong>Plano {subscription.planId.name}</strong>?
                          </p>
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted">
                            <Calendar
                              size={15}
                              className="text-muted-foreground mt-0.5 shrink-0"
                            />
                            <p className="text-sm text-muted-foreground">
                              Sua assinatura será reativada imediatamente. A
                              cobrança de{" "}
                              <strong className="text-foreground">
                                {formatCurrency(price)}
                              </strong>{" "}
                              será realizada conforme o ciclo{" "}
                              <strong className="text-foreground">
                                {subscription.billingCycle === "monthly"
                                  ? "mensal"
                                  : "anual"}
                              </strong>{" "}
                              do plano.
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Você voltará a ter acesso a todos os recursos do
                            plano assim que a reativação for concluída.
                          </p>
                        </div>
                      </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        disabled={isReactivating}
                        onClick={() => setReactivateDialogOpen(false)}
                      >
                        Voltar
                      </Button>
                      <Button
                        disabled={isReactivating}
                        onClick={handleReactivate}
                      >
                        {isReactivating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Reativando...
                          </>
                        ) : (
                          "Sim, reativar assinatura"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}

            {isCancelable && (
              <>
                <Button
                  variant="outline"
                  className="bg-danger/10 text-danger border-danger/20 hover:bg-danger/20 hover:text-danger hover:border-danger/30"
                  type="button"
                  onClick={() => setCancelDialogOpen(true)}
                >
                  Cancelar Assinatura
                </Button>

                <Dialog
                  open={cancelDialogOpen}
                  onOpenChange={setCancelDialogOpen}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cancelar assinatura?</DialogTitle>
                      <DialogDescription asChild>
                        <div className="space-y-3 pt-1">
                          <p>
                            Tem certeza que deseja cancelar sua assinatura do{" "}
                            <strong>Plano {subscription.planId.name}</strong>?
                          </p>
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted">
                            <Calendar
                              size={15}
                              className="text-muted-foreground mt-0.5 shrink-0"
                            />
                            <p className="text-sm text-muted-foreground">
                              Você continuará tendo acesso a todos os recursos
                              do plano até{" "}
                              <strong className="text-foreground">
                                {formatDate(periodEndDate)}
                              </strong>
                              . Após essa data, sua conta será downgraded
                              automaticamente.
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Esta ação não pode ser desfeita. Você precisará
                            fazer uma nova assinatura caso queira reativar o
                            plano.
                          </p>
                        </div>
                      </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        disabled={isCanceling}
                        onClick={() => setCancelDialogOpen(false)}
                      >
                        Manter assinatura
                      </Button>
                      <Button
                        className="bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 hover:text-danger shadow-none"
                        disabled={isCanceling}
                        onClick={handleCancelConfirm}
                      >
                        {isCanceling ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Cancelando...
                          </>
                        ) : (
                          "Sim, cancelar assinatura"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsProfile() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = React.useState(false);

  const {
    data: userData,
    isLoading,
    refetch,
  } = useGet<{ user: UserDTO }>("/api/users/me");

  const {
    data: subscriptionData,
    isLoading: isSubscriptionLoading,
    refetch: refetchSubscription,
  } = useGet<SubscriptionInfoResponse>("/api/subscriptions/me");

  const subscription = subscriptionData?.data;

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      document: "",
      avatarUrl: "",
    },
  });

  const { mutate: updateProfile, isPending } = usePatch({
    onSuccess: async () => {
      toast.success("Perfil atualizado com sucesso!");
      setIsEditing(false);
      await refetch();
    },
    onError: () => {
      console.error("Erro ao atualizar perfil");
      toast.error("Erro ao atualizar perfil. Tente novamente.");
    },
  });

  useEffect(() => {
    if (userData?.user) {
      reset({
        firstName: userData.user.firstName || "",
        lastName: userData.user.lastName || "",
        phone: userData.user.phone || "",
        email: userData.user.email || "",
        document: userData.user.document || "",
        avatarUrl: userData.user.avatarUrl || "",
      });
    }
  }, [userData, reset]);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 10) {
      return numbers
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }
    return numbers
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

  const formatDocument = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return numbers
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    reset({ ...watch(), avatarUrl: url });
  };

  const onSubmit = (data: UpdateProfileFormData) => {
    updateProfile({ url: `/api/users/${userData?.user._id}`, data });
  };

  const handleStartEdit = () => setIsEditing(true);

  const handleCancel = () => {
    setIsEditing(false);
    if (userData?.user) {
      reset({
        firstName: userData.user.firstName || "",
        lastName: userData.user.lastName || "",
        phone: userData.user.phone || "",
        email: userData.user.email || "",
        document: userData.user.document || "",
        avatarUrl: userData.user.avatarUrl || "",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isSaving = isSubmitting || isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meu Perfil"
        description="Gerencie seus dados de perfil"
      />

      <div className="w-full max-w-4xl mx-auto px-4">
        <Card className="p-6 shadow-md rounded-2xl">
          <div>
            <div className="flex justify-center mb-6">
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
            </div>

            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm mb-4 block">Nome</label>
                <div className="relative flex items-center">
                  <User
                    className="absolute left-3 text-muted-foreground"
                    size={16}
                  />
                  <Controller
                    name="firstName"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        disabled={!isEditing}
                        className="pl-10"
                        placeholder="Seu nome"
                      />
                    )}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm mb-4 block">Sobrenome</label>
                <Controller
                  name="lastName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      disabled={!isEditing}
                      className="pl-3"
                      placeholder="Seu sobrenome"
                    />
                  )}
                />
              </div>

              <div>
                <label className="text-sm mb-4 block">Celular</label>
                <div className="relative flex items-center">
                  <Phone
                    className="absolute left-3 text-muted-foreground"
                    size={16}
                  />
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        disabled={!isEditing}
                        className="pl-10"
                        placeholder="(00) 00000-0000"
                        onChange={(e) => {
                          const formatted = formatPhone(e.target.value);
                          field.onChange(formatted);
                        }}
                      />
                    )}
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm mb-4 block">Email</label>
                <div className="relative flex items-center">
                  <Mail
                    className="absolute left-3 text-muted-foreground"
                    size={16}
                  />
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        disabled={!isEditing}
                        className="pl-10"
                        placeholder="seu@email.com"
                      />
                    )}
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm mb-4 block">CPF/CNPJ</label>
                <div className="relative flex items-center">
                  <User
                    className="absolute left-3 text-muted-foreground"
                    size={16}
                  />
                  <Controller
                    name="document"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        disabled={!isEditing}
                        className="pl-10"
                        placeholder="000.000.000-00"
                        onChange={(e) => {
                          const formatted = formatDocument(e.target.value);
                          field.onChange(formatted);
                        }}
                      />
                    )}
                  />
                </div>
              </div>
            </CardContent>

            <div className="flex gap-2 md:col-span-2 ml-6 mt-6">
              {!isEditing ? (
                <Button type="button" onClick={handleStartEdit}>
                  Editar
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleSubmit(onSubmit, (errors) => {
                      console.log("validation errors", errors);
                      toast.error("Verifique os campos do formulário.");
                    })}
                    disabled={isSaving}
                    className="bg-primary"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar"
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    Cancelar
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>

      {isSubscriptionLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : subscription ? (
        <>
          <PlanUsageCard subscription={subscription} />
          <SubscriptionSection
            subscription={subscription}
            refetch={refetchSubscription}
          />
        </>
      ) : null}
    </div>
  );
}
