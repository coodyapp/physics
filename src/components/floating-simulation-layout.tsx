import { useState } from "react";
import type { ReactNode } from "react";

import Controls from "@/components/controls";
import Information from "@/components/information";
import Renderer from "@/components/renderer";

interface FloatingSimulationLayoutProps {
  controlsTitle: string;
  informationTitle: string;
  controls: ReactNode;
  information: ReactNode;
  children: ReactNode;
  cameraPosition?: [number, number, number];
  cameraFov?: number;
  cameraTarget?: [number, number, number];
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
}: FloatingSimulationLayoutProps) {
  const [showGrid, setShowGrid] = useState(true);
  const [showAxis, setShowAxis] = useState(true);

  return (
    <div className="h-screen w-full relative">
      <Renderer
        showGrid={showGrid}
        showAxis={showAxis}
        cameraPosition={cameraPosition}
        cameraFov={cameraFov}
        cameraTarget={cameraTarget}
      >
        {children}
      </Renderer>

      <Controls
        title={controlsTitle}
        showGrid={showGrid}
        showAxis={showAxis}
        onGridToggle={setShowGrid}
        onAxisToggle={setShowAxis}
      >
        {controls}
      </Controls>

      <Information title={informationTitle}>{information}</Information>
    </div>
  );
}
