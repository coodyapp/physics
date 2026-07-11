import { useState, useRef, useEffect } from "react";
import { FloatingSimulationLayout } from "@/components/floating-simulation-layout";
import { NumberSlider } from "@/components/number-slider";
import { Label } from "@/ui/label";
import { Button } from "@/ui/button";
import { useFrame, useThree } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { Mesh, Vector3 } from "three";
import { PHYSICS_CONSTANTS, SIMULATION_COLORS } from "@/utils/constants";
import { cn } from "@/utils/tailwind";

/**
 * Simulation units.
 *
 * The visualization renders distances in arbitrary "sim units" (the semi-major
 * axis is a = 8) and time in seconds. To keep the physics self-consistent at
 * this scale (real SI constants would produce superluminal, unstable orbits at
 * a = 8 m), we use a unit system where:
 *   - mass is measured in solar masses,
 *   - G_sim = 1,
 *   - c_sim is tuned small enough that the Schwarzschild precession
 *     Δω = 6πGM / (c²a(1-e²)) is visible to the eye, while still satisfying the
 *     weak-field condition v << c.
 *
 * The real-Mercury reference in the info panel still uses SI units.
 */
const SIM_G = 1;
const SIM_C = 8;
const FIXED_TIME_STEP = 1 / 120;
const MAX_SUBSTEPS = 600;
const MAX_BODIES = 12;
const BODY_COLORS = [
  SIMULATION_COLORS.positive,
  SIMULATION_COLORS.negative,
  SIMULATION_COLORS.active,
  SIMULATION_COLORS.accent,
] as const;
const MAX_TRAIL_POINTS = 400;
const TRAIL_SAMPLE_INTERVAL = 0.05;
const SOLAR_MASS_KG = PHYSICS_CONSTANTS.M_sun;
function simMass(kg: number): number {
  return kg / SOLAR_MASS_KG;
}

/**
 * Relativistic perihelion precession per orbit (Schwarzschild), in sim units.
 * Δω = 6πGM / (c²a(1-e²))   [radians per orbit]
 */
export function calculatePrecessionPerOrbit(
  centralMassKg: number,
  semiMajorAxis: number,
  eccentricity: number,
): number {
  validateOrbitParameters(centralMassKg, semiMajorAxis, eccentricity);
  const M = simMass(centralMassKg);
  return (
    (6 * Math.PI * SIM_G * M) / (SIM_C * SIM_C * semiMajorAxis * (1 - eccentricity * eccentricity))
  );
}

/**
 * Real perihelion precession per orbit using SI units.
 * Used for the Mercury reference value (~43 arcsec/century).
 */
export function calculateRealPrecessionPerOrbit(
  centralMassKg: number,
  semiMajorAxisMeters: number,
  eccentricity: number,
): number {
  validateOrbitParameters(centralMassKg, semiMajorAxisMeters, eccentricity);
  const { G, c } = PHYSICS_CONSTANTS;
  return (
    (6 * Math.PI * G * centralMassKg) /
    (c * c * semiMajorAxisMeters * (1 - eccentricity * eccentricity))
  );
}

/**
 * Orbital speed from the vis-viva equation in sim units: v² = GM(2/r - 1/a).
 */
export function calculateOrbitalVelocity(
  centralMassKg: number,
  radius: number,
  semiMajorAxis: number,
): number {
  if (![centralMassKg, radius, semiMajorAxis].every(Number.isFinite)) {
    throw new Error("Orbit parameters must be finite");
  }
  if (centralMassKg <= 0 || radius <= 0 || semiMajorAxis <= 0 || radius >= 2 * semiMajorAxis) {
    throw new Error("Mass and radii must define a bound orbit");
  }
  const M = simMass(centralMassKg);
  return Math.sqrt(SIM_G * M * (2 / radius - 1 / semiMajorAxis));
}

function validateOrbitParameters(mass: number, semiMajorAxis: number, eccentricity: number): void {
  if (![mass, semiMajorAxis, eccentricity].every(Number.isFinite)) {
    throw new Error("Orbit parameters must be finite");
  }
  if (mass <= 0 || semiMajorAxis <= 0 || eccentricity < 0 || eccentricity >= 1) {
    throw new Error("Orbit requires positive mass and axis, with 0 <= eccentricity < 1");
  }
}

