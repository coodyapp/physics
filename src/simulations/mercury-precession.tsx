import { useState, useRef, useEffect } from "react";
import { FloatingSimulationLayout } from "@/components/floating-simulation-layout";
import { NumberSlider } from "@/components/number-slider";
import { Label } from "@/ui/label";
import { Button } from "@/ui/button";
import { useFrame, useThree } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { Mesh, Vector3 } from "three";
import { PHYSICS_CONSTANTS } from "@/utils/constants";

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
  const M = simMass(centralMassKg);
  return Math.sqrt(SIM_G * M * (2 / radius - 1 / semiMajorAxis));
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
  const acceleration = calculateOrbitAcceleration(
    state.position,
    state.velocity,
    centralMassKg,
    showRelativity,
  );
  const position = state.position
    .clone()
    .add(state.velocity.clone().multiplyScalar(dt))
    .add(acceleration.clone().multiplyScalar(0.5 * dt * dt));
  const predictedVelocity = state.velocity.clone().add(acceleration.clone().multiplyScalar(dt));
  const nextAcceleration = calculateOrbitAcceleration(
    position,
    predictedVelocity,
    centralMassKg,
    showRelativity,
  );
  const velocity = state.velocity.clone().add(
    acceleration
      .clone()
      .add(nextAcceleration)
      .multiplyScalar(0.5 * dt),
  );

  return { position, velocity };
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
}

function MercuryPrecessionScene({
  starMass,
  planetMass,
  eccentricity,
  speedMultiplier,
  showRelativity,
  resetKey,
  onBodyClick,
}: {
  starMass: number;
  planetMass: number;
  eccentricity: number;
  speedMultiplier: number;
  showRelativity: boolean;
  resetKey: number;
  onBodyClick: () => void;
}) {
  const starRef = useRef<Mesh>(null);
  const [bodies, setBodies] = useState<OrbitingBody[]>([]);
  const { camera, raycaster, mouse } = useThree();

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
      color: "#3b82f6",
      trail: [],
      semiMajorAxis: a,
      eccentricity: eccentricity,
      lastR: r0,
      perihelionCount: 0,
    };

    setBodies([initialBody]);
  }, [starMass, planetMass, eccentricity, resetKey]);

  // Handle mouse clicks to add random bodies
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
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

          // Random orbital parameters
          const randomA = r * (1 + Math.random() * 0.3);
          const randomE = Math.min(0.7, Math.random() * 0.5);
          const v = calculateOrbitalVelocity(starMass, r, randomA);

          const newBody: OrbitingBody = {
            id: Date.now(),
            position: new Vector3(intersect.x, intersect.y, 0),
            velocity: new Vector3(-v * Math.sin(angle), v * Math.cos(angle), 0),
            mass: planetMass * (0.5 + Math.random()),
            color: `hsl(${Math.random() * 360}, 70%, 60%)`,
            trail: [],
            semiMajorAxis: randomA,
            eccentricity: randomE,
            lastR: r,
            perihelionCount: 0,
          };

          setBodies((prev) => [...prev, newBody]);
          onBodyClick();
        }
      }
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [camera, raycaster, mouse, starMass, planetMass, onBodyClick]);

  // Physics integration (velocity Verlet) in simulation units.
  useFrame((_, delta) => {
    const dt = Math.min(delta * speedMultiplier * 0.4, 0.5); // Cap dt to keep the integrator stable

    setBodies((prevBodies) =>
      prevBodies.map((body) => {
        const r = body.position.length();
        if (r < 0.5) return body; // Prevent collision with star

        const { position: newPosition, velocity: newVelocity } = advanceOrbitState(
          body,
          starMass,
          showRelativity,
          dt,
        );

        // Update trail
        const newTrail: [number, number, number][] = [
          ...body.trail,
          [newPosition.x, newPosition.y, newPosition.z],
        ];
        if (newTrail.length > 800) newTrail.shift();

        // Track perihelion passages
        const newR = newPosition.length();
        let newPerihelionCount = body.perihelionCount;

        // Detect perihelion: local minimum in r
        if (body.lastR > r && newR > r && r < body.semiMajorAxis * (1 - body.eccentricity) * 1.2) {
          newPerihelionCount++;
        }

        return {
          ...body,
          position: newPosition,
          velocity: newVelocity,
          trail: newTrail,
          lastR: r,
          perihelionCount: newPerihelionCount,
        };
      }),
    );
  });

  return (
    <>
      {/* Star at center */}
      <mesh ref={starRef} position={[0, 0, 0]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={1.5} />
      </mesh>

      {/* Star glow */}
      <pointLight position={[0, 0, 0]} intensity={3} color="#fbbf24" distance={40} decay={2} />

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
  const [bodyCount, setBodyCount] = useState(1);
  const [resetKey, setResetKey] = useState(0);

  const handleBodyClick = () => {
    setBodyCount((prev) => prev + 1);
  };

  const handleReset = () => {
    setBodyCount(1);
    setStarMass(PHYSICS_CONSTANTS.M_sun);
    setPlanetMass(3.3e23);
    setEccentricity(0.206);
    setSpeedMultiplier(50);
    setShowRelativity(true);
    setResetKey((value) => value + 1);
  };

  const renderControls = () => (
    <div className="space-y-4">
      <NumberSlider
        label="Star Mass"
        value={starMass / PHYSICS_CONSTANTS.M_sun}
        min={0.5}
        max={5}
        step={0.1}
        onChange={(value) => setStarMass(value * PHYSICS_CONSTANTS.M_sun)}
        formatValue={(value) => `${value.toFixed(1)} M☉`}
      />

      <NumberSlider
        label="Planet Mass"
        value={planetMass / 5.972e24}
        min={0.01}
        max={10}
        step={0.01}
        onChange={(value) => setPlanetMass(value * 5.972e24)}
        formatValue={(value) => `${value.toFixed(2)} M⊕`}
      />

      <NumberSlider
        label="Eccentricity"
        value={eccentricity}
        min={0}
        max={0.9}
        step={0.01}
        onChange={setEccentricity}
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
          variant={showRelativity ? "default" : "outline"}
          size="sm"
          onClick={() => setShowRelativity(!showRelativity)}
        >
          {showRelativity ? "ON" : "OFF"}
        </Button>
      </div>

      <Button variant="outline" className="w-full" onClick={handleReset}>
        Reset Simulation
      </Button>

      <div className="text-xs text-muted-foreground pt-2 border-t border-border/40">
        <p>💡 Click on canvas to add orbiting bodies</p>
        <p className="mt-1">Bodies: {bodyCount}</p>
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
        resetKey={resetKey}
        onBodyClick={handleBodyClick}
      />
    </FloatingSimulationLayout>
  );
}

export { MercuryPrecessionSimulation };
