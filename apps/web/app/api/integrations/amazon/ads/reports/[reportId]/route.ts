// import { withDB } from "@/lib/mongoose";
// import { IntegrationModel } from "@workspace/mongodb/models/integration";
// import { NextResponse } from "next/server";
// import { checkReportOnce } from "@/services/get-amazon-ads-metrics";
// import { AdsReportModel } from "@workspace/mongodb/models/ads-report";

// export async function GET(
//   req: Request,
//   { params }: { params: Promise<{ reportId: string }> }
// ) {
//   return withDB(async () => {
//     const reportId = (await params).reportId;
//     const storeId = new URL(req.url).searchParams.get("storeId") || undefined;

//     if (!reportId || !storeId) {
//       return NextResponse.json(
//         { error: "reportId and storeId are required" },
//         { status: 400 }
//       );
//     }

//     const integration = await IntegrationModel.findOne({
//       storeId,
//       provider: "amazon_ads",
//     });

//     if (!integration) {
//       return NextResponse.json(
//         { error: "Amazon ADS integration not found" },
//         { status: 404 }
//       );
//     }

//     const report = await AdsReportModel.findById(reportId);

//     const result = await checkReportOnce(report!, storeId, integration);

//     if ("error" in result) {
//       return NextResponse.json(
//         { error: result.error.message },
//         { status: 500 }
//       );
//     }

//     return NextResponse.json({
//       report: result.reportDoc,
//       metrics: result.metrics ?? null,
//     });
//   });
// }
