// /**
//  * Seed: Billing Workers Test
//  *
//  * Cria usuários, billing accounts e assinaturas em todos os status possíveis
//  * para cobrir todos os cenários dos workers:
//  *   - daily-billing          → assinaturas ACTIVE com nextBillingDate <= hoje
//  *   - retry-failed-payments  → assinaturas PAST_DUE com retryCount < limite
//  *   - expire-overdue         → assinaturas PAST_DUE/SUSPENDED com currentPeriodEnd vencido
//  */

// import { withDB } from "@/lib/mongoose";
// import { UserModel } from "@workspace/mongodb/models/user";
// import { BillingAccountModel } from "@workspace/mongodb/models/billing-account";
// import {
//   SubscriptionModel,
//   BillingCycle,
//   SubscriptionStatus,
// } from "@workspace/mongodb/models/subscription";
// import { NextResponse } from "next/server";
// import argon2 from "argon2";

// // ─── Helpers ────────────────────────────────────────────────────────────────

// function daysAgo(n: number) {
//   const d = new Date();
//   d.setDate(d.getDate() - n);
//   return d;
// }

// function daysFromNow(n: number) {
//   const d = new Date();
//   d.setDate(d.getDate() + n);
//   return d;
// }

// // ─── Seed data ───────────────────────────────────────────────────────────────

// /**
//  * Cada entrada representa um cenário de teste.
//  * O planId abaixo é um ObjectId fictício – substitua pelo ID real do seu banco.
//  */
// const PLAN_ID = "6995bd9c85c7c67f6aae26fe"; // <- ajuste conforme necessário

// interface ScenarioUser {
//   firstName: string;
//   // lastName: string;
//   email: string;
// }

// interface ScenarioSubscription {
//   status: SubscriptionStatus;
//   billingCycle: BillingCycle;
//   currentPeriodStart: Date;
//   currentPeriodEnd: Date;
//   nextBillingDate: Date;
//   priceAtSubscription: number;
//   retryCount?: number;
//   lastPaymentAttempt?: Date;
//   trialEnd?: Date;
//   canceledAt?: Date;
//   cancelReason?: string;
// }

// interface Scenario {
//   label: string;
//   user: ScenarioUser;
//   subscription: ScenarioSubscription;
// }

// const scenarios: Scenario[] = [
//   // ── daily-billing: cobrar hoje ──────────────────────────────────────────
//   {
//     label: "ACTIVE - due today (deve ser cobrado pelo daily-billing)",
//     user: {
//       firstName: "Alice",
//       lastName: "DueToday",
//       email: "alice.duetoday@test.com",
//     },
//     subscription: {
//       status: SubscriptionStatus.ACTIVE,
//       billingCycle: BillingCycle.MONTHLY,
//       currentPeriodStart: daysAgo(30),
//       currentPeriodEnd: new Date(), // vence hoje
//       nextBillingDate: new Date(), // deve ser processado hoje
//       priceAtSubscription: 99.9,
//     },
//   },
//   {
//     label: "ACTIVE - overdue 2 days (deve ser cobrado pelo daily-billing)",
//     user: {
//       firstName: "Bob",
//       lastName: "Overdue2",
//       email: "bob.overdue2@test.com",
//     },
//     subscription: {
//       status: SubscriptionStatus.ACTIVE,
//       billingCycle: BillingCycle.MONTHLY,
//       currentPeriodStart: daysAgo(32),
//       currentPeriodEnd: daysAgo(2),
//       nextBillingDate: daysAgo(2),
//       priceAtSubscription: 99.9,
//     },
//   },
//   {
//     label: "ACTIVE - annual due today (deve ser cobrado pelo daily-billing)",
//     user: {
//       firstName: "Carol",
//       lastName: "AnnualDue",
//       email: "carol.annualdue@test.com",
//     },
//     subscription: {
//       status: SubscriptionStatus.ACTIVE,
//       billingCycle: BillingCycle.ANNUAL,
//       currentPeriodStart: daysAgo(365),
//       currentPeriodEnd: new Date(),
//       nextBillingDate: new Date(),
//       priceAtSubscription: 999.9,
//     },
//   },
//   {
//     label: "ACTIVE - future billing (NÃO deve ser cobrado ainda)",
//     user: {
//       firstName: "Dave",
//       lastName: "FutureBill",
//       email: "dave.futurebill@test.com",
//     },
//     subscription: {
//       status: SubscriptionStatus.ACTIVE,
//       billingCycle: BillingCycle.MONTHLY,
//       currentPeriodStart: new Date(),
//       currentPeriodEnd: daysFromNow(30),
//       nextBillingDate: daysFromNow(30),
//       priceAtSubscription: 49.9,
//     },
//   },

