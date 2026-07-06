import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Link, useParams } from "react-router-dom";
import * as THREE from "three";

import { FloatingSimulationLayout } from "@/components/floating-simulation-layout";
import { NumberSlider } from "@/components/number-slider";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import {
  LAB_CATEGORY_LABELS,
  LAB_SIMULATIONS as LAB_SIMULATION_METADATA,
  getLabSimulationPath,
  type LabSimulationMetadata,
} from "@/simulations/physics-labs-data";

export {
  LAB_CATEGORY_LABELS,
  LAB_CATEGORY_ORDER,
  getLabSimulationPath,
} from "@/simulations/physics-labs-data";
export type { LabCategory, LabSimulationMetadata } from "@/simulations/physics-labs-data";

interface LabRouteProps {
  definition: LabDefinition;
}

export interface LabDefinition extends LabSimulationMetadata {
  component: ComponentType<LabRouteProps>;
}

function useAnimationTime(speed = 1, resetKey = 0) {
  const [time, setTime] = useState(0);

  useEffect(() => {
    setTime(0);
  }, [resetKey]);

  useFrame((_, delta) => {
    setTime((value) => value + delta * speed);
  });

  return time;
}

function hslColor(hue: number, saturation = 85, lightness = 55) {
  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp((value - edge0) / (edge1 - edge0));

  return t * t * (3 - 2 * t);
}

function gradientColor(value: number, stops: string[]) {
  const scaled = clamp(value) * (stops.length - 1);
  const index = Math.min(stops.length - 2, Math.floor(scaled));
  const localT = scaled - index;

  return new THREE.Color(stops[index]).lerp(new THREE.Color(stops[index + 1]), localT);
}

