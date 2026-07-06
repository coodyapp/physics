import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { cn } from "@/utils/tailwind";

type PanelSide = "left" | "right";

interface CollapsiblePanelProps {
  side: PanelSide;
  title: string;
  icon: ReactNode;
  children: ReactNode;
  contentClassName?: string;
  id?: string;
  open: boolean;
  showTitle?: boolean;
}

function getPanelPosition(side: PanelSide) {
  return side === "left" ? "left-4" : "right-4";
}

export function CollapsiblePanel({
  side,
  title,
  icon,
  children,
  contentClassName,
  id,
  open,
  showTitle = true,
}: CollapsiblePanelProps) {
  if (!open) return null;

  return (
    <div className={cn("absolute top-20 z-40 pointer-events-auto", getPanelPosition(side))}>
      <div className="flex items-start gap-2">
        <Card
          id={id}
          role="region"
          aria-label={title}
          className="w-[min(20rem,calc(100vw-2rem))] max-h-[calc(100vh-6rem)] overflow-y-auto border-border/55 bg-background/65 shadow-2xl backdrop-blur-2xl dark:bg-background/55"
        >
          {showTitle && (
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                {icon}
                {title}
              </CardTitle>
            </CardHeader>
          )}
          <CardContent className={cn("space-y-4", contentClassName)}>{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}
