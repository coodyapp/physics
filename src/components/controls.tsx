import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { Label } from "@/ui/label";
import { Switch } from "@/ui/switch";
import { Settings, ChevronRight, ChevronLeft } from "lucide-react";
import { ReactNode, useState } from "react";

interface ControlsProps {
  title?: string;
  children: ReactNode;
  showGrid?: boolean;
  showAxis?: boolean;
  onGridToggle?: (value: boolean) => void;
  onAxisToggle?: (value: boolean) => void;
}

export default function Controls({
  title = "Controls",
  children,
  showGrid = true,
  showAxis = true,
  onGridToggle,
  onAxisToggle,
}: ControlsProps) {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <div className="absolute top-1/2 -translate-y-1/2 right-4 z-40 pointer-events-auto">
      <div className="flex items-center gap-2">
        {/* Toggle Button */}
        {!isVisible && (
          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-10 w-10 border-border/40 bg-background/80 backdrop-blur-xl shadow-2xl"
            onClick={() => setIsVisible(true)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Controls Panel */}
        {isVisible && (
          <Card className="w-80 max-h-[calc(100vh-200px)] overflow-y-auto border-border/40 bg-background/80 backdrop-blur-xl shadow-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  {title}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full"
                  onClick={() => setIsVisible(false)}
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* View Controls */}
              <div className="space-y-3 pb-3 border-b border-border/40">
                <div className="flex items-center justify-between">
                  <Label htmlFor="grid-toggle" className="text-sm">
                    Show Grid
                  </Label>
                  <Switch id="grid-toggle" checked={showGrid} onCheckedChange={onGridToggle} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="axis-toggle" className="text-sm">
                    Show Axis
                  </Label>
                  <Switch id="axis-toggle" checked={showAxis} onCheckedChange={onAxisToggle} />
                </div>
              </div>

              {children}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