//   // ── retry-failed-payments ───────────────────────────────────────────────
//   {
//     label: "PAST_DUE - retryCount 0 (primeira retentativa)",
//     user: {
//       firstName: "Eve",
//       lastName: "Retry0",
//       email: "eve.retry0@test.com",
//     },
//     subscription: {
//       status: SubscriptionStatus.PAST_DUE,
//       billingCycle: BillingCycle.MONTHLY,
//       currentPeriodStart: daysAgo(33),
//       currentPeriodEnd: daysAgo(3),
//       nextBillingDate: daysAgo(3),
//       priceAtSubscription: 99.9,
//       retryCount: 0,
//       lastPaymentAttempt: daysAgo(3),
//     },
//   },
//   {
//     label: "PAST_DUE - retryCount 1 (segunda retentativa)",
//     user: {
//       firstName: "Frank",
//       lastName: "Retry1",
//       email: "frank.retry1@test.com",
//     },
//     subscription: {
//       status: SubscriptionStatus.PAST_DUE,
//       billingCycle: BillingCycle.MONTHLY,
//       currentPeriodStart: daysAgo(35),
//       currentPeriodEnd: daysAgo(5),
//       nextBillingDate: daysAgo(5),
//       priceAtSubscription: 99.9,
//       retryCount: 1,
//       lastPaymentAttempt: daysAgo(2),
//     },
//   },
//   {
//     label: "PAST_DUE - retryCount 2 (terceira retentativa)",
//     user: {
//       firstName: "Grace",
//       lastName: "Retry2",
//       email: "grace.retry2@test.com",
//     },
//     subscription: {
//       status: SubscriptionStatus.PAST_DUE,
//       billingCycle: BillingCycle.MONTHLY,
//       currentPeriodStart: daysAgo(40),
//       currentPeriodEnd: daysAgo(10),
//       nextBillingDate: daysAgo(10),
//       priceAtSubscription: 99.9,
//       retryCount: 2,
//       lastPaymentAttempt: daysAgo(1),
//     },
//   },

//   // ── expire-overdue-subscriptions ────────────────────────────────────────
//   {
//     label: "PAST_DUE - currentPeriodEnd muito vencido (deve expirar)",
//     user: {
//       firstName: "Hank",
//       lastName: "ExpireMe",
//       email: "hank.expireme@test.com",
//     },
//     subscription: {
//       status: SubscriptionStatus.PAST_DUE,
//       billingCycle: BillingCycle.MONTHLY,
//       currentPeriodStart: daysAgo(60),
//       currentPeriodEnd: daysAgo(30), // 30 dias sem pagar
//       nextBillingDate: daysAgo(30),
//       priceAtSubscription: 99.9,
//       retryCount: 3,
//       lastPaymentAttempt: daysAgo(25),
//     },
//   },
//   {
//     label: "SUSPENDED - currentPeriodEnd vencido (deve expirar)",
//     user: {
//       firstName: "Iris",
//       lastName: "Suspended",
//       email: "iris.suspended@test.com",
//     },
//     subscription: {
//       status: SubscriptionStatus.SUSPENDED,
//       billingCycle: BillingCycle.MONTHLY,
//       currentPeriodStart: daysAgo(50),
//       currentPeriodEnd: daysAgo(20),
//       nextBillingDate: daysAgo(20),
//       priceAtSubscription: 99.9,
//       retryCount: 3,
//       lastPaymentAttempt: daysAgo(15),
//     },
//   },

