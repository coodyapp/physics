import type { ReactNode } from "react";
import { Settings } from "lucide-react";

import { CollapsiblePanel } from "@/components/collapsible-panel";
import { Label } from "@/ui/label";
import { Switch } from "@/ui/switch";

interface ControlsProps {
  title?: string;
  children: ReactNode;
  showGrid?: boolean;
  showAxis?: boolean;
  onGridToggle?: (value: boolean) => void;
  onAxisToggle?: (value: boolean) => void;
}

function ViewControls({
  showGrid,
  showAxis,
  onGridToggle,
  onAxisToggle,
}: Pick<ControlsProps, "showGrid" | "showAxis" | "onGridToggle" | "onAxisToggle">) {
  return (
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
  );
}

export default function Controls({
  title = "Controls",
  children,
  showGrid = true,
  showAxis = true,
  onGridToggle,
  onAxisToggle,
}: ControlsProps) {
  return (
    <CollapsiblePanel side="right" title={title} icon={<Settings className="h-4 w-4" />}>
      <ViewControls
        showGrid={showGrid}
        showAxis={showAxis}
        onGridToggle={onGridToggle}
        onAxisToggle={onAxisToggle}
      />
      {children}
    </CollapsiblePanel>
  );
}
