import { Button } from "@workspace/ui/components/button";
import type { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  description: string;
  actionBtn?: boolean;
  actionFunc?: () => void;
  actionBtnTitle?: string;
  actionBtnIcon?: LucideIcon;
}

export function PageHeader({
  title,
  description,
  actionBtn = false,
  actionFunc,
  actionBtnTitle,
  actionBtnIcon: ActionBtnIcon,
}: Props) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-foreground">{description}</p>
      </div>
      {actionBtn && (
        <Button className="cursor-pointer" onClick={actionFunc}>
          {ActionBtnIcon && <ActionBtnIcon />}
          <span>{actionBtnTitle}</span>
        </Button>
      )}
    </div>
  );
}
