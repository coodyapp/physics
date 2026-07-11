import { useState } from "react";
import { FloatingSimulationLayout } from "@/components/floating-simulation-layout";
import { NumberSlider } from "@/components/number-slider";
import { Label } from "@/ui/label";
import { Switch } from "@/ui/switch";
import SpacetimeGrid from "./spacetime-grid";
import CentralMass from "./central-mass";
import { schwarzschildRadius } from "@/physics/gravity";
import { PHYSICS_CONSTANTS } from "@/utils/constants";

function MassEffectSimulation() {
  const [mass, setMass] = useState<number>(PHYSICS_CONSTANTS.M_sun);
  const [gridResolution, setGridResolution] = useState(20);
  const [showCurvature, setShowCurvature] = useState(true);

  const rs = schwarzschildRadius(mass);
  const solarMass = mass / PHYSICS_CONSTANTS.M_sun;

  const controls = (
    <>
      <NumberSlider
        label="Mass"
        value={solarMass}
        min={0.1}
        max={10}
        step={0.1}
        onChange={(value) => setMass(value * PHYSICS_CONSTANTS.M_sun)}
        formatValue={(value) => `${value.toFixed(1)} M☉`}
      />

      <NumberSlider
        label="Grid Resolution"
        value={gridResolution}
        min={10}
        max={50}
        step={5}
        onChange={setGridResolution}
      />

      <div className="flex items-center justify-between">
        <Label htmlFor="curvature-toggle" className="text-sm">
          Show Gravity-Well Analogy
        </Label>
        <Switch id="curvature-toggle" checked={showCurvature} onCheckedChange={setShowCurvature} />
      </div>
    </>
  );

  const information = (
    <>
      <p className="text-muted-foreground mb-4">
        Explore a gravity-well analogy for how mass affects nearby motion
      </p>
      <div className="space-y-2 text-sm">
        <div>
          <strong>Schwarzschild Radius:</strong>
          <p className="text-muted-foreground">{(rs / 1000).toFixed(2)} km</p>
        </div>
        <div>
          <strong>Current Mass:</strong>
          <p className="text-muted-foreground">{solarMass.toFixed(2)} solar masses</p>
        </div>
        <p className="text-muted-foreground mt-4">
          The Schwarzschild radius marks the boundary of a black hole's event horizon, where the
          escape velocity equals the speed of light.
        </p>
        <p className="text-muted-foreground">
          Grid depth is a scaled gravitational-potential analogy, not a literal shape of spacetime.
        </p>
      </div>
    </>
  );

  return (
    <FloatingSimulationLayout
      controlsTitle="Mass Effect"
      informationTitle="Mass Effect on Spacetime"
      controls={controls}
      information={information}
    >
      <SpacetimeGrid mass={mass} resolution={gridResolution} showCurvature={showCurvature} />
      <CentralMass mass={mass} />
    </FloatingSimulationLayout>
  );
}

export { MassEffectSimulation };
