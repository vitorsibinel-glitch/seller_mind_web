// import { withDB } from "@/lib/mongoose";
// import { IntegrationModel } from "@workspace/mongodb/models/integration";
// import { NextResponse } from "next/server";
// import { createReport } from "@/services/get-amazon-ads-metrics";
// import z from "zod";
// import { getPeriod, PeriodEnum } from "@/utils/get-period";

// const bodySchema = z.object({
//   storeId: z.string().min(1, "storeId is required"),
//   period: z.enum(Object.values(PeriodEnum) as [string, ...string[]]),
// });

// export async function POST(req: Request) {
//   return withDB(async () => {
//     const body = await req.json();
//     const parsed = bodySchema.safeParse(body);

//     if (!parsed.success) {
//       return NextResponse.json(
//         { message: "Dados inválidos", errors: parsed.error.format() },
//         { status: 400 },
//       );
//     }

//     const { storeId, period } = parsed.data;

//     const periodRange = getPeriod(period);
//     if (!periodRange) {
//       return NextResponse.json({ error: "Período inválido" }, { status: 400 });
//     }
//     const { fromDateUtc, toDateUtc } = periodRange;

//     const integration = await IntegrationModel.findOne({
//       storeId,
//       provider: "amazon_ads",
//     });

//     if (!integration) {
//       return NextResponse.json(
//         { error: "Integração com a Amazon ADS não encontrada" },
//         { status: 404 },
//       );
//     }

//     const result = await createReport(storeId, integration, {
//       startDate: fromDateUtc,
//       endDate: toDateUtc,
//       period,
//     });

//     if ("error" in result) {
//       return NextResponse.json(
//         { error: result.error.message },
//         { status: 500 },
//       );
//     }

//     return NextResponse.json({ report: result.reportDoc });
//   });
// }
