import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import * as THREE from "three";

import { NumberSlider } from "@/components/number-slider";
import { Button } from "@/ui/button";
import { LabSimulationLayout, useMotionEnabled } from "@/simulations/physics-labs";
import type { LabRouteProps } from "@/simulations/physics-labs";
import { SIMULATION_COLORS } from "@/utils/constants";

const TAU = Math.PI * 2;

function KeplerScene({ eccentricity, speed }: { eccentricity: number; speed: number }) {
  const planet = useRef<THREE.Mesh>(null);
  const sectorMaterials = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const elapsed = useRef(0);
  const running = useMotionEnabled();
  const a = 4;
  const b = a * Math.sqrt(1 - eccentricity * eccentricity);
  const focus = a * eccentricity;
  const orbit = useMemo(
    () =>
      Array.from({ length: 129 }, (_, index) => {
        const angle = (index / 128) * TAU;
        return [a * Math.cos(angle), 0, b * Math.sin(angle)] as [number, number, number];
      }),
    [b],
  );
  const sectors = useMemo(() => {
    const solve = (meanAnomaly: number) => {
      let eccentricAnomaly = meanAnomaly;
      for (let i = 0; i < 8; i++)
        eccentricAnomaly -=
          (eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly) - meanAnomaly) /
          (1 - eccentricity * Math.cos(eccentricAnomaly));
      return eccentricAnomaly;
    };
    return Array.from({ length: 8 }, (_, sector) => {
      const positions: number[] = [];
      for (let step = 0; step < 8; step++) {
        const start = solve(((sector + step / 8) / 8) * TAU);
        const end = solve(((sector + (step + 1) / 8) / 8) * TAU);
        positions.push(
          focus,
          0.03,
          0,
          a * Math.cos(start),
          0.03,
          b * Math.sin(start),
          a * Math.cos(end),
          0.03,
          b * Math.sin(end),
        );
      }
      return new Float32Array(positions);
    });
  }, [b, eccentricity, focus]);

  useFrame((_, delta) => {
    if (running) elapsed.current += delta * speed;
    const meanAnomaly = ((elapsed.current % TAU) + TAU) % TAU;
    let anomaly = meanAnomaly;
    for (let i = 0; i < 8; i++)
      anomaly -=
        (anomaly - eccentricity * Math.sin(anomaly) - meanAnomaly) /
        (1 - eccentricity * Math.cos(anomaly));
    const x = a * Math.cos(anomaly);
    const z = b * Math.sin(anomaly);
    planet.current?.position.set(x, 0.25, z);
    const currentSector = Math.floor((meanAnomaly / TAU) * 8) % 8;
    sectorMaterials.current.forEach((material, index) => {
      if (material) material.opacity = index === currentSector ? 0.5 : 0.14;
    });
  });

  return (
    <>
      <Line points={orbit} color={SIMULATION_COLORS.positive} lineWidth={2} />
      <mesh position={[focus, 0.2, 0]}>
        <sphereGeometry args={[0.42, 32, 32]} />
        <meshStandardMaterial
          color={SIMULATION_COLORS.source}
          emissive={SIMULATION_COLORS.sourceEmissive}
          emissiveIntensity={2}
        />
      </mesh>
      <mesh ref={planet}>
        <sphereGeometry args={[0.2, 24, 24]} />
        <meshStandardMaterial color={SIMULATION_COLORS.negative} />
      </mesh>
      {sectors.map((positions, index) => (
        <mesh key={index}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          </bufferGeometry>
          <meshBasicMaterial
            ref={(material) => {
              sectorMaterials.current[index] = material;
            }}
            color={index % 2 ? "#f59e0b" : "#fde68a"}
            opacity={index === 0 ? 0.5 : 0.14}
            side={THREE.DoubleSide}
            transparent
          />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.02, 0.06, 24]} />
        <meshBasicMaterial color={SIMULATION_COLORS.foreground} />
      </mesh>
    </>
  );
}

