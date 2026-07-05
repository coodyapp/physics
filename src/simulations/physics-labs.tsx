import { useMemo, useRef, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { ChevronLeft, ChevronRight, ListTree } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import * as THREE from "three";

import { FloatingSimulationLayout } from "@/components/floating-simulation-layout";
import { NumberSlider } from "@/components/number-slider";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";

export type LabCategory = "mechanics" | "electromagnetism" | "thermodynamics" | "quantum-mechanics";

interface LabRouteProps {
  definition: LabDefinition;
}

export interface LabDefinition {
  category: LabCategory;
  slug: string;
  title: string;
  summary: string;
  principle: string;
  equations: string[];
  method: string;
  expectedOutput: string;
  component: ComponentType<LabRouteProps>;
}

export const LAB_CATEGORY_LABELS: Record<LabCategory, string> = {
  mechanics: "Mechanics",
  electromagnetism: "Electromagnetism",
  thermodynamics: "Thermodynamics",
  "quantum-mechanics": "Quantum Mechanics",
};

export const LAB_CATEGORY_ORDER: LabCategory[] = [
  "mechanics",
  "electromagnetism",
  "thermodynamics",
  "quantum-mechanics",
];

function useAnimationTime(speed = 1) {
  const [time, setTime] = useState(0);

  useFrame((_, delta) => {
    setTime((value) => value + delta * speed);
  });

  return time;
}

function hslColor(hue: number, saturation = 85, lightness = 55) {
  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}

function LabSimulationLayout({
  definition,
  controls,
  children,
  cameraPosition = [8, 6, 8],
}: {
  definition: LabDefinition;
  controls: ReactNode;
  children: ReactNode;
  cameraPosition?: [number, number, number];
}) {
  return (
    <FloatingSimulationLayout
      controlsTitle={`${definition.title} Controls`}
      informationTitle={definition.title}
      controls={controls}
      information={<LabInformation definition={definition} />}
      cameraPosition={cameraPosition}
      cameraTarget={[0, 0, 0]}
    >
      {children}
    </FloatingSimulationLayout>
  );
}

function LabInformation({ definition }: { definition: LabDefinition }) {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {LAB_CATEGORY_LABELS[definition.category]}
        </div>
        <p className="mt-2 text-foreground">{definition.summary}</p>
      </div>

      <SimulationNavigator currentSimulation={definition} />

      <div className="space-y-3">
        <div>
          <div className="font-medium text-foreground">Physics concept</div>
          <p className="mt-1">{definition.principle}</p>
        </div>
        <div>
          <div className="font-medium text-foreground">Key equations</div>
          <div className="mt-2 space-y-2">
            {definition.equations.map((equation) => (
              <code
                key={equation}
                className="block rounded-lg bg-muted px-3 py-2 font-mono text-xs text-foreground"
              >
                {equation}
              </code>
            ))}
          </div>
        </div>
        <div>
          <div className="font-medium text-foreground">Numerical method</div>
          <p className="mt-1">{definition.method}</p>
        </div>
        <div>
          <div className="font-medium text-foreground">Expected output</div>
          <p className="mt-1">{definition.expectedOutput}</p>
        </div>
      </div>
    </div>
  );
}

