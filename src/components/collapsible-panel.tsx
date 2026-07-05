import { useState } from "react";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { cn } from "@/utils/tailwind";

type PanelSide = "left" | "right";

interface CollapsiblePanelProps {
  side: PanelSide;
  title: string;
  icon: ReactNode;
  children: ReactNode;
  contentClassName?: string;
  defaultOpen?: boolean;
}

function getPanelPosition(side: PanelSide) {
  return side === "left" ? "left-4" : "right-4";
}

function getOpenIcon(side: PanelSide) {
  return side === "left" ? (
    <ChevronLeft className="h-3 w-3" />
  ) : (
    <ChevronRight className="h-3 w-3" />
  );
}

function getClosedIcon(side: PanelSide) {
  return side === "left" ? (
    <ChevronRight className="h-4 w-4" />
  ) : (
    <ChevronLeft className="h-4 w-4" />
  );
}

export function CollapsiblePanel({
  side,
  title,
  icon,
  children,
  contentClassName,
  defaultOpen = true,
}: CollapsiblePanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        "absolute top-1/2 z-40 -translate-y-1/2 pointer-events-auto",
        getPanelPosition(side),
      )}
    >
      <div className="flex items-center gap-2">
        {isOpen && (
          <Card className="w-80 max-h-[calc(100vh-200px)] overflow-y-auto border-border/40 bg-background/80 backdrop-blur-xl shadow-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  {icon}
                  {title}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full"
                  onClick={() => setIsOpen(false)}
                >
                  {getOpenIcon(side)}
                </Button>
              </div>
            </CardHeader>
            <CardContent className={cn("space-y-4", contentClassName)}>{children}</CardContent>
          </Card>
        )}

        {!isOpen && (
          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-10 w-10 border-border/40 bg-background/80 backdrop-blur-xl shadow-2xl"
            onClick={() => setIsOpen(true)}
          >
            {getClosedIcon(side)}
          </Button>
        )}
      </div>
    </div>
  );
}
