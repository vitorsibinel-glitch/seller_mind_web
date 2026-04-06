import type { Subscription } from "@workspace/mongodb/models/subscription";
import { SubscriptionStatus } from "@workspace/mongodb/models/subscription";

const TRIAL_GRACE_DAYS = 3;
const PAYMENT_TOLERANCE_DAYS = 5;

export type AccessStatus =
  | "trialing"
  | "trial_grace"
  | "active"
  | "past_due_tolerance"
  | "expired"
  | "past_due"
  | "suspended"
  | "canceled";

export interface AccessResult {
  hasAccess: boolean;
  status: AccessStatus;
  trialEnd?: Date;
  gracePeriodEnd?: Date;
  tolerancePeriodEnd?: Date;
  currentPeriodEnd?: Date;
  planId?: unknown;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Verifica se uma subscription tem acesso ativo, considerando períodos de tolerância.
 * Função pura — não acessa o banco de dados.
 *
 * Tolera campos gracePeriodEnd/tolerancePeriodEnd não populados:
 * calcula on-the-fly a partir das datas de referência.
 */
export function checkAccess(subscription: Subscription): AccessResult {
  const now = new Date();

  switch (subscription.status) {
    case SubscriptionStatus.TRIALING: {
      const trialEnd = subscription.trialEnd;

      if (trialEnd && trialEnd > now) {
        return {
          hasAccess: true,
          status: "trialing",
          trialEnd,
          planId: subscription.planId,
        };
      }

      // Calcula gracePeriodEnd on-the-fly se não estiver salvo no documento
      const gracePeriodEnd =
        subscription.gracePeriodEnd ??
        (trialEnd ? addDays(trialEnd, TRIAL_GRACE_DAYS) : null);

      if (gracePeriodEnd && gracePeriodEnd > now) {
        return {
          hasAccess: true,
          status: "trial_grace",
          trialEnd,
          gracePeriodEnd,
          planId: subscription.planId,
        };
      }

      return {
        hasAccess: false,
        status: "expired",
        planId: subscription.planId ?? null,
      };
    }

    case SubscriptionStatus.ACTIVE: {
      return {
        hasAccess: true,
        status: "active",
        currentPeriodEnd: subscription.currentPeriodEnd,
        planId: subscription.planId,
      };
    }

    case SubscriptionStatus.PAST_DUE: {
      // Calcula tolerancePeriodEnd on-the-fly se não estiver salvo
      const tolerancePeriodEnd =
        subscription.tolerancePeriodEnd ??
        (subscription.lastPaymentAttempt
          ? addDays(subscription.lastPaymentAttempt, PAYMENT_TOLERANCE_DAYS)
          : null);

      if (tolerancePeriodEnd && tolerancePeriodEnd > now) {
        return {
          hasAccess: true,
          status: "past_due_tolerance",
          tolerancePeriodEnd,
          planId: subscription.planId,
        };
      }

      return {
        hasAccess: false,
        status: "past_due",
        planId: subscription.planId ?? null,
      };
    }

    case SubscriptionStatus.SUSPENDED:
      return {
        hasAccess: false,
        status: "suspended",
        planId: subscription.planId ?? null,
      };

    case SubscriptionStatus.CANCELED:
      return {
        hasAccess: false,
        status: "canceled",
        planId: subscription.planId ?? null,
      };

    case SubscriptionStatus.EXPIRED:
      return {
        hasAccess: false,
        status: "expired",
        planId: subscription.planId ?? null,
      };

    default:
      return { hasAccess: false, status: "canceled", planId: null };
  }
}
