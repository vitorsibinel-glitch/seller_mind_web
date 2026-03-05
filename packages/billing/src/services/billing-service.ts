/* eslint-disable @typescript-eslint/no-explicit-any */
import { SubscriptionModel } from "@workspace/mongodb/models/subscription";
import { PlanModel } from "@workspace/mongodb/models/plan";
import type { BillingCycle } from "@workspace/mongodb/models/subscription";

function addPeriod(date: Date, cycle: BillingCycle): Date {
  const d = new Date(date);
  if (cycle === "annual") {
    d.setFullYear(d.getFullYear() + 1);
  } else {
    d.setMonth(d.getMonth() + 1);
  }
  return d;
}

export const BillingService = {
  async createSubscription(
    customerId: string,
    planId: string,
    billingCycle: BillingCycle,
  ): Promise<any> {
    const plan = await PlanModel.findById(planId).lean();
    if (!plan) throw new Error("Plano não encontrado");

    const now = new Date();
    const periodEnd = addPeriod(now, billingCycle);

    const price =
      billingCycle === "annual"
        ? (plan as any).annualPrice ?? (plan as any).price
        : (plan as any).monthlyPrice ?? (plan as any).price;

    const subscription = await SubscriptionModel.create({
      billingAccountId: customerId,
      planId,
      status: "active",
      billingCycle,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      nextBillingDate: periodEnd,
      priceAtSubscription: price ?? 0,
      retryCount: 0,
    });

    return subscription.toObject();
  },

  async cancelSubscription(subscriptionId: string, reason?: string): Promise<any> {
    const subscription = await SubscriptionModel.findByIdAndUpdate(
      subscriptionId,
      {
        status: "canceled",
        canceledAt: new Date(),
        cancelReason: reason,
      },
      { new: true },
    ).lean();

    if (!subscription) throw new Error("Assinatura não encontrada");
    return subscription;
  },

  async reactivateSubscription(subscriptionId: string): Promise<any> {
    const subscription = await SubscriptionModel.findByIdAndUpdate(
      subscriptionId,
      {
        status: "active",
        canceledAt: null,
        cancelReason: null,
      },
      { new: true },
    ).lean();

    if (!subscription) throw new Error("Assinatura não encontrada");
    return subscription;
  },

  async getSubscriptionsByCustomer(billingAccountId: string): Promise<any[]> {
    return SubscriptionModel.find({ billingAccountId }).lean();
  },
};
