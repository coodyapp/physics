import { useState } from "react";
import { FloatingSimulationLayout } from "@/components/floating-simulation-layout";
import { NumberSlider } from "@/components/number-slider";
import { PHYSICS_CONSTANTS } from "@/utils/constants";
import WaveVisualization from "./wave-visualization";
import BinarySystem from "./binary-system";
import { GravitationalWavesService } from "@/physics/gravitational-waves.service";

const REFERENCE_DISTANCE_METERS = 100e6 * 3.085677581491367e16;

function GravitationalWavesSimulation() {
  const [orbitalFrequency, setOrbitalFrequency] = useState(1);
  const [visualStrainScale, setVisualStrainScale] = useState(1);
  const [mass1, setMass1] = useState(1.4 * PHYSICS_CONSTANTS.M_sun);
  const [mass2, setMass2] = useState(1.4 * PHYSICS_CONSTANTS.M_sun);

  const mass1Solar = mass1 / PHYSICS_CONSTANTS.M_sun;
  const mass2Solar = mass2 / PHYSICS_CONSTANTS.M_sun;
  const gravitationalWaveFrequency = orbitalFrequency * 2;
  const visualOrbitalFrequency = Math.min(0.6, orbitalFrequency);
  const totalMass = mass1 + mass2;
  const separation = Math.cbrt(
    (PHYSICS_CONSTANTS.G * totalMass) / (2 * Math.PI * orbitalFrequency) ** 2,
  );
  const physicalStrain = GravitationalWavesService.calculateStrainAmplitude(
    mass1,
    mass2,
    REFERENCE_DISTANCE_METERS,
    gravitationalWaveFrequency,
  );

  const controls = (
    <>
      <NumberSlider
        label="Orbital Frequency"
        value={orbitalFrequency}
        min={0.1}
        max={10}
        step={0.1}
        onChange={setOrbitalFrequency}
        formatValue={(value) => `${value.toFixed(1)} Hz`}
      />

      <NumberSlider
        label="Visual Strain Scale"
        value={visualStrainScale}
        min={0.1}
        max={5}
        step={0.1}
        onChange={setVisualStrainScale}
      />

      <NumberSlider
        label="Mass 1"
        value={mass1Solar}
        min={0.5}
        max={10}
        step={0.1}
        onChange={(value) => setMass1(value * PHYSICS_CONSTANTS.M_sun)}
        formatValue={(value) => `${value.toFixed(1)} M☉`}
      />

      <NumberSlider
        label="Mass 2"
        value={mass2Solar}
        min={0.5}
        max={10}
        step={0.1}
        onChange={(value) => setMass2(value * PHYSICS_CONSTANTS.M_sun)}
        formatValue={(value) => `${value.toFixed(1)} M☉`}
      />
    </>
  );

  const information = (
    <>
      <p className="text-muted-foreground mb-4">
        Explore ripples in spacetime caused by accelerating massive objects
      </p>
      <div className="space-y-2 text-sm">
        <p className="text-muted-foreground">
          Gravitational waves are ripples in the fabric of spacetime caused by accelerating masses.
        </p>
        <p className="text-muted-foreground">
          Left: gravitational-potential analogy. Right: stylized strain. Playback is capped at 0.6
          visual orbits/s to avoid aliasing; strain height is not physical scale.
        </p>
        <div>
          <strong>Physical GW Frequency:</strong>
          <p className="text-muted-foreground">{gravitationalWaveFrequency.toFixed(2)} Hz</p>
        </div>
        <div>
          <strong>Playback Rates:</strong>
          <p className="text-muted-foreground">
            {visualOrbitalFrequency.toFixed(2)} visual orbits/s ·{" "}
            {(visualOrbitalFrequency * 2).toFixed(2)} visual wave cycles/s
          </p>
        </div>
        <div>
          <strong>Reference Strain:</strong>
          <p className="text-muted-foreground">
            {physicalStrain.toExponential(2)} at 100 Mpc · separation {separation.toExponential(2)}{" "}
            m
          </p>
        </div>
        <div>
          <strong>Total Mass:</strong>
          <p className="text-muted-foreground">{(mass1Solar + mass2Solar).toFixed(2)} M☉</p>
        </div>
      </div>
    </>
  );

  return (
    <FloatingSimulationLayout
      controlsTitle="Gravitational Waves"
      informationTitle="Gravitational Waves"
      controls={controls}
      information={information}
    >
      <BinarySystem mass1={mass1} mass2={mass2} frequency={visualOrbitalFrequency} />
      <WaveVisualization frequency={visualOrbitalFrequency * 2} amplitude={visualStrainScale} />
    </FloatingSimulationLayout>
  );
}

export { GravitationalWavesSimulation };