function calculateOrbitAcceleration(
  position: Vector3,
  velocity: Vector3,
  centralMassKg: number,
  showRelativity: boolean,
): Vector3 {
  const r = position.length();
  if (r < 1e-9) return new Vector3();

  const M = simMass(centralMassKg);
  const rUnit = position.clone().normalize();
  const acceleration = rUnit.clone().multiplyScalar(-(SIM_G * M) / (r * r));

  // Schwarzschild weak-field correction that produces prograde perihelion precession.
  if (showRelativity) {
    const angularMomentum = position.clone().cross(velocity);
    const L = angularMomentum.length();

    if (L > 1e-10) {
      acceleration.add(
        rUnit.clone().multiplyScalar((-3 * SIM_G * M * L * L) / (SIM_C * SIM_C * r ** 4)),
      );
    }
  }

  return acceleration;
}

export interface OrbitState {
  position: Vector3;
  velocity: Vector3;
}

export function advanceOrbitState(
  state: OrbitState,
  centralMassKg: number,
  showRelativity: boolean,
  dt: number,
): OrbitState {
  if (!Number.isFinite(dt) || dt <= 0) throw new Error("Time step must be finite and positive");
  validateOrbitParameters(centralMassKg, 1, 0);

  const derivative = (position: Vector3, velocity: Vector3) => ({
    position: velocity,
    velocity: calculateOrbitAcceleration(position, velocity, centralMassKg, showRelativity),
  });
  const offset = (base: Vector3, slope: Vector3, scale: number) =>
    base.clone().addScaledVector(slope, scale);
  const k1 = derivative(state.position, state.velocity);
  const k2 = derivative(
    offset(state.position, k1.position, dt / 2),
    offset(state.velocity, k1.velocity, dt / 2),
  );
  const k3 = derivative(
    offset(state.position, k2.position, dt / 2),
    offset(state.velocity, k2.velocity, dt / 2),
  );
  const k4 = derivative(
    offset(state.position, k3.position, dt),
    offset(state.velocity, k3.velocity, dt),
  );
  const combine = (base: Vector3, a: Vector3, b: Vector3, c: Vector3, d: Vector3) =>
    base
      .clone()
      .addScaledVector(a, dt / 6)
      .addScaledVector(b, dt / 3)
      .addScaledVector(c, dt / 3)
      .addScaledVector(d, dt / 6);

  return {
    position: combine(state.position, k1.position, k2.position, k3.position, k4.position),
    velocity: combine(state.velocity, k1.velocity, k2.velocity, k3.velocity, k4.velocity),
  };
}

interface OrbitingBody {
  id: number;
  position: Vector3;
  velocity: Vector3;
  mass: number;
  color: string;
  trail: [number, number, number][];
  semiMajorAxis: number;
  eccentricity: number;
  lastR: number;
  perihelionCount: number;
  trailElapsed: number;
}