function KeplerLab({ definition }: LabRouteProps) {
  const [eccentricity, setEccentricity] = useState(0.45);
  const [speed, setSpeed] = useState(0.8);
  return (
    <LabSimulationLayout
      definition={definition}
      cameraPosition={[0, 8, 0.01]}
      controls={
        <>
          <NumberSlider
            label="Eccentricity"
            value={eccentricity}
            min={0}
            max={0.85}
            step={0.01}
            onChange={setEccentricity}
          />
          <NumberSlider
            label="Orbital rate"
            value={speed}
            min={0.1}
            max={2}
            step={0.1}
            onChange={setSpeed}
          />
          <output aria-live="polite">
            Simulation period: {(TAU / speed).toFixed(2)} s; highlighted wedge: current of 8
            equal-time sectors
          </output>
        </>
      }
    >
      <KeplerScene eccentricity={eccentricity} speed={speed} />
    </LabSimulationLayout>
  );
}

function SolarScene({ massRatio, speed }: { massRatio: number; speed: number }) {
  const system = useRef<THREE.Group>(null);
  const elapsed = useRef(0);
  const running = useMotionEnabled();
  const r1 = (5 * massRatio) / (1 + massRatio);
  const r2 = 5 / (1 + massRatio);
  const angularRate = speed * Math.sqrt((1 + massRatio) / 3);
  useFrame((_, delta) => {
    if (running) elapsed.current += delta;
    if (system.current) system.current.rotation.y = elapsed.current * angularRate;
  });
  return (
    <>
      <group ref={system}>
        <mesh position={[-r1, 0, 0]}>
          <sphereGeometry args={[0.42, 24, 24]} />
          <meshStandardMaterial color="#38bdf8" emissive="#0284c7" />
        </mesh>
        <mesh position={[r2, 0, 0]}>
          <sphereGeometry args={[0.42 * Math.cbrt(massRatio), 24, 24]} />
          <meshStandardMaterial color="#fb7185" emissive="#be123c" />
        </mesh>
      </group>
      <Line
        points={Array.from(
          { length: 65 },
          (_, i) =>
            [r1 * Math.cos((i / 64) * TAU), 0, r1 * Math.sin((i / 64) * TAU)] as [
              number,
              number,
              number,
            ],
        )}
        color="#38bdf8"
        transparent
        opacity={0.45}
      />
      <Line
        points={Array.from(
          { length: 65 },
          (_, i) =>
            [r2 * Math.cos((i / 64) * TAU), 0, r2 * Math.sin((i / 64) * TAU)] as [
              number,
              number,
              number,
            ],
        )}
        color="#fb7185"
        transparent
        opacity={0.45}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.04, 0.1, 24]} />
        <meshBasicMaterial color={SIMULATION_COLORS.foreground} />
      </mesh>
    </>
  );
}

function SolarLab({ definition }: LabRouteProps) {
  const [ratio, setRatio] = useState(2);
  const [speed, setSpeed] = useState(0.6);
  const angularRate = speed * Math.sqrt((1 + ratio) / 3);
  return (
    <LabSimulationLayout
      definition={definition}
      cameraPosition={[0, 8, 6]}
      controls={
        <>
          <NumberSlider
            label="Mass ratio (red / blue)"
            value={ratio}
            min={0.3}
            max={4}
            step={0.1}
            onChange={setRatio}
          />
          <NumberSlider
            label="Rate scale"
            value={speed}
            min={0.1}
            max={2}
            step={0.1}
            onChange={setSpeed}
          />
          <output aria-live="polite">
            Red:blue mass = {ratio.toFixed(1)}:1; red/blue orbit radii ={" "}
            {(5 / (1 + ratio)).toFixed(2)} / {((5 * ratio) / (1 + ratio)).toFixed(2)} world units;
            angular rate = {angularRate.toFixed(2)} rad/s simulation time
          </output>
        </>
      }
    >
      <SolarScene massRatio={ratio} speed={speed} />
    </LabSimulationLayout>
  );
}

