export interface GamificationResponseDTO {
  currentRevenue: number;
  currentProfit: number;
  totalOrders: number;
  newlyAchievedTargets: number[];
  currentTier: number;
  nextTierTarget: number;
  progressPercentage: number;
  achievements: Array<{
    targetAmount: number;
    achievedAt: string;
    month: number;
    year: number;
    revenue: number;
  }>;
  tiers: number[];
  period: {
    start: string;
    end: string;
    month: number;
    year: number;
  };
}