function MercuryPrecessionScene({
  starMass,
  planetMass,
  eccentricity,
  speedMultiplier,
  showRelativity,
  addBodiesEnabled,
  resetKey,
  onBodyCountChange,
}: {
  starMass: number;
  planetMass: number;
  eccentricity: number;
  speedMultiplier: number;
  showRelativity: boolean;
  addBodiesEnabled: boolean;
  resetKey: number;
  onBodyCountChange: (count: number) => void;
}) {
  const starRef = useRef<Mesh>(null);
  const accumulatorRef = useRef(0);
  const pointerDownRef = useRef<[number, number] | null>(null);
  const [bodies, setBodies] = useState<OrbitingBody[]>([]);
  const { camera, raycaster, mouse } = useThree();

  useEffect(() => onBodyCountChange(bodies.length), [bodies.length, onBodyCountChange]);

  // Initialize planet orbit
  useEffect(() => {
    const a = 8; // Semi-major axis (scaled for visualization)
    const r0 = a * (1 - eccentricity); // Perihelion distance
    const v0 = calculateOrbitalVelocity(starMass, r0, a);

    const initialBody: OrbitingBody = {
      id: 0,
      position: new Vector3(r0, 0, 0),
      velocity: new Vector3(0, v0, 0),
      mass: planetMass,
      color: SIMULATION_COLORS.positive,
      trail: [],
      semiMajorAxis: a,
      eccentricity: eccentricity,
      lastR: r0,
      perihelionCount: 0,
      trailElapsed: 0,
    };

    accumulatorRef.current = 0;
    setBodies([initialBody]);
  }, [starMass, planetMass, eccentricity, resetKey]);

  // Add bodies on stationary pointer releases, not after camera drags.
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if ((event.target as HTMLElement).tagName?.toLowerCase() === "canvas") {
        pointerDownRef.current = [event.clientX, event.clientY];
      }
    };

    const handlePointerUp = (event: PointerEvent) => {
      const pointerDown = pointerDownRef.current;
      pointerDownRef.current = null;
      if (
        !addBodiesEnabled ||
        !pointerDown ||
        Math.hypot(event.clientX - pointerDown[0], event.clientY - pointerDown[1]) > 5
      ) {
        return;
      }

      const target = event.target as HTMLElement;
      if (!target.tagName || target.tagName.toLowerCase() !== "canvas") return;

      const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      const planeNormal = new Vector3(0, 0, 1);
      const planePoint = new Vector3(0, 0, 0);
      raycaster.setFromCamera(mouse, camera);

      const ray = raycaster.ray;
      const denom = ray.direction.dot(planeNormal);

      if (Math.abs(denom) > 1e-6) {
        const t = planePoint.clone().sub(ray.origin).dot(planeNormal) / denom;

        if (t > 0) {
          const intersect = ray.origin.clone().add(ray.direction.clone().multiplyScalar(t));

          const r = Math.sqrt(intersect.x ** 2 + intersect.y ** 2);
          if (r < 1.5 || r > 15) return; // Prevent too close or too far

          const angle = Math.atan2(intersect.y, intersect.x);

          // Treat clicked point as perihelion so generated state and eccentricity agree.
          const randomE = Math.min(0.7, Math.random() * 0.5);
          const randomA = r / (1 - randomE);
          const v = calculateOrbitalVelocity(starMass, r, randomA);

          const newBody: OrbitingBody = {
            id: Date.now(),
            position: new Vector3(intersect.x, intersect.y, 0),
            velocity: new Vector3(-v * Math.sin(angle), v * Math.cos(angle), 0),
            mass: planetMass * (0.5 + Math.random()),
            color: BODY_COLORS[bodies.length % BODY_COLORS.length],
            trail: [],
            semiMajorAxis: randomA,
            eccentricity: randomE,
            lastR: r,
            perihelionCount: 0,
            trailElapsed: 0,
          };

          setBodies((prev) => {
            if (prev.length >= MAX_BODIES) return prev;
            return [...prev, newBody];
          });
        }
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [addBodiesEnabled, camera, raycaster, mouse, starMass, planetMass]);

  // Fixed-step RK4 keeps simulation independent of render cadence.
  useFrame((_, delta) => {
    accumulatorRef.current += Math.min(delta, 0.25) * speedMultiplier;
    const substeps = Math.min(Math.floor(accumulatorRef.current / FIXED_TIME_STEP), MAX_SUBSTEPS);
    if (substeps === 0) return;
    accumulatorRef.current -= substeps * FIXED_TIME_STEP;

    setBodies((prevBodies) =>
      prevBodies.flatMap((body) => {
        let newPosition = body.position;
        let newVelocity = body.velocity;
        let collided = false;
        let trailElapsed = body.trailElapsed;
        const newTrail = body.trail.slice();

        for (let step = 0; step < substeps; step++) {
          const next = advanceOrbitState(
            { position: newPosition, velocity: newVelocity },
            starMass,
            showRelativity,
            FIXED_TIME_STEP,
          );
          newPosition = next.position;
          newVelocity = next.velocity;
          trailElapsed += FIXED_TIME_STEP;
          if (trailElapsed >= TRAIL_SAMPLE_INTERVAL) {
            trailElapsed %= TRAIL_SAMPLE_INTERVAL;
            newTrail.push([newPosition.x, newPosition.y, newPosition.z]);
            if (newTrail.length > MAX_TRAIL_POINTS) newTrail.shift();
          }
          if (newPosition.length() < 0.8) {
            collided = true;
            break;
          }
        }
        if (collided) return [];

        // Track perihelion passages
        const r = body.position.length();
        const newR = newPosition.length();
        let newPerihelionCount = body.perihelionCount;

        // Detect perihelion: local minimum in r
        if (body.lastR > r && newR > r && r < body.semiMajorAxis * (1 - body.eccentricity) * 1.2) {
          newPerihelionCount++;
        }

        return [
          {
            ...body,
            position: newPosition,
            velocity: newVelocity,
            trail: newTrail,
            lastR: r,
            perihelionCount: newPerihelionCount,
            trailElapsed,
          },
        ];
      }),
    );
  });

  return (
    <>
      {/* Star at center */}
      <mesh ref={starRef} position={[0, 0, 0]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial
          color={SIMULATION_COLORS.source}
          emissive={SIMULATION_COLORS.source}
          emissiveIntensity={1.5}
        />
      </mesh>

      {/* Star glow */}
      <pointLight
        position={[0, 0, 0]}
        intensity={3}
        color={SIMULATION_COLORS.source}
        distance={40}
        decay={2}
      />

      {/* Orbiting bodies */}
      {bodies.map((body) => {
        const pos: [number, number, number] = [body.position.x, body.position.y, body.position.z];
        const size = Math.max(0.15, Math.log10(body.mass / 1e23 + 1) * 0.1);

        return (
          <group key={body.id}>
            {/* Planet */}
            <mesh position={pos}>
              <sphereGeometry args={[size, 16, 16]} />
              <meshStandardMaterial
                color={body.color}
                emissive={body.color}
                emissiveIntensity={0.4}
                metalness={0.3}
                roughness={0.7}
              />
            </mesh>

            {/* Orbit trail */}
            {body.trail.length > 2 && (
              <Line
                points={body.trail}
                color={body.color}
                lineWidth={1.5}
                transparent
                opacity={0.6}
              />
            )}
          </group>
        );
      })}
    </>
  );
}

function MercuryPrecessionSimulation() {
  const [starMass, setStarMass] = useState<number>(PHYSICS_CONSTANTS.M_sun);
  const [planetMass, setPlanetMass] = useState(3.3e23); // Mercury mass
  const [eccentricity, setEccentricity] = useState(0.206); // Mercury eccentricity
  const [speedMultiplier, setSpeedMultiplier] = useState(50);
  const [showRelativity, setShowRelativity] = useState(true);
  const [addBodiesEnabled, setAddBodiesEnabled] = useState(false);
  const [bodyCount, setBodyCount] = useState(1);
  const [resetKey, setResetKey] = useState(0);

  const handleReset = () => {
    setBodyCount(1);
    setStarMass(PHYSICS_CONSTANTS.M_sun);
    setPlanetMass(3.3e23);
    setEccentricity(0.206);
    setSpeedMultiplier(50);
    setShowRelativity(true);
    setAddBodiesEnabled(false);
    setResetKey((value) => value + 1);
  };

  const renderControls = () => (
    <div className="space-y-4">
      <NumberSlider
        label="Star Mass"
        value={starMass / PHYSICS_CONSTANTS.M_sun}
        min={0.5}
        max={3}
        step={0.1}
        onChange={(value) => {
          setStarMass(value * PHYSICS_CONSTANTS.M_sun);
          setBodyCount(1);
        }}
        formatValue={(value) => `${value.toFixed(1)} M☉`}
      />

      <NumberSlider
        label="Planet Mass"
        value={planetMass / 5.972e24}
        min={0.01}
        max={10}
        step={0.01}
        onChange={(value) => {
          setPlanetMass(value * 5.972e24);
          setBodyCount(1);
        }}
        formatValue={(value) => `${value.toFixed(2)} M⊕`}
      />

      <NumberSlider
        label="Eccentricity"
        value={eccentricity}
        min={0}
        max={0.7}
        step={0.01}
        onChange={(value) => {
          setEccentricity(value);
          setBodyCount(1);
        }}
        formatValue={(value) => value.toFixed(3)}
      />

      <NumberSlider
        label="Animation Speed"
        value={speedMultiplier}
        min={1}
        max={200}
        step={1}
        onChange={setSpeedMultiplier}
        formatValue={(value) => `${value.toFixed(0)}×`}
      />

      <div className="flex items-center justify-between pt-2 border-t border-border/40">
        <Label>General Relativity</Label>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "rounded-full border border-border/55 bg-background/45 backdrop-blur-xl hover:bg-background/75",
            showRelativity &&
              "border-primary/60 bg-primary/80 text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
          )}
          onClick={() => setShowRelativity(!showRelativity)}
        >
          {showRelativity ? "ON" : "OFF"}
        </Button>
      </div>

      <Button
        variant="ghost"
        className={cn(
          "w-full rounded-full border border-border/55 bg-background/45 backdrop-blur-xl hover:bg-background/75",
          addBodiesEnabled && "border-primary/60 bg-primary/15",
        )}
        aria-pressed={addBodiesEnabled}
        onClick={() => setAddBodiesEnabled((enabled) => !enabled)}
      >
        {addBodiesEnabled ? "Finish Adding Bodies" : "Add Orbiting Bodies"}
      </Button>

      <Button
        variant="ghost"
        className="w-full rounded-full border border-border/55 bg-background/45 backdrop-blur-xl hover:bg-background/75"
        onClick={handleReset}
      >
        Reset Simulation
      </Button>

      <div className="text-xs text-muted-foreground pt-2 border-t border-border/40">
        <p>
          {addBodiesEnabled
            ? "Click canvas to place a body in the locked orbital plane."
            : "Enable Add Orbiting Bodies, then click canvas."}
        </p>
        <p className="mt-1">
          Bodies: {bodyCount}/{MAX_BODIES}
        </p>
      </div>
    </div>
  );

  const renderInfo = () => {
    const a = 8; // Semi-major axis used in simulation (sim units)
    // Real Schwarzschild radius of the selected star (SI units, for display).
    const rs = (2 * PHYSICS_CONSTANTS.G * starMass) / PHYSICS_CONSTANTS.c ** 2;
    // Simulation precession in sim units -> degrees per orbit (intuitive for the demo).
    const simPrecessionPerOrbit = calculatePrecessionPerOrbit(starMass, a, eccentricity);
    const simDegPerOrbit = (simPrecessionPerOrbit * 180) / Math.PI;
    const perihelion = a * (1 - eccentricity);
    const perihelionSpeed = calculateOrbitalVelocity(starMass, perihelion, a);

    // Real Mercury reference: Δω ≈ 43 arcsec/century (uses SI units & the real Sun).
    const mercuryA = 5.791e10; // meters
    const mercuryRadPerOrbit = calculateRealPrecessionPerOrbit(
      PHYSICS_CONSTANTS.M_sun,
      mercuryA,
      0.206,
    );
    const mercuryArcsecPerOrbit = (mercuryRadPerOrbit * 180 * 3600) / Math.PI;
    const mercuryArcsecPerCentury = mercuryArcsecPerOrbit * 415; // ~415 orbits per century

    return (
      <div className="space-y-2 text-sm">
        <p className="text-muted-foreground">
          Mercury's orbit precesses due to general relativistic effects. The perihelion advances by
          ~43 arcseconds per century.
        </p>

        <div>
          <strong>Schwarzschild Radius:</strong>
          <p className="text-muted-foreground">{(rs / 1000).toFixed(2)} km</p>
        </div>

        <div>
          <strong>Simulation Precession:</strong>
          <p className="text-muted-foreground">
            {showRelativity ? `${simDegPerOrbit.toFixed(2)}°/orbit` : "Disabled (Classical)"}
          </p>
        </div>

        <div>
          <strong>Weak-field check:</strong>
          <p className="text-muted-foreground">
            v/c at perihelion: {(perihelionSpeed / SIM_C).toFixed(3)}
          </p>
        </div>

        <div>
          <strong>Mercury (Real):</strong>
          <p className="text-muted-foreground">
            {mercuryArcsecPerCentury.toFixed(2)} arcsec/century
          </p>
        </div>

        <div className="pt-2 border-t border-border/40">
          <p className="text-xs text-muted-foreground">
            <strong>Schwarzschild Precession Formula:</strong>
          </p>
          <p className="text-xs text-muted-foreground font-mono mt-1">Δω = 6πGM / (c²a(1-e²))</p>
          <p className="text-xs text-muted-foreground mt-2">
            With GR ON, watch the orbit slowly rotate (precess) over time.
          </p>
        </div>
      </div>
    );
  };

  return (
    <FloatingSimulationLayout
      controlsTitle="Mercury Precession Controls"
      informationTitle="Mercury Precession (GR)"
      controls={renderControls()}
      information={renderInfo()}
      cameraPosition={[0, 0, 30]}
      cameraZoom={28}
      defaultCameraMode="2d"
      defaultCameraDirection="xy"
    >
      <MercuryPrecessionScene
        starMass={starMass}
        planetMass={planetMass}
        eccentricity={eccentricity}
        speedMultiplier={speedMultiplier}
        showRelativity={showRelativity}
        addBodiesEnabled={addBodiesEnabled}
        resetKey={resetKey}
        onBodyCountChange={setBodyCount}
      />
    </FloatingSimulationLayout>
  );
}

export { MercuryPrecessionSimulation };
