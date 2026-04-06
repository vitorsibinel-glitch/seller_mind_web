import { SectionID } from "@/sections";
import { cn } from "@workspace/ui/lib/utils";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  sectionId?: SectionID;
  className?: string;
}

export function DefaultSectionWrapper({
  children,
  sectionId,
  className,
}: Props) {
  return (
    <section
      className={cn(
        "bg-background text-foreground py-24 md:py-32 relative overflow-hidden",
        className
      )}
      id={sectionId}
    >
      {children}
    </section>
  );
}
