import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { cn } from "@/utils/tailwind";
import { Button } from "@/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

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
  onClose: () => void;
}

function getPanelPosition(side: PanelSide) {
  return side === "left" ? "md:left-4" : "md:right-4";
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
  onClose,
}: CollapsiblePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!open || !isMobile) return;
    panelRef.current?.focus();
  }, [isMobile, open]);

  if (!open) return null;

  return (
    <div
      className={cn(
        "absolute inset-x-4 top-[calc(max(1rem,env(safe-area-inset-top))+4.5rem)] bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 pointer-events-auto md:inset-x-auto md:top-20 md:bottom-auto",
        getPanelPosition(side),
      )}
    >
      <div className="flex items-start gap-2">
        <Card
          ref={panelRef}
          id={id}
          role={isMobile ? "dialog" : "region"}
          aria-modal={isMobile || undefined}
          aria-label={title}
          tabIndex={-1}
          onKeyDown={(event) => {
            if (event.key === "Escape") onClose();
          }}
          className="max-h-full w-full overflow-y-auto border-border/55 bg-background/65 shadow-2xl backdrop-blur-2xl dark:bg-background/55 md:w-[min(20rem,calc(100vw-2rem))] md:max-h-[calc(100dvh-6rem)]"
        >
          {(showTitle || title) && (
            <CardHeader className={cn("pb-3", !showTitle && "md:hidden")}>
              <CardTitle className="flex items-center gap-2 pr-10 text-base">
                {icon}
                {title}
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-3 top-3 md:hidden"
                aria-label={`Close ${title}`}
                onClick={onClose}
              >
                <X />
              </Button>
            </CardHeader>
          )}
          <CardContent className={cn("space-y-4", contentClassName)}>{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}
