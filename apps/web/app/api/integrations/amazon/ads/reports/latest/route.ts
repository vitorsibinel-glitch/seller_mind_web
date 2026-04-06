// import { withDB } from "@/lib/mongoose";
// import { AdsReportModel } from "@workspace/mongodb/models/ads-report";
// import { IntegrationModel } from "@workspace/mongodb/models/integration";
// import { checkReportOnce } from "@/services/get-amazon-ads-metrics";
// import { getPeriod } from "@/utils/get-period";
// import { NextResponse } from "next/server";

// export async function GET(req: Request) {
//   return withDB(async () => {
//     const url = new URL(req.url);
//     const storeId = url.searchParams.get("storeId");
//     const period = url.searchParams.get("period");

//     if (!storeId) {
//       return NextResponse.json(
//         { error: "Loja não encontrada" },
//         { status: 404 },
//       );
//     }

//     const integration = await IntegrationModel.findOne({
//       storeId,
//       provider: "amazon_ads",
//     });

//     if (!integration) {
//       return NextResponse.json(
//         { error: "Amazon ADS integration not found" },
//         { status: 404 },
//       );
//     }

//     const periodRange = getPeriod(period);

//     let doc = null;

//     if (periodRange && periodRange.fromDateUtc && periodRange.toDateUtc) {
//       const docs = await AdsReportModel.find({
//         storeId,
//         "params.startDate": periodRange.fromDateUtc,
//         "params.endDate": periodRange.toDateUtc,
//       }).sort({ updatedAt: -1 });

//       doc = docs.find((d) => d.status === "COMPLETED") ?? docs[0];
//     }

//     if (!doc) {
//       const fallbackDocs = await AdsReportModel.find({
//         storeId,
//         "params.period": period,
//       }).sort({ updatedAt: -1 });

//       doc =
//         fallbackDocs.find((d) => d.status === "COMPLETED") ?? fallbackDocs[0];
//     }

//     if (!doc) {
//       return NextResponse.json({
//         data: {
//           status: null,
//           metrics: { cost: 0, acos: 0 },
//           params: null,
//           reportId: null,
//           fetchedAt: null,
//         },
//       });
//     }

//     if (doc.status === "COMPLETED") {
//       return NextResponse.json({
//         data: {
//           status: doc.status,
//           params: doc.params,
//           reportId: doc.reportId,
//           metrics: {
//             cost: doc.data?.metrics?.cost ?? 0,
//             acos: doc.data?.metrics?.acos ?? 0,
//           },
//           fetchedAt: doc.data?.fetchedAt ?? null,
//         },
//       });
//     }

//     const result = await checkReportOnce(doc, storeId, integration);

//     if ("error" in result) {
//       return NextResponse.json(
//         { error: result.error.message },
//         { status: 400 },
//       );
//     }

//     return NextResponse.json({
//       data: {
//         status: result.reportDoc.status,
//         params: result.reportDoc.params,
//         reportId: result.reportDoc.reportId,
//         metrics: {
//           cost: result.metrics?.cost ?? 0,
//           acos: result.metrics?.acos ?? 0,
//         },
//         fetchedAt: result.reportDoc.data?.fetchedAt ?? null,
//       },
//     });
//   });
// }
