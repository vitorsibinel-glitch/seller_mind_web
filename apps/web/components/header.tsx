"use client";

import { GOAL_TIERS, type GoalTier } from "@/app/config/goals.config";
import { useAuth } from "@/contexts/auth-context";
import type { GamificationResponseDTO } from "@/dtos/gamification-response-dto";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { cn } from "@workspace/ui/lib/utils";
import { ChevronDown, Rocket, X } from "lucide-react";
import { useState } from "react";

interface AvatarWithProgressProps {
  user: any;
  progress: number;
  tier: GoalTier;
  size?: number;
}

function AvatarWithProgress({
  user,
  progress,
  tier,
  size = 40,
}: AvatarWithProgressProps) {
  const circumference = 2 * Math.PI * (size / 2 - 2);
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const getInitials = (name: string) =>
    (name || "")
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <div className="relative inline-flex items-center">
      <svg className="absolute" width={size} height={size} style={{ left: 0 }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 2}
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
          style={{ color: tier.color }}
        />
      </svg>

      <div style={{ width: size, height: size }} className="relative">
        <Avatar className="relative w-full h-full">
          <AvatarImage
            src={user?.avatarUrl}
            alt={user?.firstName}
            className="object-cover"
          />
          <AvatarFallback
            className="font-semibold text-primary-foreground"
            style={{ backgroundColor: tier.color }}
          >
            {getInitials(
              (user?.firstName || "") + " " + (user?.lastName || ""),
            )}
          </AvatarFallback>
        </Avatar>
        <div
          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-background"
          style={{ backgroundColor: tier.color }}
        >
          <span className="text-[10px] font-bold text-primary-foreground">
            {tier.badge}
          </span>
        </div>
      </div>
    </div>
  );
}

function TierBadge({ tier, compact }: { tier: GoalTier; compact?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full px-3 py-1",
        compact && "px-2 py-0.5",
      )}
      style={{
        backgroundColor: `${tier.color}20`,
        border: `1px solid ${tier.color}40`,
      }}
    >
      <span className={compact ? "text-sm" : "text-base"}>{tier.badge}</span>
      <span className={cn("font-semibold", compact ? "text-xs" : "text-sm")}>
        {tier.name}
      </span>
    </div>
  );
}

export function Header({
  gamification,
}: {
  gamification?: GamificationResponseDTO;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const achievedTargets = new Map(
    gamification?.achievements.map((a) => [a.targetAmount, a.achievedAt]) || [],
  );

  const currentIndex = gamification?.achievements.length
    ? GOAL_TIERS.findIndex(
        (tier) =>
          tier.targetAmount ===
          Math.max(...gamification.achievements.map((a) => a.targetAmount)),
      )
    : 0;

  const currentTier = GOAL_TIERS[currentIndex] || GOAL_TIERS[0];
  const nextTierIndex = Math.min(currentIndex + 1, GOAL_TIERS.length - 1);
  const nextTier = GOAL_TIERS[nextTierIndex];
  const progress = gamification?.progressPercentage ?? 0;
  const currentRevenue = gamification?.currentRevenue ?? 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <header className="h-16 px-4 border-b bg-card sticky top-0 z-40 flex items-center justify-between">
      <div className="flex items-center justify-start space-x-4"></div>

      <div className="flex items-center space-x-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              className="h-auto p-2 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3">
                  <AvatarWithProgress
                    user={user}
                    progress={progress}
                    tier={currentTier as GoalTier}
                    size={44}
                  />
                  <div className="flex flex-col items-start">
                    <div className="w-40">
                      <div className="w-full h-2 rounded-full bg-neutral overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: currentTier?.color,
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-semibold">{progress}%</span>
                      <span className="text-[10px] opacity-60">
                        Próximo: {nextTier?.name || "Máximo"}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 ml-1 opacity-60" />
              </div>
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl p-0 overflow-hidden border-0 bg-transparent shadow-2xl">
            <div className="relative bg-background rounded-lg">
              <DialogTitle className="hidden"></DialogTitle>
              <div
                className="p-6 relative overflow-hidden rounded-t-lg"
                style={{
                  background:
                    currentTier?.color === "#7f3fbf"
                      ? `linear-gradient(135deg, ${currentTier?.color}40, ${currentTier?.color}20)`
                      : `linear-gradient(135deg, ${currentTier?.color}30, ${currentTier?.color}15)`,
                }}
              >
                <div className="flex items-start gap-4">
                  <AvatarWithProgress
                    user={user}
                    progress={progress}
                    tier={currentTier as GoalTier}
                    size={64}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">Seu Progresso</h3>
                        <p className="text-sm opacity-70">
                          Tier atual: R${" "}
                          {currentTier?.targetAmount.toLocaleString()}
                        </p>
                      </div>
                      <TierBadge tier={currentTier as GoalTier} />
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-primary">
                          {currentTier?.name}
                        </span>
                        <span className="opacity-70">
                          R$ {currentRevenue.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-neutral overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: currentTier?.color,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="opacity-60">
                          Tier atual: R${" "}
                          {currentTier?.targetAmount.toLocaleString()}
                        </span>
                        {nextTier && currentIndex < GOAL_TIERS.length - 1 && (
                          <span className="opacity-60">
                            Próximo: R$ {nextTier.targetAmount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <h4 className="text-sm font-semibold uppercase tracking-wider opacity-60 mb-4">
                  Suas Premiações
                </h4>
                <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                  {GOAL_TIERS.map((tier, index) => {
                    const achievedDate = achievedTargets.get(tier.targetAmount);
                    const isAchieved = !!achievedDate;

                    return (
                      <div
                        key={tier.name}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-lg transition-all",
                          isAchieved ? "opacity-100" : "opacity-40",
                        )}
                        style={{
                          background: isAchieved
                            ? `linear-gradient(135deg, ${tier.color}20, ${tier.color}10)`
                            : "transparent",
                          border: isAchieved
                            ? `1px solid ${tier.color}30`
                            : "1px solid hsl(var(--border))",
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{
                              backgroundColor: tier.color,
                              opacity: isAchieved ? 1 : 0.5,
                            }}
                          >
                            <span className="text-sm text-primary-foreground font-bold">
                              {tier.badge}
                            </span>
                          </div>
                          <div>
                            <div className="text-base font-medium text-primary">
                              {tier.name}
                            </div>
                            <div className="text-sm opacity-70">
                              R$ {tier.targetAmount.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {isAchieved && achievedDate && (
                            <div className="text-right">
                              <div className="text-xs font-medium text-success">
                                Conquistado
                              </div>
                              <div className="text-xs opacity-60">
                                {formatDate(achievedDate)}
                              </div>
                            </div>
                          )}
                          {!isAchieved && (
                            <div className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground">
                              Não conquistado
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 border-t">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => setOpen(false)}
                >
                  <Rocket className="mr-2 h-4 w-4" />
                  <span>Ver Progresso Detalhado</span>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