//   // ── Trialing ─────────────────────────────────────────────────────────────
//   {
//     label: "TRIALING - trial ativo (não deve ser cobrado)",
//     user: {
//       firstName: "Jake",
//       lastName: "OnTrial",
//       email: "jake.ontrial@test.com",
//     },
//     subscription: {
//       status: SubscriptionStatus.TRIALING,
//       billingCycle: BillingCycle.MONTHLY,
//       currentPeriodStart: daysAgo(7),
//       currentPeriodEnd: daysFromNow(7),
//       nextBillingDate: daysFromNow(7),
//       trialEnd: daysFromNow(7),
//       priceAtSubscription: 99.9,
//     },
//   },
//   {
//     label: "TRIALING - trial vencido (deve transicionar para cobrança)",
//     user: {
//       firstName: "Kate",
//       lastName: "TrialExpired",
//       email: "kate.trialexpired@test.com",
//     },
//     subscription: {
//       status: SubscriptionStatus.TRIALING,
//       billingCycle: BillingCycle.MONTHLY,
//       currentPeriodStart: daysAgo(14),
//       currentPeriodEnd: daysAgo(0),
//       nextBillingDate: new Date(),
//       trialEnd: daysAgo(1),
//       priceAtSubscription: 99.9,
//     },
//   },

//   // ── Canceladas / Expiradas (não devem ser processadas) ──────────────────
//   {
//     label: "CANCELED - assinatura cancelada",
//     user: {
//       firstName: "Leo",
//       lastName: "Canceled",
//       email: "leo.canceled@test.com",
//     },
//     subscription: {
//       status: SubscriptionStatus.CANCELED,
//       billingCycle: BillingCycle.MONTHLY,
//       currentPeriodStart: daysAgo(60),
//       currentPeriodEnd: daysAgo(30),
//       nextBillingDate: daysAgo(30),
//       priceAtSubscription: 99.9,
//       canceledAt: daysAgo(35),
//       cancelReason: "Requested by user",
//     },
//   },
//   {
//     label: "EXPIRED - assinatura expirada",
//     user: {
//       firstName: "Mia",
//       lastName: "Expired",
//       email: "mia.expired@test.com",
//     },
//     subscription: {
//       status: SubscriptionStatus.EXPIRED,
//       billingCycle: BillingCycle.MONTHLY,
//       currentPeriodStart: daysAgo(90),
//       currentPeriodEnd: daysAgo(60),
//       nextBillingDate: daysAgo(60),
//       priceAtSubscription: 99.9,
//       retryCount: 3,
//     },
//   },
// ];

// // ─── Route handler ───────────────────────────────────────────────────────────

// export async function GET(): Promise<NextResponse> {
//   return withDB(async () => {
//     const results: {
//       label: string;
//       email: string;
//       action: "created" | "skipped";
//     }[] = [];

//     const passwordHash = await argon2.hash("Seed@1234!");

//     for (const scenario of scenarios) {
//       const { label, user: userPayload, subscription: subPayload } = scenario;

//       // 1. Upsert User
//       let user: any = await UserModel.findOne({
//         email: userPayload.email,
//       }).lean();
//       if (!user) {
//         user = await UserModel.create({
//           ...userPayload,
//           passwordHash,
//           phone: "+5511999999999",
//           document: "000.000.000-00",
//           isStoreIntegrated: false,
//         }).then((doc) => doc.toObject());
//       }

//       // 2. Upsert BillingAccount
//       let billingAccount: any = await BillingAccountModel.findOne({
//         userId: user._id,
//       }).lean();
//       if (!billingAccount) {
//         billingAccount = await BillingAccountModel.create({
//           userId: user._id,
//           name: `${userPayload.firstName} ${userPayload.lastName}`,
//           email: userPayload.email,
//           document: "",
//           phone: "+5511999999999",
//         });
//       }

//       // 3. Upsert Subscription (one per billing account for simplicity)
//       const existingSub = await SubscriptionModel.findOne({
//         billingAccountId: billingAccount._id,
//       }).lean();

//       if (existingSub) {
//         results.push({ label, email: userPayload.email, action: "skipped" });
//         continue;
//       }

//       await SubscriptionModel.create({
//         billingAccountId: billingAccount._id,
//         planId: PLAN_ID,
//         retryCount: 0,
//         ...subPayload,
//       });

//       results.push({ label, email: userPayload.email, action: "created" });
//     }

//     const created = results.filter((r) => r.action === "created");
//     const skipped = results.filter((r) => r.action === "skipped");

//     return NextResponse.json(
//       {
//         message: "Seed de billing workers finalizado",
//         summary: {
//           total: results.length,
//           created: created.length,
//           skipped: skipped.length,
//         },
//         created: created.map((r) => ({ label: r.label, email: r.email })),
//         skipped: skipped.map((r) => ({ label: r.label, email: r.email })),
//       },
//       { status: 201 },
//     );
//   });
// }
