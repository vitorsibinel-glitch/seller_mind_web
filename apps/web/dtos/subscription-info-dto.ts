export enum BillingCycle {
  MONTHLY = "monthly",
  ANNUAL = "annual",
}

export enum SubscriptionStatus {
  TRIALING = "trialing",
  ACTIVE = "active",
  PAST_DUE = "past_due",
  CANCELED = "canceled",
  EXPIRED = "expired",
  SUSPENDED = "suspended",
}

export enum PlanTier {
  BASIC = "basic",
  ADVANCED = "advanced",
}

export interface PlanDTO {
  _id: string;
  name: string;
  slug: string;
  tier: PlanTier;
  description: string;
  features: string[];
  prices: {
    monthly: number;
    annual: number;
  };
  currency: string;
  isActive: boolean;
  trialDays: number;
  sortOrder: number;
  isPopular: boolean;
  limits: {
    maxOrders?: number;
    gamificationBonus?: number;
    users?: number;
    stores?: number;
    storage?: number;
    apiCalls?: number;
  };
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface BillingAccountDTO {
  _id: string;
  userId: string;
  name: string;
  email: string;
  document: string;
  phone?: string;
  paymentGatewayId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface SubscriptionInfoDTO {
  _id: string;
  billingAccountId: BillingAccountDTO;
  planId: PlanDTO;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEnd?: string;
  canceledAt?: string;
  cancelReason?: string;
  nextBillingDate: string;
  priceAtSubscription: number;
  retryCount: number;
  lastPaymentAttempt?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface SubscriptionInfoResponse {
  data: SubscriptionInfoDTO;
}