function TorqueScene({
  leftMass,
  rightMass,
  leftArm,
  rightArm,
}: {
  leftMass: number;
  rightMass: number;
  leftArm: number;
  rightArm: number;
}) {
  const plank = useRef<THREE.Group>(null);
  const angle = useRef(0);
  const angularVelocity = useRef(0);
  const running = useMotionEnabled();
  useEffect(() => {
    angle.current = 0;
    angularVelocity.current = 0;
  }, [leftArm, leftMass, rightArm, rightMass]);
  useFrame((_, delta) => {
    if (!running) return;
    const step = Math.min(delta, 1 / 30);
    const plankMass = 2;
    const plankInertia = (plankMass * 9 ** 2) / 12;
    const loadInertia = leftMass * leftArm ** 2 + rightMass * rightArm ** 2;
    const netTorque = (leftMass * leftArm - rightMass * rightArm) * 9.81 * Math.cos(angle.current);
    const drive = (netTorque / (plankInertia + loadInertia)) * 0.22;
    const overTravel = Math.max(0, Math.abs(angle.current) - 0.4);
    const contact = overTravel ? -Math.sign(angle.current) * overTravel * 90 : 0;
    const angularAcceleration = drive + contact;
    angularVelocity.current += angularAcceleration * step;
    angularVelocity.current *= Math.exp(-(overTravel ? 7 : 2.2) * step);
    angle.current += angularVelocity.current * step;
    if (Math.abs(angle.current) > 0.46) {
      angle.current = THREE.MathUtils.clamp(angle.current, -0.46, 0.46);
      angularVelocity.current *= -0.12;
    }
    if (plank.current) plank.current.rotation.z = angle.current;
  });
  return (
    <>
      <group ref={plank}>
        <mesh>
          <boxGeometry args={[9, 0.22, 0.8]} />
          <meshStandardMaterial color="#f59e0b" />
        </mesh>
        {Array.from({ length: 9 }, (_, i) => (
          <mesh key={i} position={[i - 4, 0.18, 0.41]}>
            <boxGeometry args={[0.025, 0.18, 0.02]} />
            <meshBasicMaterial color="#451a03" />
          </mesh>
        ))}
        <mesh position={[-leftArm, 0.65, 0]}>
          <boxGeometry args={[0.55, 0.9 + leftMass * 0.12, 0.55]} />
          <meshStandardMaterial color={SIMULATION_COLORS.positive} />
        </mesh>
        <mesh position={[rightArm, 0.65, 0]}>
          <boxGeometry args={[0.55, 0.9 + rightMass * 0.12, 0.55]} />
          <meshStandardMaterial color={SIMULATION_COLORS.negative} />
        </mesh>
      </group>
      <mesh position={[0, -0.75, 0]}>
        <coneGeometry args={[0.7, 1.5, 4]} />
        <meshStandardMaterial color={SIMULATION_COLORS.structure} />
      </mesh>
    </>
  );
}

function TorqueLab({ definition }: LabRouteProps) {
  const [leftMass, setLeftMass] = useState(3),
    [rightMass, setRightMass] = useState(2),
    [leftArm, setLeftArm] = useState(2),
    [rightArm, setRightArm] = useState(3);
  const leftTorque = leftMass * 9.81 * leftArm;
  const rightTorque = rightMass * 9.81 * rightArm;
  return (
    <LabSimulationLayout
      definition={definition}
      cameraPosition={[0, 3, 9]}
      controls={
        <>
          <NumberSlider
            label="Left mass (kg)"
            value={leftMass}
            min={1}
            max={8}
            step={1}
            onChange={setLeftMass}
          />
          <NumberSlider
            label="Left distance (m)"
            value={leftArm}
            min={1}
            max={4}
            step={0.5}
            onChange={setLeftArm}
          />
          <NumberSlider
            label="Right mass (kg)"
            value={rightMass}
            min={1}
            max={8}
            step={1}
            onChange={setRightMass}
          />
          <NumberSlider
            label="Right distance (m)"
            value={rightArm}
            min={1}
            max={4}
            step={0.5}
            onChange={setRightArm}
          />
          <output aria-live="polite">
            Torque: left {leftTorque.toFixed(1)} N·m, right {rightTorque.toFixed(1)} N·m; net{" "}
            {(leftTorque - rightTorque).toFixed(1)} N·m (
            {Math.abs(leftTorque - rightTorque) < 0.05 ? "balanced" : "unbalanced"})
          </output>
        </>
      }
    >
      <TorqueScene {...{ leftMass, rightMass, leftArm, rightArm }} />
    </LabSimulationLayout>
  );
}

