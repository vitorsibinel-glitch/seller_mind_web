import { withDB } from "@/lib/mongoose";
import axios from "axios";
import { NextResponse } from "next/server";
import { getAmazonSPAccessToken } from "@/services/get-amazon-sp-access-token";

export async function GET(req: Request) {
  return withDB(async () => {
    try {
      const { searchParams } = new URL(req.url);
      const storeId = searchParams.get("storeId");
      const sellerId = searchParams.get("sellerId");

      if (!storeId || !sellerId) {
        return NextResponse.json(
          { error: "storeId e sellerId são obrigatórios" },
          { status: 400 },
        );
      }

      const { access_token } = await getAmazonSPAccessToken(storeId);

      if (!access_token) {
        return NextResponse.json(
          { error: "Não foi possível obter access token" },
          { status: 401 },
        );
      }

      const headers = { "x-amz-access-token": access_token };

      // 1. Criar relatório para pegar TODOS os produtos (ativos e inativos)
      const reportResponse = await axios.post(
        "https://sellingpartnerapi-na.amazon.com/reports/2021-06-30/reports",
        {
          reportType: "GET_MERCHANT_LISTINGS_DATA",
          marketplaceIds: ["A2Q3Y263D00KWC"],
        },
        { headers },
      );

      const reportId = reportResponse.data.reportId;
      console.log(`Relatório criado: ${reportId}`);

      // 2. Aguardar processamento do relatório
      let reportDocumentId: string | null = null;
      const maxAttempts = 30;

      for (let i = 0; i < maxAttempts; i++) {
        await new Promise((r) => setTimeout(r, 2000));

        const statusResponse = await axios.get(
          `https://sellingpartnerapi-na.amazon.com/reports/2021-06-30/reports/${reportId}`,
          { headers },
        );

        const status = statusResponse.data.processingStatus;
        console.log(`Status: ${status}`);

        if (status === "DONE") {
          reportDocumentId = statusResponse.data.reportDocumentId;
          break;
        }

        if (status === "FATAL" || status === "CANCELLED") {
          throw new Error(`Relatório falhou: ${status}`);
        }
      }

      if (!reportDocumentId) {
        throw new Error("Timeout ao aguardar relatório");
      }

      // 3. Obter URL do documento
      const documentResponse = await axios.get(
        `https://sellingpartnerapi-na.amazon.com/reports/2021-06-30/documents/${reportDocumentId}`,
        { headers },
      );

      // 4. Baixar e processar o relatório TSV
      const reportData = await axios.get(documentResponse.data.url, {
        responseType: "text",
      });

      const lines = reportData.data.split("\n");
      const headerLine = lines[0].split("\t");

      const listings = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split("\t");
        const row: any = {};

        headerLine.forEach((header: string, index: number) => {
          row[header] = values[index];
        });

        listings.push({
          sku: row["seller-sku"],
          asin: row["asin1"],
          title: row["item-name"],
          status: row["status"],
          price: row["price"] ? parseFloat(row["price"]) : null,
          currency: "BRL",
          quantity: row["quantity"] ? parseInt(row["quantity"]) : 0,
          fulfillmentChannel: row["fulfillment-channel"],
        });
      }

      console.log(`Total de produtos: ${listings.length}`);

      return NextResponse.json({
        sellerId,
        totalListings: listings.length,
        activeListings: listings.filter((l) => l.status === "Active").length,
        inactiveListings: listings.filter((l) => l.status === "Inactive")
          .length,
        listings,
      });
    } catch (error: any) {
      console.error("Erro ao buscar listings:", error);
      return NextResponse.json(
        {
          error: "Erro ao buscar listings",
          details: error.response?.data || error.message,
        },
        { status: 500 },
      );
    }
  });
}
