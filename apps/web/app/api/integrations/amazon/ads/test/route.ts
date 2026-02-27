export const runtime = "nodejs";

import { withDB } from "@/lib/mongoose";
import { IntegrationModel } from "@workspace/mongodb/models/integration";
import { getAmazonAdsAccessToken } from "@/services/get-amazon-ads-access-token";
import { env } from "@/env";
import axios from "axios";
import { NextResponse } from "next/server";

interface Profile {
  profileId: number;
  countryCode: string;
  currencyCode: string;
  timezone: string;
  accountInfo: {
    marketplaceStringId: string;
    id: string;
    type: string;
    name: string;
    validPaymentMethod: boolean;
  };
}

interface IntegrationProfileData {
  storeId: string;
  integrationId: string;
  currentProfileId: string | null;
  availableProfiles: Profile[];
  isValid: boolean;
  needsUpdate: boolean;
  error?: string;
}

async function getProfilesForIntegration(
  integration: any,
): Promise<IntegrationProfileData> {
  try {
    const accessToken = await getAmazonAdsAccessToken(integration.storeId);

    const response = await axios.get<Profile[]>(
      "https://advertising-api.amazon.com/v2/profiles",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Amazon-Advertising-API-ClientId": env.LWA_CLIENT_ID,
          "Content-Type": "application/json",
        },
      },
    );

    const profiles = response.data;
    const currentProfileId = integration.profileId?.toString() || null;

    const hasValidProfile = profiles.some(
      (p) => p.profileId.toString() === currentProfileId,
    );

    return {
      storeId: integration.storeId,
      integrationId: integration._id.toString(),
      currentProfileId,
      availableProfiles: profiles,
      isValid: hasValidProfile,
      needsUpdate: !hasValidProfile,
    };
  } catch (error: any) {
    return {
      storeId: integration.storeId,
      integrationId: integration._id.toString(),
      currentProfileId: integration.profileId?.toString() || null,
      availableProfiles: [],
      isValid: false,
      needsUpdate: true,
      error:
        error.response?.data?.message ||
        error.message ||
        "Erro ao buscar perfis",
    };
  }
}

export async function GET(): Promise<NextResponse> {
  return withDB(async () => {
    try {
      const integrations = await IntegrationModel.find({
        provider: "amazon_ads",
        status: "connected",
      });

      console.log(`🔍 Verificando ${integrations.length} integrações...`);

      const results = await Promise.all(
        integrations.map((integration) =>
          getProfilesForIntegration(integration),
        ),
      );

      const summary = {
        total: results.length,
        valid: results.filter((r) => r.isValid).length,
        needsUpdate: results.filter((r) => r.needsUpdate).length,
        withErrors: results.filter((r) => r.error).length,
      };

      return NextResponse.json({
        summary,
        integrations: results,
      });
    } catch (error: any) {
      console.error("❌ Erro ao listar profiles:", error);
      return NextResponse.json(
        {
          error: error.message || "Erro ao listar profiles",
        },
        { status: 500 },
      );
    }
  });
}
