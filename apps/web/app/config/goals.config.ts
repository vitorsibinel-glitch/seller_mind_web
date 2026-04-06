export type GoalTarget = (typeof GOAL_TARGETS)[number];

export type GoalTier = {
  index: number;
  targetAmount: GoalTarget;
  name: string;
  badge: string;
  rewardMessage: string;
  color: string;
};

export const GOAL_TARGETS = [
  10000, 50000, 250000, 500000, 1000000, 1500000, 2500000, 3500000,
] as const;

export const GOAL_TIERS: readonly GoalTier[] = [
  {
    index: 0,
    targetAmount: 10000,
    name: "Recruta FBA",
    badge: "🪖",
    rewardMessage: "Sua jornada começou.",
    color: "#c3a7e5",
  },
  {
    index: 1,
    targetAmount: 50000,
    name: "Caçador de ASIN",
    badge: "🎯",
    rewardMessage: "Você começou a dominar o jogo.",
    color: "#9b7ae3",
  },
  {
    index: 2,
    targetAmount: 250000,
    name: "Mestre do SKU",
    badge: "📦",
    rewardMessage: "Controle total do catálogo.",
    color: "#6651c2",
  },
  {
    index: 3,
    targetAmount: 500000,
    name: "Comandante FBA",
    badge: "🫡",
    rewardMessage: "Sua operação virou estratégia.",
    color: "#7f3fbf",
  },
  {
    index: 4,
    targetAmount: 1000000,
    name: "Guardião do Buy Box",
    badge: "🛒",
    rewardMessage: "Você domina o marketplace.",
    color: "#6b21a8",
  },
  {
    index: 5,
    targetAmount: 1500000,
    name: "Senhor do Catálogo",
    badge: "📚",
    rewardMessage: "Escala com consistência.",
    color: "#4c1d95",
  },
  {
    index: 6,
    targetAmount: 2500000,
    name: "Arquiteto de Escala",
    badge: "🏗️",
    rewardMessage: "Sua operação é uma máquina.",
    color: "#3b0764",
  },
  {
    index: 7,
    targetAmount: 3500000,
    name: "Lenda SellerMind",
    badge: "🐉",
    rewardMessage: "Você entrou para a elite absoluta.",
    color: "#020617",
  },
] as const;

export function getNextGoalTarget(currentHighest: number): number | null {
  return GOAL_TARGETS.find((target) => target > currentHighest) ?? null;
}

export function getAllGoalTargets() {
  return GOAL_TARGETS;
}

export function getCurrentTierIndex(achievedTarget: number): number {
  const index = GOAL_TARGETS.findIndex((target) => target === achievedTarget);
  return Math.max(0, index);
}

export function getCurrentTierBadge(achievedTarget: number): string {
  const index = GOAL_TARGETS.findIndex((target) => target === achievedTarget);
  const tier = GOAL_TIERS[index];
  return tier ? tier.badge : "";
}
