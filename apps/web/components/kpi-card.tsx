import React from "react";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@workspace/ui/components/tooltip";
import { HelpCircle, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

export interface KpiItem {
  title: string;
  value: string;
  icon: LucideIcon;
  iconBgColor?: string;
  prefix?: string;
  suffix?: string;
  tooltip?: string;
  change?: string;
  changePositive?: boolean;
  noMargin?: boolean;
  className?: string;
  description?: string;
}

interface Props {
  kpi: KpiItem;
  className?: string;
}

const kpiCardColor = "bg-primary/40 text-primary";

export function KpiCard({ kpi, className }: Props) {
  const Icon = kpi.icon;
  const iconBg = kpiCardColor;
  const iconColor = "text-gray-700 dark:text-gray-200";
  const badgeBg = kpi.changePositive
    ? "bg-success/10 text-success"
    : "bg-danger/10 text-danger";

  return (
    <Card
      className={cn(
        "shadow-sm hover:shadow-md transition-shadow flex-1 min-w-[220px] rounded-sm ",
        className,
        kpi.className,
      )}
    >
      <CardContent className="px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn("p-3 rounded-md", iconBg)}>
              <div className={iconColor}>
                <Icon className="h-5 w-5" />
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-1">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {kpi.title}
                </h3>

                {kpi.tooltip && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          aria-label={`Tooltip: ${kpi.title}`}
                          type="button"
                          className="inline-flex items-center"
                        >
                          <HelpCircle className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs max-w-xs">{kpi.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              <div className="font-bold text-xl text-gray-900 dark:text-gray-100 mt-0.5">
                {kpi.prefix ?? ""}
                {kpi.value}
                {kpi.suffix ?? ""}
              </div>
            </div>
          </div>

          {!kpi.noMargin && kpi.change && (
            <Badge className={cn(badgeBg, "inline-flex items-center")}>
              <TrendingUp className="h-3 w-3 mr-1" />
              {kpi.change}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
