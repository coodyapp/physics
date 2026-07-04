import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { Info, ChevronLeft, ChevronRight } from "lucide-react";
import { ReactNode, useState } from "react";

interface InformationProps {
  title: string;
  children: ReactNode;
}

export default function Information({ title, children }: InformationProps) {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <div className="absolute top-1/2 -translate-y-1/2 left-4 z-40 pointer-events-auto">
      <div className="flex items-center gap-2">
        {/* Information Panel */}
        {isVisible && (
          <Card className="w-80 max-h-[calc(100vh-200px)] overflow-y-auto border-border/40 bg-background/80 backdrop-blur-xl shadow-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  {title}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full"
                  onClick={() => setIsVisible(false)}
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              {children}
            </CardContent>
          </Card>
        )}

        {/* Toggle Button */}
        {!isVisible && (
          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-10 w-10 border-border/40 bg-background/80 backdrop-blur-xl shadow-2xl"
            onClick={() => setIsVisible(true)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