function ProjectileScene({
  angleDeg,
  speed,
  gravity,
}: {
  angleDeg: number;
  speed: number;
  gravity: number;
}) {
  const time = useAnimationTime(0.6);
  const angle = (angleDeg * Math.PI) / 180;
  const vx = speed * Math.cos(angle);
  const vy = speed * Math.sin(angle);
  const flightTime = Math.max(0.1, (2 * vy) / gravity);
  const range = Math.max(1, vx * flightTime);
  const maxHeight = Math.max(1, (vy * vy) / (2 * gravity));
  const path = useMemo(() => {
    return Array.from({ length: 80 }, (_, index) => {
      const t = (index / 79) * flightTime;
      const x = vx * t;
      const y = vy * t - 0.5 * gravity * t * t;

      return [(x / range) * 8 - 4, (y / maxHeight) * 3, 0] as [number, number, number];
    });
  }, [flightTime, gravity, maxHeight, range, vx, vy]);

  const t = time % flightTime;
  const px = ((vx * t) / range) * 8 - 4;
  const py = ((vy * t - 0.5 * gravity * t * t) / maxHeight) * 3;

  return (
    <group>
      <mesh position={[0, -0.06, 0]}>
        <boxGeometry args={[9, 0.08, 2.8]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <Line points={path} color="#38bdf8" lineWidth={3} />
      <mesh position={[px, py, 0]}>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={0.4} />
      </mesh>
      <Line
        points={[
          [px, py, 0],
          [px + 0.7, py + 0.35, 0],
        ]}
        color="#fde68a"
        lineWidth={2}
      />
    </group>
  );
}

function ProjectileMotionLab({ definition }: LabRouteProps) {
  const [launchAngle, setLaunchAngle] = useState(42);
  const [launchSpeed, setLaunchSpeed] = useState(7.4);
  const [gravity, setGravity] = useState(9.8);

  return (
    <LabSimulationLayout
      definition={definition}
      controls={
        <>
          <NumberSlider
            label="Launch angle"
            value={launchAngle}
            min={10}
            max={80}
            step={1}
            onChange={setLaunchAngle}
            formatValue={(value) => `${value.toFixed(0)} deg`}
          />
          <NumberSlider
            label="Launch speed"
            value={launchSpeed}
            min={3}
            max={12}
            step={0.1}
            onChange={setLaunchSpeed}
            formatValue={(value) => `${value.toFixed(1)} m/s`}
          />
          <NumberSlider
            label="Gravity"
            value={gravity}
            min={1.6}
            max={16}
            step={0.1}
            onChange={setGravity}
            formatValue={(value) => `${value.toFixed(1)} m/s2`}
          />
        </>
      }
    >
      <ProjectileScene angleDeg={launchAngle} speed={launchSpeed} gravity={gravity} />
    </LabSimulationLayout>
  );
}

function SpringMassScene({
  stiffness,
  damping,
  drive,
}: {
  stiffness: number;
  damping: number;
  drive: number;
}) {
  const time = useAnimationTime();
  const massRef = useRef<THREE.Mesh>(null);
  const amplitude = 1.1 * Math.max(0.15, 1 - damping / 1.2) + drive * 0.25;
  const displacement = amplitude * Math.sin(time * Math.sqrt(stiffness) * 2.4);
  const massX = 1.6 + displacement;
  const springPoints = useMemo(() => {
    const points: [number, number, number][] = [[-3.8, 0, 0]];
    const turns = 18;
    for (let i = 1; i <= turns; i++) {
      const x = -3.8 + (i / turns) * (massX + 3.1);
      const y = i % 2 === 0 ? 0.22 : -0.22;
      points.push([x, y, 0]);
    }
    points.push([massX - 0.65, 0, 0]);
    return points;
  }, [massX]);

  useFrame(() => {
    if (massRef.current) massRef.current.position.x = massX;
  });

  return (
    <group>
      <mesh position={[-4.1, 0, 0]}>
        <boxGeometry args={[0.18, 2.8, 2.8]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      <Line points={springPoints} color="#67e8f9" lineWidth={3} />
      <mesh ref={massRef} position={[massX, 0, 0]}>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshStandardMaterial color="#f97316" />
      </mesh>
      <Line
        points={[
          [1.6, -1.5, -1.4],
          [1.6, 1.5, -1.4],
        ]}
        color="#94a3b8"
        lineWidth={1}
        dashed
      />
    </group>
  );
}

function SpringMassLab({ definition }: LabRouteProps) {
  const [stiffness, setStiffness] = useState(1.4);
  const [damping, setDamping] = useState(0.35);
  const [drive, setDrive] = useState(0.4);

  return (
    <LabSimulationLayout
      definition={definition}
      controls={
        <>
          <NumberSlider
            label="Spring stiffness"
            value={stiffness}
            min={0.4}
            max={3}
            step={0.1}
            onChange={setStiffness}
          />
          <NumberSlider
            label="Damping"
            value={damping}
            min={0}
            max={1.1}
            step={0.05}
            onChange={setDamping}
          />
          <NumberSlider
            label="Drive strength"
            value={drive}
            min={0}
            max={1.4}
            step={0.1}
            onChange={setDrive}
          />
        </>
      }
    >
      <SpringMassScene stiffness={stiffness} damping={damping} drive={drive} />
    </LabSimulationLayout>
  );
}

function PendulumScene({
  length,
  gravity,
  damping,
  initialAngle,
}: {
  length: number;
  gravity: number;
  damping: number;
  initialAngle: number;
}) {
  const time = useAnimationTime();
  const angle0 = (initialAngle * Math.PI) / 180;
  const omega = Math.sqrt(gravity / length);
  const angle = angle0 * Math.exp(-damping * time * 0.18) * Math.cos(omega * time);
  const bob: [number, number, number] = [
    Math.sin(angle) * length * 2.1,
    -Math.cos(angle) * length * 2.1,
    0,
  ];

  return (
    <group position={[0, 2.3, 0]}>
      <mesh>
        <sphereGeometry args={[0.12, 20, 20]} />
        <meshStandardMaterial color="#67e8f9" emissive="#67e8f9" emissiveIntensity={0.3} />
      </mesh>
      <Line points={[[0, 0, 0], bob]} color="#e2e8f0" lineWidth={2} />
      <mesh position={bob}>
        <sphereGeometry args={[0.32, 32, 32]} />
        <meshStandardMaterial color="#f97316" />
      </mesh>
      <Line
        points={Array.from({ length: 32 }, (_, index) => {
          const theta = -angle0 + (index / 31) * angle0 * 2;
          return [Math.sin(theta) * length * 2.1, -Math.cos(theta) * length * 2.1, -0.05] as [
            number,
            number,
            number,
          ];
        })}
        color="#64748b"
        lineWidth={1}
      />
    </group>
  );
}

function DampedPendulumLab({ definition }: LabRouteProps) {
  const [length, setLength] = useState(1.1);
  const [gravity, setGravity] = useState(9.8);
  const [damping, setDamping] = useState(0.22);
  const [initialAngle, setInitialAngle] = useState(44);

  return (
    <LabSimulationLayout
      definition={definition}
      controls={
        <>
          <NumberSlider
            label="String length"
            value={length}
            min={0.5}
            max={1.8}
            step={0.1}
            onChange={setLength}
            formatValue={(value) => `${value.toFixed(1)} m`}
          />
          <NumberSlider
            label="Gravity"
            value={gravity}
            min={1.6}
            max={16}
            step={0.1}
            onChange={setGravity}
            formatValue={(value) => `${value.toFixed(1)} m/s2`}
          />
          <NumberSlider
            label="Damping"
            value={damping}
            min={0}
            max={0.9}
            step={0.05}
            onChange={setDamping}
          />
          <NumberSlider
            label="Initial angle"
            value={initialAngle}
            min={5}
            max={75}
            step={1}
            onChange={setInitialAngle}
            formatValue={(value) => `${value.toFixed(0)} deg`}
          />
        </>
      }
    >
      <PendulumScene
        length={length}
        gravity={gravity}
        damping={damping}
        initialAngle={initialAngle}
      />
    </LabSimulationLayout>
  );
}

function ElectricFieldScene({
  separation,
  chargeRatio,
}: {
  separation: number;
  chargeRatio: number;
}) {
  const charges = [
    { x: -separation * 1.8, q: 1, color: "#38bdf8" },
    { x: separation * 1.8, q: chargeRatio, color: "#fb7185" },
  ];
  const lines = useMemo(() => {
    return charges.flatMap((charge) =>
      Array.from({ length: 12 }, (_, line) => {
        const angle = (line / 12) * Math.PI * 2;
        const points: [number, number, number][] = [];
        for (let step = 0; step < 36; step++) {
          const radius = 0.35 + step * 0.13;
          const bend = charge.q > 0 ? 0.35 * Math.sin(step * 0.12) : -0.35 * Math.sin(step * 0.12);
          points.push([
            charge.x + Math.cos(angle + bend) * radius,
            Math.sin(angle + bend) * radius,
            Math.sin(step * 0.15 + angle) * 0.35,
          ]);
        }
        return points;
      }),
    );
  }, [chargeRatio, separation]);

  return (
    <group>
      {lines.map((points, index) => (
        <Line
          key={index}
          points={points}
          color={index < 12 ? "#38bdf8" : "#fb7185"}
          lineWidth={1.4}
        />
      ))}
      {charges.map((charge) => (
        <mesh key={charge.x} position={[charge.x, 0, 0]}>
          <sphereGeometry args={[0.32, 32, 32]} />
          <meshStandardMaterial
            color={charge.color}
            emissive={charge.color}
            emissiveIntensity={0.4}
          />
        </mesh>
      ))}
    </group>
  );
}

function ElectricFieldLinesLab({ definition }: LabRouteProps) {
  const [separation, setSeparation] = useState(1.2);
  const [chargeRatio, setChargeRatio] = useState(-1);

  return (
    <LabSimulationLayout
      definition={definition}
      controls={
        <>
          <NumberSlider
            label="Charge spacing"
            value={separation}
            min={0.4}
            max={1.8}
            step={0.1}
            onChange={setSeparation}
          />
          <NumberSlider
            label="Right charge"
            value={chargeRatio}
            min={-2}
            max={2}
            step={0.1}
            onChange={setChargeRatio}
            formatValue={(value) => `${value.toFixed(1)} q`}
          />
        </>
      }
    >
      <ElectricFieldScene separation={separation} chargeRatio={chargeRatio} />
    </LabSimulationLayout>
  );
}

function ChargedParticleScene({
  electricField,
  magneticField,
  speed,
}: {
  electricField: number;
  magneticField: number;
  speed: number;
}) {
  const time = useAnimationTime(0.8);
  const radius = 1.4 / magneticField;
  const trail = useMemo(() => {
    return Array.from({ length: 160 }, (_, index) => {
      const t = time - (159 - index) * 0.035;
      return [
        Math.cos(t * magneticField * 2.4) * radius + electricField * t * 0.2,
        Math.sin(t * magneticField * 2.4) * radius,
        ((t * speed * 0.45) % 5) - 2.5,
      ] as [number, number, number];
    });
  }, [electricField, magneticField, radius, speed, time]);
  const particle = trail[trail.length - 1];

  return (
    <group>
      <Line points={trail} color="#38bdf8" lineWidth={2.5} />
      <mesh position={particle}>
        <sphereGeometry args={[0.16, 24, 24]} />
        <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={0.5} />
      </mesh>
      {Array.from({ length: 7 }, (_, index) => (
        <Line
          key={index}
          points={[
            [-3 + index, -2.2, -2.2],
            [-3 + index + electricField, -2.2, -2.2],
          ]}
          color="#bae6fd"
          lineWidth={1}
        />
      ))}
    </group>
  );
}

function ChargedParticleMotionLab({ definition }: LabRouteProps) {
  const [electricField, setElectricField] = useState(0.35);
  const [magneticField, setMagneticField] = useState(1.4);
  const [speed, setSpeed] = useState(0.9);

  return (
    <LabSimulationLayout
      definition={definition}
      controls={
        <>
          <NumberSlider
            label="Electric field"
            value={electricField}
            min={-0.8}
            max={0.8}
            step={0.05}
            onChange={setElectricField}
          />
          <NumberSlider
            label="Magnetic field"
            value={magneticField}
            min={0.1}
            max={2.6}
            step={0.1}
            onChange={setMagneticField}
          />
          <NumberSlider
            label="Initial speed"
            value={speed}
            min={0.3}
            max={1.8}
            step={0.1}
            onChange={setSpeed}
          />
        </>
      }
    >
      <ChargedParticleScene
        electricField={electricField}
        magneticField={magneticField}
        speed={speed}
      />
    </LabSimulationLayout>
  );
}

function ElectromagneticWaveScene({ frequency, courant }: { frequency: number; courant: number }) {
  const time = useAnimationTime();
  const ePoints = useMemo(
    () =>
      Array.from({ length: 140 }, (_, index) => {
        const x = -5 + (index / 139) * 10;
        return [x, Math.sin(x * 1.8 - time * frequency * Math.PI * 2) * 1.2 * courant, 0] as [
          number,
          number,
          number,
        ];
      }),
    [courant, frequency, time],
  );
  const hPoints = useMemo(
    () =>
      Array.from({ length: 140 }, (_, index) => {
        const x = -5 + (index / 139) * 10;
        return [x, 0, Math.cos(x * 1.8 - time * frequency * Math.PI * 2) * 1.2 * courant] as [
          number,
          number,
          number,
        ];
      }),
    [courant, frequency, time],
  );

  return (
    <group>
      <Line points={ePoints} color="#38bdf8" lineWidth={3} />
      <Line points={hPoints} color="#fb7185" lineWidth={3} />
      <Line
        points={[
          [-5.2, 0, 0],
          [5.2, 0, 0],
        ]}
        color="#e2e8f0"
        lineWidth={1}
      />
    </group>
  );
}

function ElectromagneticWaveLab({ definition }: LabRouteProps) {
  const [frequency, setFrequency] = useState(2.2);
  const [courant, setCourant] = useState(0.92);

  return (
    <LabSimulationLayout
      definition={definition}
      controls={
        <>
          <NumberSlider
            label="Source frequency"
            value={frequency}
            min={0.5}
            max={5}
            step={0.1}
            onChange={setFrequency}
          />
          <NumberSlider
            label="Courant number"
            value={courant}
            min={0.4}
            max={0.98}
            step={0.01}
            onChange={setCourant}
          />
        </>
      }
    >
      <ElectromagneticWaveScene frequency={frequency} courant={courant} />
    </LabSimulationLayout>
  );
}

function HeatDiffusionScene({
  diffusivity,
  sourceStrength,
}: {
  diffusivity: number;
  sourceStrength: number;
}) {
  const time = useAnimationTime(0.25);
  const cells = 15;
  const items = useMemo(
    () =>
      Array.from({ length: cells * cells }, (_, index) => {
        const x = (index % cells) - (cells - 1) / 2;
        const z = Math.floor(index / cells) - (cells - 1) / 2;
        const r2 = x * x + z * z;
        const heat = Math.max(
          0.04,
          sourceStrength * Math.exp(-r2 / (6 + diffusivity * 30 + time * 4)),
        );
        return { x, z, heat };
      }),
    [diffusivity, sourceStrength, time],
  );

  return (
    <group scale={[0.52, 1, 0.52]}>
      {items.map(({ x, z, heat }) => (
        <mesh key={`${x}-${z}`} position={[x, heat, z]}>
          <boxGeometry args={[0.85, heat * 2, 0.85]} />
          <meshStandardMaterial color={hslColor(240 - heat * 220, 90, 35 + heat * 35)} />
        </mesh>
      ))}
    </group>
  );
}

function HeatDiffusionLab({ definition }: LabRouteProps) {
  const [diffusivity, setDiffusivity] = useState(0.18);
  const [sourceStrength, setSourceStrength] = useState(0.7);

  return (
    <LabSimulationLayout
      definition={definition}
      controls={
        <>
          <NumberSlider
            label="Diffusivity"
            value={diffusivity}
            min={0.04}
            max={0.24}
            step={0.01}
            onChange={setDiffusivity}
          />
          <NumberSlider
            label="Source power"
            value={sourceStrength}
            min={0.1}
            max={1}
            step={0.05}
            onChange={setSourceStrength}
          />
        </>
      }
    >
      <HeatDiffusionScene diffusivity={diffusivity} sourceStrength={sourceStrength} />
    </LabSimulationLayout>
  );
}

function IdealGasScene({
  particleCount,
  temperature,
}: {
  particleCount: number;
  temperature: number;
}) {
  const time = useAnimationTime(0.9);
  const count = Math.min(100, Math.round(particleCount));
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => {
        const a = index * 12.9898;
        return {
          x: Math.sin(time * (0.7 + (index % 5) * 0.09) * Math.sqrt(temperature) + a) * 2.1,
          y: Math.sin(time * (0.9 + (index % 7) * 0.07) * Math.sqrt(temperature) + a * 0.7) * 1.8,
          z: Math.cos(time * (0.8 + (index % 3) * 0.11) * Math.sqrt(temperature) + a) * 2.1,
        };
      }),
    [count, temperature, time],
  );

  return (
    <group>
      <mesh>
        <boxGeometry args={[5, 4, 5]} />
        <meshStandardMaterial color="#1e293b" wireframe transparent opacity={0.32} />
      </mesh>
      {particles.map((particle, index) => (
        <mesh key={index} position={[particle.x, particle.y, particle.z]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshStandardMaterial color={hslColor(185 + (index % 8) * 9, 90, 62)} />
        </mesh>
      ))}
    </group>
  );
}

function IdealGasLab({ definition }: LabRouteProps) {
  const [particleCount, setParticleCount] = useState(70);
  const [temperature, setTemperature] = useState(1.1);

  return (
    <LabSimulationLayout
      definition={definition}
      controls={
        <>
          <NumberSlider
            label="Particle count"
            value={particleCount}
            min={20}
            max={140}
            step={1}
            onChange={setParticleCount}
            formatValue={(value) => value.toFixed(0)}
          />
          <NumberSlider
            label="Temperature"
            value={temperature}
            min={0.4}
            max={2.4}
            step={0.1}
            onChange={setTemperature}
          />
        </>
      }
    >
      <IdealGasScene particleCount={particleCount} temperature={temperature} />
    </LabSimulationLayout>
  );
}

function BoltzmannDistributionScene({
  temperature,
  proposal,
}: {
  temperature: number;
  proposal: number;
}) {
  const bars = useMemo(
    () =>
      Array.from({ length: 28 }, (_, index) => {
        const energy = 0.15 + index * 0.22;
        const value = Math.sqrt(energy) * Math.exp(-energy / temperature) * (0.8 + proposal * 0.1);
        return { energy, value };
      }),
    [proposal, temperature],
  );
  const max = Math.max(...bars.map((bar) => bar.value), 1e-6);

  return (
    <group position={[-3.7, 0, 0]}>
      {bars.map((bar, index) => {
        const h = (bar.value / max) * 3.2;
        return (
          <mesh key={bar.energy} position={[index * 0.28, h / 2, 0]}>
            <boxGeometry args={[0.19, h, 0.7]} />
            <meshStandardMaterial color={hslColor(230 - index * 5, 90, 55)} />
          </mesh>
        );
      })}
    </group>
  );
}

function BoltzmannDistributionLab({ definition }: LabRouteProps) {
  const [temperature, setTemperature] = useState(1.2);
  const [proposal, setProposal] = useState(0.8);

  return (
    <LabSimulationLayout
      definition={definition}
      controls={
        <>
          <NumberSlider
            label="Temperature"
            value={temperature}
            min={0.3}
            max={3}
            step={0.1}
            onChange={setTemperature}
          />
          <NumberSlider
            label="Proposal size"
            value={proposal}
            min={0.2}
            max={1.8}
            step={0.1}
            onChange={setProposal}
          />
        </>
      }
    >
      <BoltzmannDistributionScene temperature={temperature} proposal={proposal} />
    </LabSimulationLayout>
  );
}

function ParticleInBoxScene({ mix, level }: { mix: number; level: number }) {
  const time = useAnimationTime(0.7);
  const points = useMemo(
    () =>
      Array.from({ length: 180 }, (_, index) => {
        const x = index / 179;
        const n2 = Math.round(level);
        const a1 = Math.sqrt(1 - mix);
        const a2 = Math.sqrt(mix);
        const real =
          a1 * Math.sin(Math.PI * x) * Math.cos(time) +
          a2 * Math.sin(n2 * Math.PI * x) * Math.cos(n2 * n2 * time);
        const imag =
          -a1 * Math.sin(Math.PI * x) * Math.sin(time) -
          a2 * Math.sin(n2 * Math.PI * x) * Math.sin(n2 * n2 * time);
        const probability = real * real + imag * imag;
        return [x * 8 - 4, probability * 2.5, 0] as [number, number, number];
      }),
    [level, mix, time],
  );

  return (
    <group>
      <mesh position={[-4.15, 1.1, 0]}>
        <boxGeometry args={[0.12, 2.8, 1.1]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      <mesh position={[4.15, 1.1, 0]}>
        <boxGeometry args={[0.12, 2.8, 1.1]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      <Line points={points} color="#67e8f9" lineWidth={3} />
    </group>
  );
}

function ParticleInBoxLab({ definition }: LabRouteProps) {
  const [mix, setMix] = useState(0.45);
  const [level, setLevel] = useState(3);

  return (
    <LabSimulationLayout
      definition={definition}
      controls={
        <>
          <NumberSlider
            label="Excited-state mix"
            value={mix}
            min={0}
            max={0.95}
            step={0.05}
            onChange={setMix}
          />
          <NumberSlider
            label="Excited level n"
            value={level}
            min={2}
            max={6}
            step={1}
            onChange={setLevel}
            formatValue={(value) => value.toFixed(0)}
          />
        </>
      }
    >
      <ParticleInBoxScene mix={mix} level={level} />
    </LabSimulationLayout>
  );
}

function QuantumTunnelingScene({
  barrierHeight,
  packetEnergy,
  resetKey,
}: {
  barrierHeight: number;
  packetEnergy: number;
  resetKey: number;
}) {
  const time = useAnimationTime(0.55 + packetEnergy * 0.15);
  const phase = (time + resetKey * 0.01) % 8;
  const center = -3.5 + phase;
  const points = useMemo(
    () =>
      Array.from({ length: 180 }, (_, index) => {
        const x = index / 179;
        const worldX = x * 8 - 4;
        const reflected =
          Math.exp(-((worldX + center + 0.9) ** 2) / 0.3) *
          Math.max(0, barrierHeight - packetEnergy) *
          0.25;
        const transmitted = Math.exp(-((worldX - center) ** 2) / 0.55) * packetEnergy;
        return [worldX, (reflected + transmitted) * 1.2, 0] as [number, number, number];
      }),
    [barrierHeight, center, packetEnergy],
  );

  return (
    <group>
      <mesh position={[0.6, barrierHeight * 0.5, 0]}>
        <boxGeometry args={[0.7, barrierHeight, 1.4]} />
        <meshStandardMaterial color="#fb7185" transparent opacity={0.38} />
      </mesh>
      <Line points={points} color="#67e8f9" lineWidth={3} />
    </group>
  );
}

function QuantumTunnelingLab({ definition }: LabRouteProps) {
  const [barrierHeight, setBarrierHeight] = useState(1.4);
  const [packetEnergy, setPacketEnergy] = useState(1.1);
  const [resetKey, setResetKey] = useState(0);

  return (
    <LabSimulationLayout
      definition={definition}
      controls={
        <>
          <NumberSlider
            label="Barrier height"
            value={barrierHeight}
            min={0.2}
            max={2.8}
            step={0.1}
            onChange={setBarrierHeight}
          />
          <NumberSlider
            label="Packet energy"
            value={packetEnergy}
            min={0.4}
            max={2.2}
            step={0.1}
            onChange={setPacketEnergy}
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setResetKey((value) => value + 1)}
          >
            Reset packet
          </Button>
        </>
      }
    >
      <QuantumTunnelingScene
        barrierHeight={barrierHeight}
        packetEnergy={packetEnergy}
        resetKey={resetKey}
      />
    </LabSimulationLayout>
  );
}

function Schrodinger2DScene({ spread, potential }: { spread: number; potential: number }) {
  const time = useAnimationTime(0.35);
  const cells = 17;
  const centerX = -2.5 + ((time * 1.1) % 5);
  const items = useMemo(
    () =>
      Array.from({ length: cells * cells }, (_, index) => {
        const x = ((index % cells) - (cells - 1) / 2) * 0.42;
        const z = (Math.floor(index / cells) - (cells - 1) / 2) * 0.42;
        const density =
          Math.exp(-(((x - centerX) ** 2 + z * z) / (spread * 18))) *
          (0.6 + 0.4 * Math.sin(time + x * 2));
        return { x, z, density: Math.max(0.03, density) };
      }),
    [centerX, spread, time],
  );

  return (
    <group>
      {items.map(({ x, z, density }) => (
        <mesh key={`${x}-${z}`} position={[x, density * 0.8, z]}>
          <boxGeometry args={[0.36, density * 1.6, 0.36]} />
          <meshStandardMaterial color={hslColor(230 - density * 180, 90, 45 + density * 25)} />
        </mesh>
      ))}
      <mesh position={[2.4, potential * 0.45, 0]}>
        <cylinderGeometry args={[0.8, 0.8, Math.max(0.05, potential * 0.9), 40]} />
        <meshStandardMaterial color="#fb7185" transparent opacity={0.34} />
      </mesh>
    </group>
  );
}

function QuantumWavePacket2DLab({ definition }: LabRouteProps) {
  const [spread, setSpread] = useState(0.06);
  const [potential, setPotential] = useState(0.8);

  return (
    <LabSimulationLayout
      definition={definition}
      controls={
        <>
          <NumberSlider
            label="Initial spread"
            value={spread}
            min={0.025}
            max={0.12}
            step={0.005}
            onChange={setSpread}
          />
          <NumberSlider
            label="Potential strength"
            value={potential}
            min={0}
            max={2}
            step={0.1}
            onChange={setPotential}
          />
        </>
      }
    >
      <Schrodinger2DScene spread={spread} potential={potential} />
    </LabSimulationLayout>
  );
}

export const LAB_SIMULATIONS: LabDefinition[] = [
  {
    category: "mechanics",
    slug: "projectile-motion",
    title: "Projectile Motion",
    summary: "Launch angle, speed, and gravity shape a ballistic trajectory.",
    principle:
      "Horizontal velocity stays constant while vertical velocity changes under uniform gravitational acceleration.",
    equations: [
      "x(t) = v0 cos(theta) t",
      "y(t) = v0 sin(theta) t - 1/2 g t^2",
      "R = v0^2 sin(2 theta) / g",
    ],
    method: "Analytic constant-acceleration kinematics sampled as a 3D trajectory.",
    expectedOutput:
      "The orange sphere follows the cyan arc; speed and gravity reshape the path in real time.",
    component: ProjectileMotionLab,
  },
  {
    category: "mechanics",
    slug: "spring-mass-oscillator",
    title: "Spring-Mass Oscillator",
    summary: "A driven spring trades energy between motion and stored elastic potential.",
    principle:
      "Hooke's law pulls displacement back toward equilibrium while damping removes mechanical energy.",
    equations: ["m x'' + c x' + kx = F0 sin(omega t)", "U = 1/2 kx^2"],
    method: "3D oscillator animation with a dynamic spring line and cube mass.",
    expectedOutput:
      "The block oscillates around the equilibrium marker while stiffness and damping alter motion.",
    component: SpringMassLab,
  },
  {
    category: "mechanics",
    slug: "damped-pendulum",
    title: "Damped Pendulum",
    summary: "Length, gravity, damping, and initial angle control pendulum motion.",
    principle:
      "For small angles, a pendulum behaves like a harmonic oscillator with period set by length and gravity.",
    equations: ["theta'' + (g/L) sin(theta) = -b theta'", "T ~= 2 pi sqrt(L/g)"],
    method: "Damped small-angle oscillator rendered as a 3D rod, bob, and arc envelope.",
    expectedOutput: "The bob swings through a visible arc and decays faster as damping rises.",
    component: DampedPendulumLab,
  },
  {
    category: "electromagnetism",
    slug: "electric-field-lines",
    title: "Electric Field Lines",
    summary: "Field vectors and streamlines from two point charges.",
    principle:
      "Coulomb fields add linearly, so the net electric field is the vector sum of each charge contribution.",
    equations: ["E(r) = sum_i k q_i (r - r_i) / |r - r_i|^3", "F = qE"],
    method: "3D streamline curves seeded around each charge with charge-dependent bending.",
    expectedOutput:
      "Cyan and rose field lines emerge from the charge spheres and change as spacing or polarity changes.",
    component: ElectricFieldLinesLab,
  },
  {
    category: "electromagnetism",
    slug: "charged-particle-motion",
    title: "Charged Particle Motion",
    summary: "A charged particle curves through crossed electric and magnetic fields.",
    principle:
      "The Lorentz force bends velocity perpendicular to B while E accelerates along its direction.",
    equations: ["m dv/dt = q(E + v x B)", "dr/dt = v"],
    method: "Parametric 3D helical-drift trajectory driven by field controls.",
    expectedOutput:
      "The particle leaves a 3D cyan trail whose radius and drift change with E and B.",
    component: ChargedParticleMotionLab,
  },
  {
    category: "electromagnetism",
    slug: "em-wave-propagation",
    title: "EM Wave Propagation",
    summary: "Electric and magnetic waves propagate as perpendicular 3D fields.",
    principle: "Maxwell curl equations couple E and H fields so changes in one drive the other.",
    equations: ["dE/dt = c^2 dB/dx", "dB/dt = -dE/dx"],
    method: "Animated 3D field curves with E and H components perpendicular to propagation.",
    expectedOutput:
      "Cyan and rose waves travel along the same axis with a visible phase relationship.",
    component: ElectromagneticWaveLab,
  },
  {
    category: "thermodynamics",
    slug: "heat-diffusion",
    title: "Heat Diffusion Plate",
    summary: "A hot spot spreads through a square plate.",
    principle:
      "Heat flows from high temperature to low temperature according to the temperature Laplacian.",
    equations: ["dT/dt = alpha (d2T/dx2 + d2T/dy2)"],
    method: "3D height-field surface where color and height encode temperature.",
    expectedOutput: "A central thermal peak flattens and spreads as diffusivity increases.",
    component: HeatDiffusionLab,
  },
  {
    category: "thermodynamics",
    slug: "ideal-gas",
    title: "Ideal Gas Kinetics",
    summary: "Particles move in a 3D box and form a kinetic gas cloud.",
    principle: "Microscopic elastic motion produces macroscopic pressure and temperature behavior.",
    equations: ["PV = NkT", "1/2 m <v^2> proportional to T"],
    method: "Deterministic 3D particle cloud constrained inside a transparent box.",
    expectedOutput:
      "Particles move faster and fill the box more energetically as temperature rises.",
    component: IdealGasLab,
  },
  {
    category: "thermodynamics",
    slug: "boltzmann-distribution",
    title: "Boltzmann Energy Distribution",
    summary: "A thermal energy distribution appears as a 3D bar chart.",
    principle:
      "At equilibrium, states with energy E occur with probability weighted by exp(-E/kT).",
    equations: ["P(E) proportional to g(E) exp(-E/kT)", "S = -sum_i p_i ln p_i"],
    method: "3D bars evaluate the Boltzmann shape with a density-of-states factor.",
    expectedOutput: "The distribution broadens at high temperature and narrows at low temperature.",
    component: BoltzmannDistributionLab,
  },
  {
    category: "quantum-mechanics",
    slug: "particle-in-box",
    title: "Particle in a Box",
    summary: "Bound-state superposition evolves inside infinite potential walls.",
    principle: "Stationary eigenstates gain phase at rates set by quantized energies.",
    equations: [
      "psi_n(x) = sqrt(2/L) sin(n pi x/L)",
      "E_n proportional to n^2",
      "|psi|^2 is probability density",
    ],
    method: "3D probability-density curve between two wall meshes.",
    expectedOutput:
      "The cyan density curve oscillates as the ground state interferes with a selected excited state.",
    component: ParticleInBoxLab,
  },
  {
    category: "quantum-mechanics",
    slug: "quantum-tunneling",
    title: "Quantum Tunneling",
    summary: "A wave packet partly transmits through a finite barrier.",
    principle:
      "The Schrodinger equation allows nonzero probability inside and beyond classically forbidden barriers.",
    equations: ["i dpsi/dt = -1/2 d2psi/dx2 + V(x) psi", "rho = |psi|^2"],
    method: "3D probability curve moving through a translucent potential wall.",
    expectedOutput: "A cyan packet interacts with the rose barrier and leaves a transmitted tail.",
    component: QuantumTunnelingLab,
  },
  {
    category: "quantum-mechanics",
    slug: "schrodinger-2d",
    title: "2D Schrodinger Wave Packet",
    summary: "A Gaussian wave packet moves through a circular potential region.",
    principle:
      "The 2D time-dependent Schrodinger equation disperses and scatters probability density.",
    equations: ["i dpsi/dt = -1/2 Laplacian(psi) + V(x,y) psi", "rho(x,y) = |psi|^2"],
    method: "3D probability terrain with a translucent potential cylinder.",
    expectedOutput:
      "The probability surface moves and deforms around the highlighted potential region.",
    component: QuantumWavePacket2DLab,
  },
];

export function getLabSimulationPath(simulation: Pick<LabDefinition, "category" | "slug">) {
  return `/simulations/${simulation.category}/${simulation.slug}`;
}

function SimulationNavigator({ currentSimulation }: { currentSimulation: LabDefinition }) {
  const currentIndex = LAB_SIMULATIONS.findIndex(
    (simulation) =>
      simulation.category === currentSimulation.category &&
      simulation.slug === currentSimulation.slug,
  );
  const previousSimulation =
    LAB_SIMULATIONS[(currentIndex - 1 + LAB_SIMULATIONS.length) % LAB_SIMULATIONS.length];
  const nextSimulation = LAB_SIMULATIONS[(currentIndex + 1) % LAB_SIMULATIONS.length];

  return (
    <div className="rounded-xl border border-border/40 bg-background/70 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <ListTree className="size-4" />
          Navigator
        </div>
        <Badge variant="secondary">{LAB_SIMULATIONS.length} labs</Badge>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button asChild variant="outline" size="sm" className="justify-start">
          <Link to={getLabSimulationPath(previousSimulation)}>
            <ChevronLeft className="size-4" />
            Previous
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="justify-end">
          <Link to={getLabSimulationPath(nextSimulation)}>
            Next
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      </div>
      <div className="mt-3 space-y-3">
        {LAB_CATEGORY_ORDER.map((category) => (
          <div key={category}>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {LAB_CATEGORY_LABELS[category]}
            </div>
            <div className="mt-1 grid gap-1">
              {LAB_SIMULATIONS.filter((simulation) => simulation.category === category).map(
                (simulation) => {
                  const active =
                    simulation.category === currentSimulation.category &&
                    simulation.slug === currentSimulation.slug;
                  return (
                    <Button
                      key={simulation.slug}
                      asChild
                      variant={active ? "default" : "ghost"}
                      className="h-auto w-full justify-start whitespace-normal rounded-lg px-2 py-1.5 text-left text-xs"
                    >
                      <Link to={getLabSimulationPath(simulation)}>{simulation.title}</Link>
                    </Button>
                  );
                },
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PhysicsLabRoute() {
  const params = useParams();
  const simulation = LAB_SIMULATIONS.find(
    (candidate) => candidate.category === params.category && candidate.slug === params.slug,
  );

  if (!simulation) {
    return (
      <div className="flex h-full items-center justify-center bg-background p-6 text-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Simulation not found</CardTitle>
            <CardDescription>Choose one of the available physics labs.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to={getLabSimulationPath(LAB_SIMULATIONS[0])}>Open first lab</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const Simulation = simulation.component;

  return <Simulation definition={simulation} />;
}
