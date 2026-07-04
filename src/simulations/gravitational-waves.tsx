import { useState } from "react";
import Renderer from "@/components/renderer";
import Controls from "@/components/controls";
import InfoPanel from "@/components/information";
import { Slider } from "@/ui/slider";
import { Label } from "@/ui/label";
import WaveVisualization from "./wave-visualization";
import BinarySystem from "./binary-system";

function GravitationalWavesSimulation() {
  const [showGrid, setShowGrid] = useState(true);
  const [showAxis, setShowAxis] = useState(true);
  const [frequency, setFrequency] = useState(1);
  const [amplitude, setAmplitude] = useState(1);
  const [mass1, setMass1] = useState(1.4e30);
  const [mass2, setMass2] = useState(1.4e30);

  return (
    <div className="h-screen w-full relative">
      <Renderer showGrid={showGrid} showAxis={showAxis}>
        <BinarySystem mass1={mass1} mass2={mass2} frequency={frequency} />
        <WaveVisualization frequency={frequency} amplitude={amplitude} />
      </Renderer>

      {/* Controls Panel */}
      <Controls
        title="Gravitational Waves"
        showGrid={showGrid}
        showAxis={showAxis}
        onGridToggle={setShowGrid}
        onAxisToggle={setShowAxis}
      >
        <div className="space-y-4">
          <div>
            <Label>Frequency (Hz)</Label>
            <Slider
              value={[frequency]}
              onValueChange={([v]) => setFrequency(v)}
              min={0.1}
              max={10}
              step={0.1}
            />
            <span className="text-sm text-muted-foreground">{frequency.toFixed(1)} Hz</span>
          </div>

          <div>
            <Label>Amplitude</Label>
            <Slider
              value={[amplitude]}
              onValueChange={([v]) => setAmplitude(v)}
              min={0.1}
              max={5}
              step={0.1}
            />
            <span className="text-sm text-muted-foreground">{amplitude.toFixed(1)}</span>
          </div>

          <div>
            <Label>Mass 1 (M☉)</Label>
            <Slider
              value={[mass1 / 1e30]}
              onValueChange={([v]) => setMass1(v * 1e30)}
              min={0.5}
              max={10}
              step={0.1}
            />
            <span className="text-sm text-muted-foreground">{(mass1 / 1e30).toFixed(1)} M☉</span>
          </div>

          <div>
            <Label>Mass 2 (M☉)</Label>
            <Slider
              value={[mass2 / 1e30]}
              onValueChange={([v]) => setMass2(v * 1e30)}
              min={0.5}
              max={10}
              step={0.1}
            />
            <span className="text-sm text-muted-foreground">{(mass2 / 1e30).toFixed(1)} M☉</span>
          </div>
        </div>
      </Controls>

      {/* Information Panel */}
      <InfoPanel title="Gravitational Waves">
        <p className="text-muted-foreground mb-4">
          Explore ripples in spacetime caused by accelerating massive objects
        </p>
        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            Gravitational waves are ripples in the fabric of spacetime caused by accelerating
            masses.
          </p>
          <div>
            <strong>Total Mass:</strong>
            <p className="text-muted-foreground">{((mass1 + mass2) / 1e30).toFixed(2)} M☉</p>
          </div>
        </div>
      </InfoPanel>
    </div>
  );
}

export { GravitationalWavesSimulation };
