// import { getAmazonAdsClient } from "@/lib/amazon-ads-client";
// import {
//   AdsReportModel,
//   type AdsReportDocument,
// } from "@workspace/mongodb/models/ads-report";
// import type { Integration } from "@workspace/mongodb/models/integration";
// import axios from "axios";
// import { ungzip } from "pako";

// export interface AdsMetricsParams {
//   startDate?: Date;
//   endDate?: Date;
//   period?: string;
// }

// export interface AdsMetrics {
//   cost: number;
//   impressions: number;
//   clicks: number;
//   conversions: number;
//   acos: number;
// }

// async function parseReportFromUrl(downloadUrl: string) {
//   const response = await axios.get(downloadUrl, {
//     responseType: "arraybuffer",
//   });
//   if (response.status < 200 || response.status >= 300) {
//     throw new Error(`Failed to download report: ${response.status}`);
//   }

//   const contentType = String(response.headers["content-type"] || "");
//   const buffer = response.data as ArrayBuffer;
//   const uint8 = new Uint8Array(buffer);

//   if (contentType.includes("gzip") || downloadUrl.includes(".gz")) {
//     const decompressed = ungzip(uint8, { to: "string" });
//     return JSON.parse(decompressed);
//   }

//   const text = new TextDecoder("utf-8").decode(uint8);
//   return JSON.parse(text);
// }

// function aggregateRows(reportData: any[]): {
//   aggregated: any;
//   metrics: AdsMetrics;
// } {
//   console.log("Total de linhas no report:", reportData?.length);
//   console.log("Primeiras 5 linhas:", reportData?.slice(0, 5));

//   const aggregated = (reportData || []).reduce(
//     (acc: any, row: any) => {
//       const cost = parseFloat(String(row.cost ?? "0")) || 0;
//       const impressions = parseInt(String(row.impressions ?? "0")) || 0;
//       const clicks = parseInt(String(row.clicks ?? "0")) || 0;
//       const conversions = parseInt(String(row.purchases14d ?? "0")) || 0;
//       const sales = parseFloat(String(row.sales14d ?? "0")) || 0;

//       console.log("Row cost:", cost, "Accumulated:", acc.cost + cost);

//       return {
//         cost: acc.cost + cost,
//         impressions: acc.impressions + impressions,
//         clicks: acc.clicks + clicks,
//         conversions: acc.conversions + conversions,
//         sales: acc.sales + sales,
//       };
//     },
//     { cost: 0, impressions: 0, clicks: 0, conversions: 0, sales: 0 },
//   );
//   const acos =
//     aggregated.sales > 0 ? (aggregated.cost / aggregated.sales) * 100 : 0;

//   const metrics: AdsMetrics = {
//     cost: aggregated.cost,
//     impressions: aggregated.impressions,
//     clicks: aggregated.clicks,
//     conversions: aggregated.conversions,
//     acos: Number(acos.toFixed(2)),
//   };

//   return { aggregated, metrics };
// }

// export async function createReport(
//   storeId: string,
//   integration: Integration,
//   params: AdsMetricsParams,
// ): Promise<{ reportDoc: any } | { error: Error }> {
//   try {
//     const client = await getAmazonAdsClient(storeId, integration);
//     let reportId: string;

//     try {
//       const response = await client.post("/reporting/reports", {
//         configuration: {
//           adProduct: "SPONSORED_PRODUCTS",
//           groupBy: ["advertiser"], // ou ["targeting"] dependendo do que você quer
//           columns: [
//             "cost",
//             "impressions",
//             "clicks",
//             "purchases14d",
//             "sales14d",
//             "advertisedAsin",
//             "campaignName", // Adicionar nome da campanha
//             "adGroupName", // Adicionar nome do grupo de anúncios
//           ],
//           reportTypeId: "spAdvertisedProduct", // ⚠️ MUDANÇA IMPORTANTE
//           timeUnit: "SUMMARY",
//           format: "GZIP_JSON",
//         },
//         startDate: params.startDate,
//         endDate: params.endDate,
//       });
//       reportId = response.data.reportId;
//     } catch (err: any) {
//       if (axios.isAxiosError(err) && err.response?.status === 425) {
//         const detail = err.response.data?.detail ?? "";
//         const m = String(detail).match(/([a-f0-9-]{36})/i);
//         if (m) reportId = m[0];
//         else throw new Error("Could not extract reportId from 425 error");
//       } else {
//         throw err;
//       }
//     }

//     const existing = await AdsReportModel.findOne({ reportId });
//     if (existing) {
//       // existing.params = params;
//       if (existing.status !== "COMPLETED") {
//         existing.status = "PENDING";
//       }
//       await existing.save();
//       return { reportDoc: existing };
//     }

//     const doc = new AdsReportModel({
//       storeId,
//       reportId,
//       params,
//       status: "PENDING",
//     });
//     await doc.save();
//     return { reportDoc: doc };
//   } catch (error: any) {
//     console.error("createReport error:", error);
//     return { error };
//   }
// }

// export async function checkReportOnce(
//   doc: AdsReportDocument,
//   storeId: string,
//   integration: Integration,
// ): Promise<{ reportDoc: any; metrics?: AdsMetrics } | { error: Error }> {
//   try {
//     if (doc.status === "COMPLETED" && doc.data?.metrics) {
//       return { reportDoc: doc, metrics: doc.data.metrics };
//     }

//     const client = await getAmazonAdsClient(storeId, integration);
//     const statusResponse = await client.get(
//       `/reporting/reports/${doc.reportId}`,
//     );

//     const remoteStatus = statusResponse.data.status;

//     if (remoteStatus === "FAILURE") {
//       const updatedDoc = await AdsReportModel.findOneAndUpdate(
//         { reportId: doc.reportId },
//         {
//           status: "FAILURE",
//           error: statusResponse.data.error ?? "FAILURE",
//         },
//         { new: true },
//       );
//       return { reportDoc: updatedDoc };
//     }

//     if (remoteStatus === "COMPLETED") {
//       const downloadUrl = statusResponse.data.url;
//       const raw = await parseReportFromUrl(downloadUrl);
//       const { aggregated, metrics } = aggregateRows(raw);

//       const updatedDoc = await AdsReportModel.findOneAndUpdate(
//         { reportId: doc.reportId },
//         {
//           status: "COMPLETED",
//           data: { raw, aggregated, metrics, fetchedAt: new Date() },
//           error: null,
//         },
//         { new: true },
//       );

//       return { reportDoc: updatedDoc, metrics };
//     }

//     if (remoteStatus === "PROCESSING" || remoteStatus === "PENDING") {
//       const updatedDoc = await AdsReportModel.findOneAndUpdate(
//         { reportId: doc.reportId },
//         { status: "PENDING" },
//         { new: true },
//       );
//       return { reportDoc: updatedDoc };
//     }

//     doc.status = "PENDING";
//     await doc.save();
//     return { reportDoc: doc };
//   } catch (error: any) {
//     console.error("checkReportOnce error:", error);
//     return { error };
//   }
// }
