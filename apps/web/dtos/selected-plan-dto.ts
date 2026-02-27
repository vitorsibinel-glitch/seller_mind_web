export interface SelectedPlanDTO {
  _id: string;
  prices: {
    monthly: number;
    annual: number;
  };
  limits: {
    maxOrders?: number;
    gamificationBonus?: number;
  };
  trialDays: number;
  name: string;
  tier: string;
  features: string[];
}

export interface SelectedPlanDataDTO {
  plan: SelectedPlanDTO;
}
