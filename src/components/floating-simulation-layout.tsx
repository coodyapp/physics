import { useState } from "react";
import type { ReactNode } from "react";

import Controls from "@/components/controls";
import Information from "@/components/information";
import Renderer from "@/components/renderer";
import type { CameraViewDirection, CameraViewMode } from "@/components/renderer";

interface FloatingSimulationLayoutProps {
  controlsTitle: string;
  informationTitle: string;
  controls: ReactNode;
  information: ReactNode;
  children: ReactNode;
  cameraPosition?: [number, number, number];
  cameraFov?: number;
  cameraTarget?: [number, number, number];
  cameraZoom?: number;
  defaultCameraMode?: CameraViewMode;
  defaultCameraDirection?: CameraViewDirection;
}

export function FloatingSimulationLayout({
  controlsTitle,
  informationTitle,
  controls,
  information,
  children,
  cameraPosition,
  cameraFov,
  cameraTarget,
  cameraZoom,
  defaultCameraMode = "3d",
  defaultCameraDirection = "isometric",
}: FloatingSimulationLayoutProps) {
  const [showGrid, setShowGrid] = useState(true);
  const [showAxis, setShowAxis] = useState(true);
  const [cameraMode, setCameraMode] = useState<CameraViewMode>(defaultCameraMode);
  const [cameraDirection, setCameraDirection] =
    useState<CameraViewDirection>(defaultCameraDirection);

  return (
    <div className="h-screen w-full relative">
      <Renderer
        showGrid={showGrid}
        showAxis={showAxis}
        cameraPosition={cameraPosition}
        cameraFov={cameraFov}
        cameraTarget={cameraTarget}
        cameraZoom={cameraZoom}
        cameraMode={cameraMode}
        cameraDirection={cameraDirection}
      >
        {children}
      </Renderer>

      <Controls
        title={controlsTitle}
        showGrid={showGrid}
        showAxis={showAxis}
        cameraMode={cameraMode}
        cameraDirection={cameraDirection}
        onGridToggle={setShowGrid}
        onAxisToggle={setShowAxis}
        onCameraModeChange={setCameraMode}
        onCameraDirectionChange={setCameraDirection}
      >
        {controls}
      </Controls>

      <Information title={informationTitle}>{information}</Information>
    </div>
  );
}
