import { useState } from "react";
import type { ReactNode } from "react";

import Controls from "@/components/controls";
import Header from "@/components/header";
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
  const [isInformationOpen, setIsInformationOpen] = useState(false);
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraViewMode>(defaultCameraMode);
  const [cameraDirection, setCameraDirection] =
    useState<CameraViewDirection>(defaultCameraDirection);
  const informationPanelId = "simulation-information-panel";
  const controlsPanelId = "simulation-controls-panel";

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

      <div className="absolute top-4 left-1/2 z-50 -translate-x-1/2 pointer-events-none">
        <div className="pointer-events-auto">
          <Header
            showGrid={showGrid}
            showAxis={showAxis}
            cameraMode={cameraMode}
            cameraDirection={cameraDirection}
            isInformationOpen={isInformationOpen}
            isControlsOpen={isControlsOpen}
            informationPanelId={informationPanelId}
            controlsPanelId={controlsPanelId}
            onGridToggle={setShowGrid}
            onAxisToggle={setShowAxis}
            onCameraModeChange={setCameraMode}
            onCameraDirectionChange={setCameraDirection}
            onInformationToggle={setIsInformationOpen}
            onControlsToggle={setIsControlsOpen}
          />
        </div>
      </div>

      <Controls id={controlsPanelId} title={controlsTitle} open={isControlsOpen}>
        {controls}
      </Controls>

      <Information id={informationPanelId} title={informationTitle} open={isInformationOpen}>
        {information}
      </Information>
    </div>
  );
}
