import { useState } from "react";
import Renderer from "@/components/renderer";
import Controls from "@/components/controls";
import InfoPanel from "@/components/information";
import { Slider } from "@/ui/slider";
import { Label } from "@/ui/label";
import { Switch } from "@/ui/switch";
import SpacetimeGrid from "./spacetime-grid";
import CentralMass from "./central-mass";
import { schwarzschildRadius } from "@/physics/gravity";

function MassEffectSimulation() {
  const [showGrid, setShowGrid] = useState(true);
  const [showAxis, setShowAxis] = useState(true);
  const [mass, setMass] = useState(1e30); // Solar mass
  const [gridResolution, setGridResolution] = useState(20);
  const [showCurvature, setShowCurvature] = useState(true);

  const rs = schwarzschildRadius(mass);

  return (
    <div className="h-screen w-full relative">
      <Renderer showGrid={showGrid} showAxis={showAxis}>
        <SpacetimeGrid mass={mass} resolution={gridResolution} showCurvature={showCurvature} />
        <CentralMass mass={mass} />
      </Renderer>

      {/* Controls Panel */}
      <Controls
        title="Mass Effect"
        showGrid={showGrid}
        showAxis={showAxis}
        onGridToggle={setShowGrid}
        onAxisToggle={setShowAxis}
      >
        <div className="space-y-4">
          <div>
            <Label>Mass (×10³⁰ kg)</Label>
            <Slider
              value={[mass / 1e30]}
              onValueChange={([v]) => setMass(v * 1e30)}
              min={0.1}
              max={10}
              step={0.1}
            />
            <span className="text-sm text-muted-foreground">{(mass / 1e30).toFixed(1)} M☉</span>
          </div>

          <div>
            <Label>Grid Resolution</Label>
            <Slider
              value={[gridResolution]}
              onValueChange={([v]) => setGridResolution(v)}
              min={10}
              max={50}
              step={5}
            />
            <span className="text-sm text-muted-foreground">{gridResolution}</span>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="curvature-toggle" className="text-sm">
              Show Curvature
            </Label>
            <Switch
              id="curvature-toggle"
              checked={showCurvature}
              onCheckedChange={setShowCurvature}
            />
          </div>
        </div>
      </Controls>

      {/* Information Panel */}
      <InfoPanel title="Mass Effect on Spacetime">
        <p className="text-muted-foreground mb-4">
          Visualize how mass curves spacetime according to Einstein's General Relativity
        </p>
        <div className="space-y-2 text-sm">
          <div>
            <strong>Schwarzschild Radius:</strong>
            <p className="text-muted-foreground">{(rs / 1000).toFixed(2)} km</p>
          </div>
          <div>
            <strong>Current Mass:</strong>
            <p className="text-muted-foreground">{(mass / 1e30).toFixed(2)} solar masses</p>
          </div>
          <p className="text-muted-foreground mt-4">
            The Schwarzschild radius marks the boundary of a black hole's event horizon, where the
            escape velocity equals the speed of light.
          </p>
        </div>
      </InfoPanel>
    </div>
  );
}

export { MassEffectSimulation };