function ProjectileDataScene({
  angle,
  speed,
  spread,
  runs,
}: {
  angle: number;
  speed: number;
  spread: number;
  runs: number;
}) {
  const samples = projectileSamples(angle, speed, spread, runs);
  const mean = samples.reduce((sum, value) => sum + value, 0) / samples.length;
  const minRange = Math.min(...samples);
  const maxRange = Math.max(...samples);
  const padding = Math.max(1, (maxRange - minRange) * 0.12);
  const domainMin = 0;
  const domainMax = maxRange + padding;
  const toWorldX = (range: number) => -4.4 + ((range - domainMin) / (domainMax - domainMin)) * 8.8;
  const bins = Array.from(
    { length: 10 },
    (_, bin) =>
      samples.filter((range) =>
        bin === 9
          ? range >= domainMin + ((domainMax - domainMin) * bin) / 10
          : range >= domainMin + ((domainMax - domainMin) * bin) / 10 &&
            range < domainMin + ((domainMax - domainMin) * (bin + 1)) / 10,
      ).length,
  );
  const maxBin = Math.max(...bins, 1);
  const trajectorySpeeds = [speed * (1 - spread / 100), speed, speed * (1 + spread / 100)];
  const trajectories = trajectorySpeeds.map((launchSpeed) => {
    const radians = (angle * Math.PI) / 180;
    const flightTime = (2 * launchSpeed * Math.sin(radians)) / 9.81;
    return Array.from({ length: 65 }, (_, i) => {
      const t = (i / 64) * flightTime;
      const x = launchSpeed * Math.cos(radians) * t;
      const y = launchSpeed * Math.sin(radians) * t - 4.905 * t * t;
      return [
        toWorldX(x),
        Math.max(0, y * (2.4 / Math.max(1, (launchSpeed ** 2 * Math.sin(radians) ** 2) / 19.62))),
        0,
      ] as [number, number, number];
    });
  });
  return (
    <>
      {trajectories.map((trajectory, index) => (
        <Line
          key={trajectorySpeeds[index]}
          points={trajectory}
          color={index === 1 ? "#38bdf8" : "#7dd3fc"}
          lineWidth={index === 1 ? 2.5 : 1}
          transparent
          opacity={index === 1 ? 1 : 0.55}
        />
      ))}
      {samples.map((range, i) => (
        <mesh key={i} position={[toWorldX(range), 0.08, ((i % 5) - 2) * 0.12]}>
          <sphereGeometry args={[0.07, 10, 10]} />
          <meshBasicMaterial color="#fb7185" />
        </mesh>
      ))}
      {bins.map((count, bin) => (
        <mesh key={bin} position={[-3.96 + bin * 0.88, 0.02 + (count / maxBin) * 0.8, -0.7]}>
          <boxGeometry args={[0.72, Math.max(0.04, (count / maxBin) * 1.6), 0.18]} />
          <meshBasicMaterial color="#a78bfa" />
        </mesh>
      ))}
      <Line
        points={[
          [toWorldX(mean), 0, -1],
          [toWorldX(mean), 1.9, -1],
        ]}
        color="#fbbf24"
        lineWidth={3}
      />
      <mesh position={[0, -0.08, 0]}>
        <boxGeometry args={[10, 0.12, 2]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
    </>
  );
}

export function projectileSamples(angle: number, speed: number, spread: number, runs: number) {
  const radians = (angle * Math.PI) / 180;
  return Array.from({ length: runs }, (_, index) => {
    // Stratified uniform speed errors make every trial count deterministic and reproducible.
    const quantile = (index + 0.5) / runs;
    const velocity = speed * (1 + ((2 * quantile - 1) * spread) / 100);
    return (velocity * velocity * Math.sin(2 * radians)) / 9.81;
  });
}

function ProjectileDataLab({ definition }: LabRouteProps) {
  const [angle, setAngle] = useState(45),
    [speed, setSpeed] = useState(24),
    [spread, setSpread] = useState(8),
    [runs, setRuns] = useState(20);
  const expectedRange = (speed * speed * Math.sin((2 * angle * Math.PI) / 180)) / 9.81;
  const sampleMean =
    projectileSamples(angle, speed, spread, runs).reduce((sum, range) => sum + range, 0) / runs;
  return (
    <LabSimulationLayout
      definition={definition}
      cameraPosition={[0, 4, 10]}
      controls={
        <>
          <NumberSlider
            label="Launch angle"
            value={angle}
            min={10}
            max={80}
            step={1}
            onChange={setAngle}
          />
          <NumberSlider
            label="Mean speed (m/s)"
            value={speed}
            min={10}
            max={40}
            step={1}
            onChange={setSpeed}
          />
          <NumberSlider
            label="Uniform speed error (±%)"
            value={spread}
            min={0}
            max={25}
            step={1}
            onChange={setSpread}
          />
          <Button
            variant="outline"
            disabled={runs >= 40}
            onClick={() => setRuns((count) => Math.min(40, count + 10))}
          >
            Add 10 trials ({runs})
          </Button>
          <output aria-live="polite">
            Mean range: {sampleMean.toFixed(1)} m; ideal: {expectedRange.toFixed(1)} m; trials:{" "}
            {runs}/40
          </output>
        </>
      }
    >
      <ProjectileDataScene {...{ angle, speed, spread, runs }} />
    </LabSimulationLayout>
  );
}

function SoundScene({ frequency, amplitude }: { frequency: number; amplitude: number }) {
  const particles = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const elapsed = useRef(0);
  const running = useMotionEnabled();
  useFrame((_, delta) => {
    if (!particles.current) return;
    if (running) elapsed.current += delta;
    const metresToWorld = 4;
    const wavelength = (343 / frequency) * metresToWorld;
    for (let i = 0; i < 540; i++) {
      const column = i % 90,
        row = Math.floor(i / 90);
      const x = (column / 89) * 9 - 4.5;
      const displaced =
        x +
        amplitude *
          0.12 *
          Math.sin((TAU * x) / wavelength - TAU * frequency * 0.01 * elapsed.current);
      dummy.position.set(displaced, row * 0.42 - 1.05, 0);
      dummy.updateMatrix();
      particles.current.setMatrixAt(i, dummy.matrix);
    }
    particles.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <>
      <instancedMesh ref={particles} args={[undefined, undefined, 540]}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshBasicMaterial color="#38bdf8" />
      </instancedMesh>
      <mesh position={[-5, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[1, 1.2, 32, 1, true]} />
        <meshStandardMaterial color="#fb7185" side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}

function SoundLab({ definition }: LabRouteProps) {
  const [frequency, setFrequency] = useState(440),
    [amplitude, setAmplitude] = useState(1);
  return (
    <LabSimulationLayout
      definition={definition}
      cameraPosition={[0, 0, 11]}
      controls={
        <>
          <NumberSlider
            label="Frequency (Hz)"
            value={frequency}
            min={100}
            max={1000}
            step={10}
            onChange={setFrequency}
          />
          <NumberSlider
            label="Amplitude"
            value={amplitude}
            min={0.1}
            max={2}
            step={0.1}
            onChange={setAmplitude}
          />
          <output aria-live="polite">
            Wavelength: {(343 / frequency).toFixed(2)} m; sound speed: 343 m/s; visual scale: 4
            world units/m; animation: 100× slow motion
          </output>
        </>
      }
    >
      <SoundScene frequency={frequency} amplitude={amplitude} />
    </LabSimulationLayout>
  );
}

function BuoyancyScene({
  objectDensity,
  fluidDensity,
}: {
  objectDensity: number;
  fluidDensity: number;
}) {
  const block = useRef<THREE.Group>(null);
  const submergedFraction = Math.min(1, objectDensity / fluidDensity);
  const neutral = objectDensity === fluidDensity;
  const target = submergedFraction < 1 ? 2.2 - 1.4 * submergedFraction : neutral ? -0.5 : -1.8;
  const forceScale = 1.2 / Math.max(objectDensity, fluidDensity);
  const weightLength = objectDensity * forceScale;
  const buoyancyLength = fluidDensity * submergedFraction * forceScale;
  const running = useMotionEnabled();
  useFrame((_, delta) => {
    if (!running) return;
    if (block.current)
      block.current.position.y = THREE.MathUtils.damp(block.current.position.y, target, 2.5, delta);
  });
  return (
    <>
      <mesh position={[0, -0.5, 0]}>
        <boxGeometry args={[7, 4, 3]} />
        <meshPhysicalMaterial
          color="#0ea5e9"
          transparent
          opacity={0.28}
          roughness={0.1}
          transmission={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
      <group ref={block} position={[0, 1.5, 0]}>
        <mesh>
          <boxGeometry args={[1.4, 1.4, 1.4]} />
          <meshStandardMaterial color="#f59e0b" />
        </mesh>
        <Line
          points={[
            [-0.9, 0, 0],
            [-0.9, buoyancyLength, 0],
          ]}
          color="#38bdf8"
          lineWidth={3}
        />
        <mesh position={[-0.9, buoyancyLength, 0]}>
          <coneGeometry args={[0.12, 0.3, 16]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        <Line
          points={[
            [0.9, 0, 0],
            [0.9, -weightLength, 0],
          ]}
          color="#fb7185"
          lineWidth={3}
        />
        <mesh position={[0.9, -weightLength, 0]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.12, 0.3, 16]} />
          <meshBasicMaterial color="#fb7185" />
        </mesh>
      </group>
    </>
  );
}

function BuoyancyLab({ definition }: LabRouteProps) {
  const [objectDensity, setObjectDensity] = useState(650),
    [fluidDensity, setFluidDensity] = useState(1000);
  return (
    <LabSimulationLayout
      definition={definition}
      cameraPosition={[7, 4, 8]}
      controls={
        <>
          <NumberSlider
            label="Object density (kg/m³)"
            value={objectDensity}
            min={200}
            max={1800}
            step={50}
            onChange={setObjectDensity}
          />
          <NumberSlider
            label="Fluid density (kg/m³)"
            value={fluidDensity}
            min={500}
            max={1400}
            step={50}
            onChange={setFluidDensity}
          />
          <output aria-live="polite">
            Submerged: {Math.min(100, (objectDensity / fluidDensity) * 100).toFixed(0)}%;{" "}
            {objectDensity < fluidDensity
              ? "floating in equilibrium"
              : objectDensity === fluidDensity
                ? "neutrally buoyant"
                : "sinking"}
          </output>
        </>
      }
    >
      <BuoyancyScene objectDensity={objectDensity} fluidDensity={fluidDensity} />
    </LabSimulationLayout>
  );
}

export const IMPORTED_LAB_COMPONENTS: Record<string, ComponentType<LabRouteProps>> = {
  "keplers-laws": KeplerLab,
  "solar-system": SolarLab,
  "balancing-torque": TorqueLab,
  "projectile-data-lab": ProjectileDataLab,
  "sound-waves": SoundLab,
  buoyancy: BuoyancyLab,
};
