import { useState } from "react";
import { FloatingSimulationLayout } from "@/components/floating-simulation-layout";
import { NumberSlider } from "@/components/number-slider";
import { PHYSICS_CONSTANTS } from "@/utils/constants";
import WaveVisualization from "./wave-visualization";
import BinarySystem from "./binary-system";

function GravitationalWavesSimulation() {
  const [frequency, setFrequency] = useState(1);
  const [amplitude, setAmplitude] = useState(1);
  const [mass1, setMass1] = useState(1.4 * PHYSICS_CONSTANTS.M_sun);
  const [mass2, setMass2] = useState(1.4 * PHYSICS_CONSTANTS.M_sun);

  const mass1Solar = mass1 / PHYSICS_CONSTANTS.M_sun;
  const mass2Solar = mass2 / PHYSICS_CONSTANTS.M_sun;

  const controls = (
    <>
      <NumberSlider
        label="Frequency"
        value={frequency}
        min={0.1}
        max={10}
        step={0.1}
        onChange={setFrequency}
        formatValue={(value) => `${value.toFixed(1)} Hz`}
      />

      <NumberSlider
        label="Amplitude"
        value={amplitude}
        min={0.1}
        max={5}
        step={0.1}
        onChange={setAmplitude}
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
      <BinarySystem mass1={mass1} mass2={mass2} frequency={frequency} />
      <WaveVisualization frequency={frequency} amplitude={amplitude} />
    </FloatingSimulationLayout>
  );
}

export { GravitationalWavesSimulation };
