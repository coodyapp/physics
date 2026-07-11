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
import { IMPORTED_LAB_COMPONENTS } from "@/simulations/imported-physics-labs";
import { useSimulationMotion } from "@/hooks/use-simulation-motion";
import { SIMULATION_COLORS } from "@/utils/constants";

export {
  LAB_CATEGORY_LABELS,
  LAB_CATEGORY_ORDER,
  getLabSimulationPath,
} from "@/simulations/physics-labs-data";
export type { LabCategory, LabSimulationMetadata } from "@/simulations/physics-labs-data";

export interface LabRouteProps {
  definition: LabDefinition;
}

export interface LabDefinition extends LabSimulationMetadata {
  component: ComponentType<LabRouteProps>;
}

function useAnimationTime(speed = 1, resetKey = 0) {
  const [time, setTime] = useState(0);
  const running = useMotionEnabled();

  useEffect(() => {
    setTime(0);
  }, [resetKey]);

  useFrame((_, delta) => {
    if (running) setTime((value) => value + delta * speed);
  });

  return time;
}

export function useMotionEnabled() {
  return useSimulationMotion().isPlaying;
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

function createDynamicSurfaceGeometry(resolution: number, size: number) {
  const positions = new Float32Array(resolution * resolution * 3);
  const colors = new Float32Array(resolution * resolution * 3);
  const indices = new Uint16Array((resolution - 1) * (resolution - 1) * 6);
  const step = size / (resolution - 1);
  const half = size / 2;
  let indexOffset = 0;

  for (let row = 0; row < resolution; row++) {
    for (let column = 0; column < resolution; column++) {
      const offset = (row * resolution + column) * 3;
      positions[offset] = -half + column * step;
      positions[offset + 2] = -half + row * step;

      if (row < resolution - 1 && column < resolution - 1) {
        const a = row * resolution + column;
        const b = a + 1;
        const c = a + resolution;
        const d = c + 1;
        indices.set([a, c, b, b, c, d], indexOffset);
        indexOffset += 6;
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  return { geometry, positions, colors };
}

function writeHsl(
  colors: Float32Array,
  offset: number,
  hue: number,
  saturation: number,
  lightness: number,
) {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const sector = hue * 6;
  const secondary = chroma * (1 - Math.abs((sector % 2) - 1));
  const match = lightness - chroma / 2;
  let red = 0;
  let green = 0;
  let blue = 0;

  if (sector < 1) [red, green] = [chroma, secondary];
  else if (sector < 2) [red, green] = [secondary, chroma];
  else if (sector < 3) [green, blue] = [chroma, secondary];
  else if (sector < 4) [green, blue] = [secondary, chroma];
  else if (sector < 5) [red, blue] = [secondary, chroma];
  else [red, blue] = [chroma, secondary];

  colors[offset] = red + match;
  colors[offset + 1] = green + match;
  colors[offset + 2] = blue + match;
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

export function LabSimulationLayout({
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
  const worldScale = 0.1;
  const launchX = -4.5;
  const path = useMemo(() => {
    return Array.from({ length: 80 }, (_, index) => {
      const t = (index / 79) * flightTime;
      const x = vx * t;
      const y = vy * t - 0.5 * gravity * t * t;

      return [launchX + x * worldScale, y * worldScale, 0] as [number, number, number];
    });
  }, [flightTime, gravity, vx, vy]);

  const t = time % flightTime;
  const px = launchX + vx * t * worldScale;
  const py = (vy * t - 0.5 * gravity * t * t) * worldScale;
  const velocityScale = 0.16;

  return (
    <group>
      <mesh position={[0, -0.06, 0]}>
        <boxGeometry args={[10.5, 0.08, 2.8]} />
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
          [px + vx * velocityScale, py + (vy - gravity * t) * velocityScale, 0],
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
  const angle = (launchAngle * Math.PI) / 180;
  const flightTime = (2 * launchSpeed * Math.sin(angle)) / gravity;
  const range = launchSpeed * Math.cos(angle) * flightTime;

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
          <p className="text-xs text-muted-foreground">
            Flight: {flightTime.toFixed(2)} s | Range: {range.toFixed(2)} m
          </p>
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
  const running = useMotionEnabled();
  const massRef = useRef<THREE.Mesh>(null);
  const stateRef = useRef({ x: 0, v: 0, time: 0, accumulator: 0 });
  const springPositions = useMemo(() => new Float32Array(20 * 3), []);
  const springLine = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(springPositions, 3));
    return new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: "#67e8f9" }));
  }, [springPositions]);

  useEffect(() => {
    stateRef.current = { x: 0, v: 0, time: 0, accumulator: 0 };
  }, [stiffness, damping, drive]);

  useFrame((_, delta) => {
    if (!running) return;
    const state = stateRef.current;
    state.accumulator += Math.min(delta, 0.1);
    const dt = 1 / 120;
    while (state.accumulator >= dt) {
      const force = drive * Math.sin(2 * state.time) - damping * state.v - stiffness * state.x;
      state.v += force * dt;
      state.x += state.v * dt;
      state.time += dt;
      state.accumulator -= dt;
    }
    const massX = 1.6 + state.x;
    if (massRef.current) massRef.current.position.x = massX;
    for (let index = 0; index < 20; index++) {
      const fraction = index / 19;
      springPositions[index * 3] = -3.8 + fraction * (massX + 3.15);
      springPositions[index * 3 + 1] = index === 0 || index === 19 ? 0 : index % 2 ? 0.22 : -0.22;
    }
    (springLine.geometry.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
  });

  return (
    <group>
      <mesh position={[-4.1, 0, 0]}>
        <boxGeometry args={[0.18, 2.8, 2.8]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      <primitive object={springLine} />
      <mesh ref={massRef} position={[1.6, 0, 0]}>
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
  const armRef = useRef<THREE.Group>(null);
  const running = useMotionEnabled();
  const stateRef = useRef({ angle: 0, angularVelocity: 0 });
  const angle0 = (initialAngle * Math.PI) / 180;
  const renderedLength = length * 2.1;

  useEffect(() => {
    stateRef.current = { angle: angle0, angularVelocity: 0 };
    if (armRef.current) armRef.current.rotation.z = angle0;
  }, [angle0, damping, gravity, length]);

  useFrame((_, frameDelta) => {
    if (!running) return;
    const delta = Math.min(frameDelta, 0.05);
    const steps = Math.max(1, Math.ceil(delta / (1 / 120)));
    const dt = delta / steps;
    const state = stateRef.current;

    for (let step = 0; step < steps; step++) {
      state.angularVelocity +=
        (-(gravity / length) * Math.sin(state.angle) - damping * state.angularVelocity) * dt;
      state.angle += state.angularVelocity * dt;
    }
    if (armRef.current) armRef.current.rotation.z = state.angle;
  });

  return (
    <group position={[0, 2.3, 0]}>
      <mesh>
        <sphereGeometry args={[0.12, 20, 20]} />
        <meshStandardMaterial
          color={SIMULATION_COLORS.quantum}
          emissive={SIMULATION_COLORS.quantum}
          emissiveIntensity={0.3}
        />
      </mesh>
      <group ref={armRef}>
        <Line
          points={[
            [0, 0, 0],
            [0, -renderedLength, 0],
          ]}
          color={SIMULATION_COLORS.foreground}
          lineWidth={2}
        />
        <mesh position={[0, -renderedLength, 0]}>
          <sphereGeometry args={[0.32, 32, 32]} />
          <meshStandardMaterial color={SIMULATION_COLORS.active} />
        </mesh>
      </group>
      <Line
        points={Array.from({ length: 32 }, (_, index) => {
          const theta = -angle0 + (index / 31) * angle0 * 2;
          return [Math.sin(theta) * renderedLength, -Math.cos(theta) * renderedLength, -0.05] as [
            number,
            number,
            number,
          ];
        })}
        color={SIMULATION_COLORS.structure}
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
          <p className="text-xs text-muted-foreground">
            Small-angle period: {(2 * Math.PI * Math.sqrt(length / gravity)).toFixed(2)} s
          </p>
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

    const positiveCharges = activeCharges.filter((charge) => charge.q > 0);
    const seedCharges = positiveCharges.length > 0 ? positiveCharges : activeCharges;

    return seedCharges.flatMap((charge) => {
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
          points.push([point.x, point.y, 0]);

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
          <p className="text-xs text-muted-foreground">
            Lines follow E: away from positive charge, toward negative charge.
          </p>
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
  const running = useMotionEnabled();
  const particleRef = useRef<THREE.Mesh>(null);
  const trail = useMemo(() => new Float32Array(160 * 3), []);
  const trailLine = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(trail, 3));
    return new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: "#38bdf8" }));
  }, [trail]);
  const state = useRef({
    position: new THREE.Vector3(-3, 0, 0),
    velocity: new THREE.Vector3(speed, 0, 0),
    accumulator: 0,
  });

  useEffect(() => {
    state.current = {
      position: new THREE.Vector3(-3, 0, 0),
      velocity: new THREE.Vector3(speed, 0, 0),
      accumulator: 0,
    };
    trail.fill(0);
  }, [electricField, magneticField, speed, trail]);

  useFrame((_, delta) => {
    if (!running) return;
    const current = state.current;
    current.accumulator += Math.min(delta, 0.1);
    const dt = 1 / 180;
    while (current.accumulator >= dt) {
      // Boris rotation preserves speed for magnetic-only motion; q/m = 1, E = +y, B = +z.
      current.velocity.y += electricField * dt * 0.5;
      const t = magneticField * dt * 0.5;
      const s = (2 * t) / (1 + t * t);
      const vxPrime = current.velocity.x + current.velocity.y * t;
      const vyPrime = current.velocity.y - current.velocity.x * t;
      current.velocity.x += vyPrime * s;
      current.velocity.y -= vxPrime * s;
      current.velocity.y += electricField * dt * 0.5;
      current.position.addScaledVector(current.velocity, dt);
      current.accumulator -= dt;
    }
    trail.copyWithin(0, 3);
    trail.set(current.position.toArray(), trail.length - 3);
    particleRef.current?.position.copy(current.position);
    (trailLine.geometry.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
  });

  return (
    <group>
      <primitive object={trailLine} />
      <mesh ref={particleRef} position={[-3, 0, 0]}>
        <sphereGeometry args={[0.16, 24, 24]} />
        <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={0.5} />
      </mesh>
      {Array.from({ length: 7 }, (_, index) => (
        <Line
          key={index}
          points={[
            [-3 + index, -2.2, -2.2],
            [-3 + index, -2.2 + electricField, -2.2],
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

function ElectromagneticWaveScene({
  frequency,
  amplitude,
}: {
  frequency: number;
  amplitude: number;
}) {
  const time = useAnimationTime();
  const waveSpeed = 5.56;
  const waveNumber = (frequency * Math.PI * 2) / waveSpeed;
  const ePoints = useMemo(
    () =>
      Array.from({ length: 140 }, (_, index) => {
        const x = -5 + (index / 139) * 10;
        return [
          x,
          Math.sin(x * waveNumber - time * frequency * Math.PI * 2) * 1.2 * amplitude,
          0,
        ] as [number, number, number];
      }),
    [amplitude, frequency, time, waveNumber],
  );
  const hPoints = useMemo(
    () =>
      Array.from({ length: 140 }, (_, index) => {
        const x = -5 + (index / 139) * 10;
        return [
          x,
          0,
          Math.sin(x * waveNumber - time * frequency * Math.PI * 2) * 1.2 * amplitude,
        ] as [number, number, number];
      }),
    [amplitude, frequency, time, waveNumber],
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
  const [amplitude, setAmplitude] = useState(0.92);

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
            label="Field amplitude"
            value={amplitude}
            min={0.4}
            max={0.98}
            step={0.01}
            onChange={setAmplitude}
          />
          <p className="text-xs text-muted-foreground" aria-live="polite">
            Frequency: {frequency.toFixed(1)} Hz | Wave speed: 5.56 scene units/s | Relative
            amplitude: {amplitude.toFixed(2)}
          </p>
        </>
      }
    >
      <ElectromagneticWaveScene frequency={frequency} amplitude={amplitude} />
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
  const running = useMotionEnabled();
  const time = useRef(0);
  const fieldSize = 7.2;
  const plateHalf = fieldSize / 2;
  const surface = useMemo(() => createDynamicSurfaceGeometry(49, fieldSize), []);
  const palette = useMemo(
    () =>
      ["#0f172a", "#0ea5e9", "#22c55e", "#facc15", "#f97316"].map(
        (value) => new THREE.Color(value),
      ),
    [],
  );
  const parameters = useRef({ diffusivity, sourceStrength });
  parameters.current = { diffusivity, sourceStrength };

  useFrame((_, delta) => {
    if (running) time.current += delta * 0.25;
    const pulseAge = time.current + 0.35;
    const initialVariance = 0.55 ** 2;
    const variance = initialVariance + 4 * parameters.current.diffusivity * pulseAge;
    const peakTemperature = parameters.current.sourceStrength * (initialVariance / variance);

    for (let offset = 0; offset < surface.positions.length; offset += 3) {
      const x = surface.positions[offset];
      const z = surface.positions[offset + 2];
      const edgeDistance = plateHalf - Math.max(Math.abs(x), Math.abs(z));
      const temperature = clamp(
        peakTemperature * Math.exp(-(x * x + z * z) / variance) * smoothstep(0, 1.05, edgeDistance),
        0,
        1.25,
      );
      const scaledColor = clamp(temperature / 1.1) * (palette.length - 1);
      const colorIndex = Math.min(palette.length - 2, Math.floor(scaledColor));
      const mix = scaledColor - colorIndex;
      const from = palette[colorIndex];
      const to = palette[colorIndex + 1];
      surface.positions[offset + 1] = temperature * 1.25;
      surface.colors[offset] = from.r + (to.r - from.r) * mix;
      surface.colors[offset + 1] = from.g + (to.g - from.g) * mix;
      surface.colors[offset + 2] = from.b + (to.b - from.b) * mix;
    }
    (surface.geometry.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
    (surface.geometry.getAttribute("color") as THREE.BufferAttribute).needsUpdate = true;
  });
  const boundary = [
    [-plateHalf, 0.03, -plateHalf],
    [plateHalf, 0.03, -plateHalf],
    [plateHalf, 0.03, plateHalf],
    [-plateHalf, 0.03, plateHalf],
    [-plateHalf, 0.03, -plateHalf],
  ] as [number, number, number][];

  return (
    <group>
      <mesh geometry={surface.geometry}>
        <meshBasicMaterial vertexColors side={THREE.DoubleSide} />
      </mesh>
      <Line points={boundary} color="#94a3b8" lineWidth={1.5} />
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
  const count = Math.round(particleCount);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const running = useMotionEnabled();
  const accumulator = useRef(0);
  const particlesRef = useRef(
    Array.from({ length: 140 }, (_, index) => {
      let seed = index + 1;
      const random = () => ((seed = Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
      const gaussian = () =>
        Math.sqrt(-2 * Math.log(Math.max(random(), 1e-9))) * Math.cos(2 * Math.PI * random());
      return {
        position: new THREE.Vector3(
          ((index * 0.61803398875) % 1) * 4.6 - 2.3,
          ((index * 0.41421356237) % 1) * 3.6 - 1.8,
          ((index * 0.73205080757) % 1) * 4.6 - 2.3,
        ),
        velocity: new THREE.Vector3(gaussian(), gaussian(), gaussian()),
      };
    }),
  );
  const matrix = useMemo(() => new THREE.Matrix4(), []);

  useFrame((_, frameDelta) => {
    if (!meshRef.current || !running) return;
    accumulator.current += Math.min(frameDelta, 0.15);
    const fixedDt = 1 / 120;
    const bounds = [2.43, 1.93, 2.43];
    while (accumulator.current >= fixedDt) {
      for (let index = 0; index < count; index++) {
        const particle = particlesRef.current[index];
        particle.position.addScaledVector(particle.velocity, fixedDt * Math.sqrt(temperature));
        (["x", "y", "z"] as const).forEach((axis, axisIndex) => {
          const bound = bounds[axisIndex];
          while (Math.abs(particle.position[axis]) > bound) {
            particle.position[axis] =
              Math.sign(particle.position[axis]) * 2 * bound - particle.position[axis];
            particle.velocity[axis] *= -1;
          }
        });
      }
      accumulator.current -= fixedDt;
    }
    for (let index = 0; index < count; index++) {
      const particle = particlesRef.current[index];
      matrix.makeTranslation(particle.position.x, particle.position.y, particle.position.z);
      meshRef.current.setMatrixAt(index, matrix);
    }
    meshRef.current.count = count;
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <mesh>
        <boxGeometry args={[5, 4, 5]} />
        <meshStandardMaterial color="#1e293b" wireframe transparent opacity={0.32} />
      </mesh>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshStandardMaterial color="#67e8f9" />
      </instancedMesh>
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
          <p className="text-xs text-muted-foreground">
            Relative RMS speed: {Math.sqrt(3 * temperature).toFixed(2)} | Particles: {particleCount}
          </p>
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
    const energyMax = Math.max(7.5, temperature * (densityPower + 14));
    const step = energyMax / 159;
    const samples = Array.from({ length: 160 }, (_, index) => {
      const energy = (index / 159) * energyMax;
      const densityOfStates = energy ** densityPower;
      const occupancy = densityOfStates * Math.exp(-energy / temperature);

      return { energy, occupancy };
    });
    const maxOccupancy = Math.max(...samples.map((sample) => sample.occupancy), 1e-6);
    const partition =
      samples.reduce(
        (sum, sample, index) => sum + sample.occupancy * (index === 0 || index === 159 ? 0.5 : 1),
        0,
      ) * step;
    const meanEnergy =
      (samples.reduce(
        (sum, sample, index) =>
          sum + sample.energy * sample.occupancy * (index === 0 || index === 159 ? 0.5 : 1),
        0,
      ) *
        step) /
      partition;
    const points = samples.map(({ energy, occupancy }) => {
      const x = (energy / energyMax) * 7.2 - 3.6;
      const y = (occupancy / partition / (maxOccupancy / partition)) * 3.2;

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
      const target = ((index * 0.61803398875) % 1) * (partition / step);
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
          Math.SQRT2 * a1 * Math.sin(Math.PI * x) * Math.cos(time) +
          Math.SQRT2 * a2 * Math.sin(n2 * Math.PI * x) * Math.cos(n2 * n2 * time);
        const imag =
          -Math.SQRT2 * a1 * Math.sin(Math.PI * x) * Math.sin(time) -
          Math.SQRT2 * a2 * Math.sin(n2 * Math.PI * x) * Math.sin(n2 * n2 * time);
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
  barrierWidth,
  packetEnergy,
  resetKey,
}: {
  barrierHeight: number;
  barrierWidth: number;
  packetEnergy: number;
  resetKey: number;
}) {
  const time = useAnimationTime(0.55 + packetEnergy * 0.15, resetKey);
  const phase = time % 8;
  const center = -3.5 + phase;
  const barrierX = 0.6;
  const hasScattered = center >= barrierX;
  const transmission = (() => {
    const energy = Math.max(packetEnergy, 1e-6);
    const height = Math.max(barrierHeight, 1e-6);
    if (Math.abs(energy - height) < 1e-6) return 1 / (1 + (height * barrierWidth ** 2) / 2);
    if (energy < height) {
      const kappa = Math.sqrt(2 * (height - energy));
      return (
        1 /
        (1 +
          (height ** 2 * Math.sinh(kappa * barrierWidth) ** 2) / (4 * energy * (height - energy)))
      );
    }
    const waveNumber = Math.sqrt(2 * (energy - height));
    return (
      1 /
      (1 +
        (height ** 2 * Math.sin(waveNumber * barrierWidth) ** 2) / (4 * energy * (energy - height)))
    );
  })();
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
        <boxGeometry args={[barrierWidth, barrierHeight, 1.4]} />
        <meshStandardMaterial color="#fb7185" transparent opacity={0.38} />
      </mesh>
      <Line points={points} color="#67e8f9" lineWidth={3} />
    </group>
  );
}

function QuantumTunnelingLab({ definition }: LabRouteProps) {
  const [barrierHeight, setBarrierHeight] = useState(1.4);
  const [barrierWidth, setBarrierWidth] = useState(0.7);
  const [packetEnergy, setPacketEnergy] = useState(1.1);
  const [resetKey, setResetKey] = useState(0);

  return (
    <LabSimulationLayout
      definition={definition}
      controls={
        <>
          <NumberSlider
            label="Barrier width"
            value={barrierWidth}
            min={0.2}
            max={1.6}
            step={0.1}
            onChange={setBarrierWidth}
            formatValue={(value) => `${value.toFixed(1)} units`}
          />
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
        barrierWidth={barrierWidth}
        packetEnergy={packetEnergy}
        resetKey={resetKey}
      />
    </LabSimulationLayout>
  );
}

function Schrodinger2DScene({ spread, potential }: { spread: number; potential: number }) {
  const running = useMotionEnabled();
  const time = useRef(0);
  const fieldSize = 7.2;
  const boundaryHalf = fieldSize / 2;
  const barrierCenter: [number, number] = [1.25, 0];
  const barrierRadius = 0.82;
  const surface = useMemo(() => createDynamicSurfaceGeometry(55, fieldSize), []);
  const parameters = useRef({ spread, potential });
  parameters.current = { spread, potential };

  useFrame((_, delta) => {
    if (running) time.current += delta * 0.35;
    const cycle = time.current % 9;
    const packetCenter = -3.15 + cycle * 0.86;
    const encounter = smoothstep(barrierCenter[0] - 1.05, barrierCenter[0] + 0.35, packetCenter);
    const transmission = clamp(Math.exp(-parameters.current.potential * 0.68), 0.12, 1);
    const reflection = 1 - transmission;
    const sigma = (0.34 + parameters.current.spread * 4.5) * (1 + cycle * 0.055);
    const reflectedCenter = barrierCenter[0] - (packetCenter - barrierCenter[0]) * 0.72;

    for (let offset = 0; offset < surface.positions.length; offset += 3) {
      const x = surface.positions[offset];
      const z = surface.positions[offset + 2];
      const edgeFade =
        smoothstep(0, 0.55, boundaryHalf - Math.abs(x)) *
        smoothstep(0, 0.55, boundaryHalf - Math.abs(z));
      const incident =
        (1 - encounter) * Math.exp(-((x - packetCenter) ** 2 + z * z) / (2 * sigma ** 2));
      const reflected =
        encounter * reflection * Math.exp(-((x - reflectedCenter) ** 2 + z * z) / (2 * sigma ** 2));
      const transmitted =
        encounter * transmission * Math.exp(-((x - packetCenter) ** 2 + z * z) / (2 * sigma ** 2));
      const barrierProfile = Math.exp(
        -((x - barrierCenter[0]) ** 2 + z * z) / (barrierRadius * barrierRadius),
      );
      const density =
        clamp((incident + reflected + transmitted) * edgeFade) *
        (1 - clamp(parameters.current.potential * 0.26) * barrierProfile);
      const phase =
        7.2 * x -
        time.current * 4.6 +
        encounter * reflection * Math.atan2(z, x - barrierCenter[0]) +
        parameters.current.potential * barrierProfile;
      const hue = (((phase / (Math.PI * 2)) % 1) + 1) % 1;
      surface.positions[offset + 1] = density * 1.7;
      writeHsl(surface.colors, offset, hue, 0.82, 0.24 + density * 0.45);
    }
    (surface.geometry.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
    (surface.geometry.getAttribute("color") as THREE.BufferAttribute).needsUpdate = true;
  });
  const boundary = [
    [-boundaryHalf, 0.035, -boundaryHalf],
    [boundaryHalf, 0.035, -boundaryHalf],
    [boundaryHalf, 0.035, boundaryHalf],
    [-boundaryHalf, 0.035, boundaryHalf],
    [-boundaryHalf, 0.035, -boundaryHalf],
  ] as [number, number, number][];
  return (
    <group>
      <mesh geometry={surface.geometry}>
        <meshBasicMaterial vertexColors side={THREE.DoubleSide} />
      </mesh>
      <Line points={boundary} color="#94a3b8" lineWidth={1.5} />
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
  ...IMPORTED_LAB_COMPONENTS,
};

export const LAB_SIMULATIONS: LabDefinition[] = LAB_SIMULATION_METADATA.map((simulation) => {
  const component = LAB_COMPONENTS[simulation.slug];
  if (!component) throw new Error(`Missing lab component for metadata slug: ${simulation.slug}`);

  return { ...simulation, component };
});

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
