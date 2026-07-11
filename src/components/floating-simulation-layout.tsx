import { useEffect, useState } from "react";
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
  const [cameraResetKey, setCameraResetKey] = useState(0);
  const informationPanelId = "simulation-information-panel";
  const controlsPanelId = "simulation-controls-panel";

  const toggleInformation = (open: boolean) => {
    setIsInformationOpen(open);
    if (open && window.matchMedia("(max-width: 767px)").matches) setIsControlsOpen(false);
  };

  const toggleControls = (open: boolean) => {
    setIsControlsOpen(open);
    if (open && window.matchMedia("(max-width: 767px)").matches) setIsInformationOpen(false);
  };

  useEffect(() => {
    const resetCamera = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key.toLowerCase() !== "r" || target.matches("input, select, textarea, button"))
        return;
      setCameraMode(defaultCameraMode);
      setCameraDirection(defaultCameraDirection);
      setCameraResetKey((key) => key + 1);
    };
    window.addEventListener("keydown", resetCamera);
    return () => window.removeEventListener("keydown", resetCamera);
  }, [defaultCameraDirection, defaultCameraMode]);

  return (
    <div className="relative h-dvh w-full">
      <Renderer
        showGrid={showGrid}
        showAxis={showAxis}
        cameraPosition={cameraPosition}
        cameraFov={cameraFov}
        cameraTarget={cameraTarget}
        cameraZoom={cameraZoom}
        cameraMode={cameraMode}
        cameraDirection={cameraDirection}
        resetKey={cameraResetKey}
        name={informationTitle}
        description={`${informationTitle}. ${controlsTitle} are available from the toolbar.`}
      >
        {children}
      </Renderer>

      <div className="absolute top-[max(1rem,env(safe-area-inset-top))] left-1/2 z-50 -translate-x-1/2 pointer-events-none">
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
            onInformationToggle={toggleInformation}
            onControlsToggle={toggleControls}
            onCameraReset={() => {
              setCameraMode(defaultCameraMode);
              setCameraDirection(defaultCameraDirection);
              setCameraResetKey((key) => key + 1);
            }}
          />
        </div>
      </div>

      <Controls
        id={controlsPanelId}
        title={controlsTitle}
        open={isControlsOpen}
        onClose={() => toggleControls(false)}
      >
        {controls}
      </Controls>

      <Information
        id={informationPanelId}
        title={informationTitle}
        open={isInformationOpen}
        onClose={() => toggleInformation(false)}
      >
        {information}
      </Information>
    </div>
  );
}