function createSurfaceGeometry({
  resolution,
  size,
  sample,
}: {
  resolution: number;
  size: number;
  sample: (x: number, z: number) => { height: number; color: THREE.Color };
}) {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const step = size / (resolution - 1);
  const half = size / 2;

  for (let row = 0; row < resolution; row++) {
    const z = -half + row * step;

    for (let column = 0; column < resolution; column++) {
      const x = -half + column * step;
      const { height, color } = sample(x, z);

      positions.push(x, height, z);
      colors.push(color.r, color.g, color.b);
    }
  }

  for (let row = 0; row < resolution - 1; row++) {
    for (let column = 0; column < resolution - 1; column++) {
      const a = row * resolution + column;
      const b = a + 1;
      const c = a + resolution;
      const d = c + 1;

      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  return geometry;
}

function circlePoints({
  center,
  radius,
  y = 0.04,
  segments = 96,
}: {
  center: [number, number];
  radius: number;
  y?: number;
  segments?: number;
}) {
  return Array.from({ length: segments + 1 }, (_, index) => {
    const angle = (index / segments) * Math.PI * 2;

    return [center[0] + Math.cos(angle) * radius, y, center[1] + Math.sin(angle) * radius] as [
      number,
      number,
      number,
    ];
  });
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
  const charges = useMemo(
    () => [
      { x: -separation * 1.8, q: 1, color: "#38bdf8" },
      {
        x: separation * 1.8,
        q: chargeRatio,
        color: chargeRatio === 0 ? "#94a3b8" : chargeRatio > 0 ? "#38bdf8" : "#fb7185",
      },
    ],
    [chargeRatio, separation],
  );
  const lines = useMemo(() => {
    const activeCharges = charges.filter((charge) => Math.abs(charge.q) > 1e-6);

    function fieldAt(point: THREE.Vector2) {
      return activeCharges.reduce((field, charge) => {
        const dx = point.x - charge.x;
        const dy = point.y;
        const r2 = Math.max(dx * dx + dy * dy, 0.12);
        const strength = charge.q / (r2 * Math.sqrt(r2));
        field.x += dx * strength;
        field.y += dy * strength;
        return field;
      }, new THREE.Vector2());
    }

    return activeCharges.flatMap((charge) => {
      const seedCount = Math.max(4, Math.round(12 * Math.min(2, Math.abs(charge.q))));

      return Array.from({ length: seedCount }, (_, line) => {
        const angle = (line / seedCount) * Math.PI * 2;
        const point = new THREE.Vector2(charge.x + Math.cos(angle) * 0.36, Math.sin(angle) * 0.36);
        const direction = charge.q > 0 ? 1 : -1;
        const points: [number, number, number][] = [[point.x, point.y, 0]];

        for (let step = 0; step < 90; step++) {
          const field = fieldAt(point);
          if (field.lengthSq() < 1e-8) break;

          point.add(field.normalize().multiplyScalar(direction * 0.11));
          points.push([point.x, point.y, Math.sin(step * 0.18 + angle) * 0.12]);

          if (point.length() > 6) break;
          if (
            activeCharges.some(
              (other) => other !== charge && point.distanceTo(new THREE.Vector2(other.x, 0)) < 0.42,
            )
          ) {
            break;
          }
        }

        return { points, color: charge.color };
      });
    });
  }, [charges]);

  return (
    <group>
      {lines.map((line, index) => (
        <Line key={index} points={line.points} color={line.color} lineWidth={1.4} />
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
  const radius = Math.max(0.35, (speed * 1.3) / magneticField);
  const cyclotronFrequency = magneticField * 2.4;
  const electricDrift = electricField / magneticField;
  const trail = useMemo(() => {
    return Array.from({ length: 160 }, (_, index) => {
      const t = time - (159 - index) * 0.035;
      return [
        Math.cos(t * cyclotronFrequency) * radius + electricDrift * t * 0.35,
        Math.sin(t * cyclotronFrequency) * radius,
        ((t * speed * 0.45) % 5) - 2.5,
      ] as [number, number, number];
    });
  }, [cyclotronFrequency, electricDrift, radius, speed, time]);
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
        return [x, 0, Math.sin(x * 1.8 - time * frequency * Math.PI * 2) * 1.2 * courant] as [
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
  const fieldSize = 7.2;
  const plateHalf = fieldSize / 2;
  const pulseAge = (time % 7) + 0.35;
  const diffusionLength = 0.55 + Math.sqrt(diffusivity * 18 * pulseAge);
  const peakTemperature = sourceStrength * (0.9 / (0.9 + diffusivity * pulseAge));
  const geometry = useMemo(
    () =>
      createSurfaceGeometry({
        resolution: 49,
        size: fieldSize,
        sample: (x, z) => {
          const r2 = x * x + z * z;
          const edgeDistance = plateHalf - Math.max(Math.abs(x), Math.abs(z));
          const coldBoundary = smoothstep(0, 1.05, edgeDistance);
          const transientPulse =
            peakTemperature * Math.exp(-r2 / (diffusionLength * diffusionLength));
          const sustainedSource = sourceStrength * 0.32 * Math.exp(-r2 / 0.48);
          const temperature = clamp((transientPulse + sustainedSource) * coldBoundary, 0, 1.25);
          const normalizedTemperature = clamp(temperature / 1.1);

          return {
            height: temperature * 1.25,
            color: gradientColor(normalizedTemperature, [
              "#0f172a",
              "#0ea5e9",
              "#22c55e",
              "#facc15",
              "#f97316",
            ]),
          };
        },
      }),
    [diffusionLength, fieldSize, peakTemperature, plateHalf, sourceStrength],
  );
  const contours = useMemo(
    () =>
      [0.18, 0.34, 0.52, 0.72].flatMap((level) => {
        const radiusSquared =
          -diffusionLength * diffusionLength * Math.log(level / peakTemperature);
        if (!Number.isFinite(radiusSquared) || radiusSquared <= 0) return [];

        const radius = Math.sqrt(radiusSquared);
        if (radius >= plateHalf) return [];

        return [{ level, radius }];
      }),
    [diffusionLength, peakTemperature, plateHalf],
  );
  const boundary = [
    [-plateHalf, 0.03, -plateHalf],
    [plateHalf, 0.03, -plateHalf],
    [plateHalf, 0.03, plateHalf],
    [-plateHalf, 0.03, plateHalf],
    [-plateHalf, 0.03, -plateHalf],
  ] as [number, number, number][];

  return (
    <group>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          vertexColors
          roughness={0.62}
          metalness={0.02}
          side={THREE.DoubleSide}
        />
      </mesh>
      <Line points={boundary} color="#94a3b8" lineWidth={1.5} />
      {contours.map(({ level, radius }) => (
        <Line
          key={level}
          points={circlePoints({ center: [0, 0], radius, y: 0.09 })}
          color={level > 0.5 ? "#fde68a" : "#7dd3fc"}
          lineWidth={1.25}
        />
      ))}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.26, 0.26, 0.08, 48]} />
        <meshStandardMaterial color="#fb923c" emissive="#f97316" emissiveIntensity={0.45} />
      </mesh>
      <Line
        points={circlePoints({ center: [0, 0], radius: 0.34, y: 0.16 })}
        color="#fed7aa"
        lineWidth={2}
      />
    </group>
  );
}

function HeatDiffusionLab({ definition }: LabRouteProps) {
  const [diffusivity, setDiffusivity] = useState(0.18);
  const [sourceStrength, setSourceStrength] = useState(0.85);

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
  const count = Math.round(particleCount);
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
  densityPower,
}: {
  temperature: number;
  densityPower: number;
}) {
  const distribution = useMemo(() => {
    const energyMax = 7.5;
    const samples = Array.from({ length: 160 }, (_, index) => {
      const energy = (index / 159) * energyMax;
      const densityOfStates = Math.max(energy, 0.03) ** densityPower;
      const occupancy = densityOfStates * Math.exp(-energy / temperature);

      return { energy, occupancy };
    });
    const maxOccupancy = Math.max(...samples.map((sample) => sample.occupancy), 1e-6);
    const partition = samples.reduce((sum, sample) => sum + sample.occupancy, 0);
    const meanEnergy =
      samples.reduce((sum, sample) => sum + sample.energy * sample.occupancy, 0) / partition;
    const points = samples.map(({ energy, occupancy }) => {
      const x = (energy / energyMax) * 7.2 - 3.6;
      const y = (occupancy / maxOccupancy) * 3.2;

      return [x, y, 0] as [number, number, number];
    });
    const areaPositions: number[] = [];
    const areaColors: number[] = [];
    const areaIndices: number[] = [];

    samples.forEach(({ energy, occupancy }, index) => {
      const x = (energy / energyMax) * 7.2 - 3.6;
      const y = (occupancy / maxOccupancy) * 3.2;
      const color = gradientColor(energy / energyMax, ["#38bdf8", "#22c55e", "#facc15"]);

      areaPositions.push(x, 0, 0, x, y, 0);
      areaColors.push(color.r, color.g, color.b, color.r, color.g, color.b);

      if (index < samples.length - 1) {
        const base = index * 2;
        areaIndices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
      }
    });

    const areaGeometry = new THREE.BufferGeometry();
    areaGeometry.setIndex(areaIndices);
    areaGeometry.setAttribute("position", new THREE.Float32BufferAttribute(areaPositions, 3));
    areaGeometry.setAttribute("color", new THREE.Float32BufferAttribute(areaColors, 3));
    areaGeometry.computeVertexNormals();

    const ensemble = Array.from({ length: 72 }, (_, index) => {
      const target = ((index * 0.61803398875) % 1) * partition;
      let cumulative = 0;
      const sample =
        samples.find((candidate) => {
          cumulative += candidate.occupancy;
          return cumulative >= target;
        }) ?? samples[samples.length - 1];
      const energyJitter = (((index * 37) % 19) / 18 - 0.5) * 0.16;
      const x = (clamp(sample.energy + energyJitter, 0, energyMax) / energyMax) * 7.2 - 3.6;
      const z = -0.72 + ((index % 6) / 5) * 0.42;
      const y = 0.05 + Math.floor(index / 6) * 0.035;

      return {
        x,
        y,
        z,
        color: gradientColor(sample.energy / energyMax, ["#38bdf8", "#22c55e", "#facc15"]),
      };
    });

    return {
      areaGeometry,
      points,
      ensemble,
      meanEnergyX: (meanEnergy / energyMax) * 7.2 - 3.6,
    };
  }, [densityPower, temperature]);
  const xAxis = [
    [-3.8, 0, 0],
    [3.8, 0, 0],
  ] as [number, number, number][];
  const yAxis = [
    [-3.6, 0, 0],
    [-3.6, 3.45, 0],
  ] as [number, number, number][];

  return (
    <group rotation={[-0.18, 0, 0]}>
      <Line points={xAxis} color="#94a3b8" lineWidth={1.4} />
      <Line points={yAxis} color="#94a3b8" lineWidth={1.4} />
      <mesh geometry={distribution.areaGeometry}>
        <meshStandardMaterial
          vertexColors
          transparent
          opacity={0.38}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <Line points={distribution.points} color="#67e8f9" lineWidth={3} />
      <Line
        points={[
          [distribution.meanEnergyX, 0, 0.02],
          [distribution.meanEnergyX, 3.28, 0.02],
        ]}
        color="#fbbf24"
        lineWidth={1.8}
      />
      {distribution.ensemble.map((particle, index) => (
        <mesh key={index} position={[particle.x, particle.y, particle.z]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshStandardMaterial
            color={particle.color}
            emissive={particle.color}
            emissiveIntensity={0.16}
          />
        </mesh>
      ))}
    </group>
  );
}

function BoltzmannDistributionLab({ definition }: LabRouteProps) {
  const [temperature, setTemperature] = useState(1.2);
  const [densityPower, setDensityPower] = useState(0.5);

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
            label="Density-of-states power"
            value={densityPower}
            min={0}
            max={1.5}
            step={0.1}
            onChange={setDensityPower}
          />
        </>
      }
    >
      <BoltzmannDistributionScene temperature={temperature} densityPower={densityPower} />
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
  const time = useAnimationTime(0.55 + packetEnergy * 0.15, resetKey);
  const phase = time % 8;
  const center = -3.5 + phase;
  const barrierX = 0.6;
  const hasScattered = center >= barrierX;
  const transmission =
    barrierHeight <= packetEnergy ? 1 : Math.exp(-2.2 * (barrierHeight - packetEnergy));
  const reflection = 1 - transmission;
  const points = useMemo(
    () =>
      Array.from({ length: 180 }, (_, index) => {
        const x = index / 179;
        const worldX = x * 8 - 4;
        const reflectedCenter = 2 * barrierX - center;
        const reflected = hasScattered
          ? Math.exp(-((worldX - reflectedCenter) ** 2) / 0.55) * packetEnergy * reflection
          : 0;
        const transmitted =
          Math.exp(-((worldX - center) ** 2) / 0.55) *
          packetEnergy *
          (hasScattered ? transmission : 1);
        return [worldX, (reflected + transmitted) * 1.2, 0] as [number, number, number];
      }),
    [barrierX, center, hasScattered, packetEnergy, reflection, transmission],
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
            variant="ghost"
            className="w-full rounded-full border border-border/55 bg-background/45 backdrop-blur-xl hover:bg-background/75"
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
  const fieldSize = 7.2;
  const boundaryHalf = fieldSize / 2;
  const barrierCenter: [number, number] = [1.25, 0];
  const barrierRadius = 0.82;
  const sigma0 = 0.34 + spread * 4.5;
  const cycle = time % 9;
  const packetCenter = -3.15 + cycle * 0.86;
  const encounter = smoothstep(barrierCenter[0] - 1.05, barrierCenter[0] + 0.35, packetCenter);
  const transmission = clamp(Math.exp(-potential * 0.68), 0.12, 1);
  const reflection = 1 - transmission;
  const sigma = sigma0 * (1 + cycle * 0.055);
  const waveNumber = 7.2;
  const geometry = useMemo(
    () =>
      createSurfaceGeometry({
        resolution: 55,
        size: fieldSize,
        sample: (x, z) => {
          const edgeFade =
            smoothstep(0, 0.55, boundaryHalf - Math.abs(x)) *
            smoothstep(0, 0.55, boundaryHalf - Math.abs(z));
          const incidentEnvelope = Math.exp(
            -(((x - packetCenter) ** 2 + z * z) / (2 * sigma ** 2)),
          );
          const reflectedCenter = barrierCenter[0] - (packetCenter - barrierCenter[0]) * 0.72;
          const reflectedEnvelope =
            encounter *
            reflection *
            Math.exp(-(((x - reflectedCenter) ** 2 + z * z) / (2 * (sigma * 1.08) ** 2))) *
            smoothstep(barrierCenter[0] + 0.25, barrierCenter[0] - 1.3, x);
          const transmittedEnvelope =
            (1 - encounter + encounter * transmission) *
            incidentEnvelope *
            smoothstep(barrierCenter[0] - 0.55, barrierCenter[0] + 0.35, x + sigma);
          const incomingEnvelope = incidentEnvelope * (1 - encounter * 0.55);
          const interference =
            1 +
            0.32 *
              encounter *
              reflection *
              Math.cos(2 * waveNumber * (x - barrierCenter[0]) - time * 5.5) *
              Math.exp(-((x - barrierCenter[0]) ** 2 + z * z) / 3.2);
          const barrierProfile = Math.exp(
            -(
              ((x - barrierCenter[0]) ** 2 + (z - barrierCenter[1]) ** 2) /
              (barrierRadius * barrierRadius)
            ),
          );
          const density =
            clamp(
              (incomingEnvelope + transmittedEnvelope + reflectedEnvelope) *
                interference *
                edgeFade,
            ) *
            (1 - clamp(potential * 0.26) * barrierProfile);
          const phase =
            waveNumber * x -
            time * 4.6 +
            encounter * reflection * Math.atan2(z, x - barrierCenter[0]) +
            potential * barrierProfile;
          const phaseHue = (((phase / (Math.PI * 2)) % 1) + 1) % 1;

          return {
            height: density * 1.7,
            color: new THREE.Color(hslColor(phaseHue * 360, 82, 24 + density * 45)),
          };
        },
      }),
    [
      barrierCenter,
      barrierRadius,
      boundaryHalf,
      encounter,
      fieldSize,
      packetCenter,
      potential,
      reflection,
      sigma,
      time,
      transmission,
    ],
  );
  const boundary = [
    [-boundaryHalf, 0.035, -boundaryHalf],
    [boundaryHalf, 0.035, -boundaryHalf],
    [boundaryHalf, 0.035, boundaryHalf],
    [-boundaryHalf, 0.035, boundaryHalf],
    [-boundaryHalf, 0.035, -boundaryHalf],
  ] as [number, number, number][];
  const densityContours = useMemo(() => {
    const incident = [0.28, 0.48, 0.68].map((level) => ({
      center: [packetCenter, 0] as [number, number],
      radius: sigma * Math.sqrt(-2 * Math.log(level)),
      level,
      color: "#bfdbfe",
    }));
    const reflectedCenter = barrierCenter[0] - (packetCenter - barrierCenter[0]) * 0.72;
    const reflected =
      encounter > 0.12
        ? [0.36, 0.58]
            .map((level) => ({
              center: [reflectedCenter, 0] as [number, number],
              radius: sigma * Math.sqrt(-2 * Math.log(level / Math.max(reflection, 0.12))),
              level,
              color: "#f0abfc",
            }))
            .filter((contour) => Number.isFinite(contour.radius) && contour.radius > 0)
        : [];

    return [...incident, ...reflected].filter(
      (contour) => contour.radius > 0.12 && contour.radius < boundaryHalf,
    );
  }, [barrierCenter, boundaryHalf, encounter, packetCenter, reflection, sigma]);

  return (
    <group>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          vertexColors
          roughness={0.58}
          metalness={0.02}
          side={THREE.DoubleSide}
        />
      </mesh>
      <Line points={boundary} color="#94a3b8" lineWidth={1.5} />
      {densityContours.map((contour, index) => (
        <Line
          key={`${contour.level}-${index}`}
          points={circlePoints({ center: contour.center, radius: contour.radius, y: 0.08 })}
          color={contour.color}
          lineWidth={1.1}
        />
      ))}
      <mesh position={[barrierCenter[0], 0.09, barrierCenter[1]]}>
        <cylinderGeometry args={[barrierRadius, barrierRadius, 0.12 + potential * 0.12, 72]} />
        <meshStandardMaterial color="#fb7185" transparent opacity={0.28} roughness={0.45} />
      </mesh>
      <Line
        points={circlePoints({
          center: barrierCenter,
          radius: barrierRadius,
          y: 0.18 + potential * 0.06,
        })}
        color="#fda4af"
        lineWidth={1.8}
      />
    </group>
  );
}

function QuantumWavePacket2DLab({ definition }: LabRouteProps) {
  const [spread, setSpread] = useState(0.07);
  const [potential, setPotential] = useState(1.1);

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

const LAB_COMPONENTS: Record<string, ComponentType<LabRouteProps>> = {
  "projectile-motion": ProjectileMotionLab,
  "spring-mass-oscillator": SpringMassLab,
  "damped-pendulum": DampedPendulumLab,
  "electric-field-lines": ElectricFieldLinesLab,
  "charged-particle-motion": ChargedParticleMotionLab,
  "em-wave-propagation": ElectromagneticWaveLab,
  "heat-diffusion": HeatDiffusionLab,
  "ideal-gas": IdealGasLab,
  "boltzmann-distribution": BoltzmannDistributionLab,
  "particle-in-box": ParticleInBoxLab,
  "quantum-tunneling": QuantumTunnelingLab,
  "schrodinger-2d": QuantumWavePacket2DLab,
};

export const LAB_SIMULATIONS: LabDefinition[] = LAB_SIMULATION_METADATA.map((simulation) => ({
  ...simulation,
  component: LAB_COMPONENTS[simulation.slug],
}));

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
