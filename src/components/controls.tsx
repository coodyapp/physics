import type { ReactNode } from "react";
import { Settings } from "lucide-react";

import { CollapsiblePanel } from "@/components/collapsible-panel";
import type { CameraViewDirection, CameraViewMode } from "@/components/renderer";
import { Button } from "@/ui/button";
import { Label } from "@/ui/label";
import { Switch } from "@/ui/switch";

interface ControlsProps {
  title?: string;
  children: ReactNode;
  showGrid?: boolean;
  showAxis?: boolean;
  cameraMode: CameraViewMode;
  cameraDirection: CameraViewDirection;
  onGridToggle?: (value: boolean) => void;
  onAxisToggle?: (value: boolean) => void;
  onCameraModeChange: (value: CameraViewMode) => void;
  onCameraDirectionChange: (value: CameraViewDirection) => void;
}

const CAMERA_MODES: { value: CameraViewMode; label: string }[] = [
  { value: "3d", label: "3D" },
  { value: "2d", label: "2D" },
];

const CAMERA_DIRECTIONS: { value: CameraViewDirection; label: string }[] = [
  { value: "isometric", label: "Iso" },
  { value: "xy", label: "XY" },
  { value: "xz", label: "XZ" },
  { value: "yz", label: "YZ" },
];

function ViewControls({
  showGrid,
  showAxis,
  cameraMode,
  cameraDirection,
  onGridToggle,
  onAxisToggle,
  onCameraModeChange,
  onCameraDirectionChange,
}: Pick<
  ControlsProps,
  | "showGrid"
  | "showAxis"
  | "cameraMode"
  | "cameraDirection"
  | "onGridToggle"
  | "onAxisToggle"
  | "onCameraModeChange"
  | "onCameraDirectionChange"
>) {
  return (
    <div className="space-y-3 pb-3 border-b border-border/40">
      <div className="space-y-2">
        <Label className="text-sm">Camera</Label>
        <div className="grid grid-cols-2 gap-2">
          {CAMERA_MODES.map((mode) => (
            <Button
              key={mode.value}
              type="button"
              size="sm"
              variant={cameraMode === mode.value ? "default" : "outline"}
              aria-pressed={cameraMode === mode.value}
              onClick={() => onCameraModeChange(mode.value)}
            >
              {mode.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm">View Direction</Label>
        <div className="grid grid-cols-4 gap-2">
          {CAMERA_DIRECTIONS.map((direction) => (
            <Button
              key={direction.value}
              type="button"
              size="sm"
              variant={cameraDirection === direction.value ? "default" : "outline"}
              aria-pressed={cameraDirection === direction.value}
              className="px-2"
              onClick={() => onCameraDirectionChange(direction.value)}
            >
              {direction.label}
            </Button>
          ))}
        </div>
      </div>

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
  cameraMode,
  cameraDirection,
  onGridToggle,
  onAxisToggle,
  onCameraModeChange,
  onCameraDirectionChange,
}: ControlsProps) {
  return (
    <CollapsiblePanel side="right" title={title} icon={<Settings className="h-4 w-4" />}>
      <ViewControls
        showGrid={showGrid}
        showAxis={showAxis}
        cameraMode={cameraMode}
        cameraDirection={cameraDirection}
        onGridToggle={onGridToggle}
        onAxisToggle={onAxisToggle}
        onCameraModeChange={onCameraModeChange}
        onCameraDirectionChange={onCameraDirectionChange}
      />
      {children}
    </CollapsiblePanel>
  );
}
