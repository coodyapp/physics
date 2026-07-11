import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { calculateAngularPhase, calculateBarycentricPositions } from "@/physics/binary-orbit";
import { calculateBinaryPotentialProxy } from "@/physics/gravity";
import { PHYSICS_CONSTANTS, SIMULATION_COLORS } from "@/utils/constants";

interface BinarySystemProps {
  mass1: number;
  mass2: number;
  frequency: number;
}

export default function BinarySystem({ mass1, mass2, frequency }: BinarySystemProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const body1Ref = useRef<THREE.Mesh>(null);
  const body2Ref = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  const geometry = useMemo(() => {
    const size = 20;
    const resolution = 28;
    const geo = new THREE.PlaneGeometry(size, size, resolution, resolution);
    return geo;
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current?.geometry) return;

    timeRef.current += delta;

    const positions = meshRef.current.geometry.attributes.position;
    const separation = 5;
    const phase = calculateAngularPhase(timeRef.current, frequency);
    const mass1Solar = mass1 / PHYSICS_CONSTANTS.M_sun;
    const mass2Solar = mass2 / PHYSICS_CONSTANTS.M_sun;

    // Update grid positions based on binary system
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      // Mesh is rotated -90deg around X, so local +Y maps to world -Z.
      const worldZ = -y;

      const z = calculateBinaryPotentialProxy(x, worldZ, mass1Solar, mass2Solar, separation, phase);
      positions.setZ(i, z * 2); // Scale for visibility
    }

    positions.needsUpdate = true;
    // Animate the binary system bodies
    if (body1Ref.current && body2Ref.current) {
      const barycentricPositions = calculateBarycentricPositions(
        mass1Solar,
        mass2Solar,
        separation,
        phase,
      );

      body1Ref.current.position.x = barycentricPositions.body1.x;
      body1Ref.current.position.z = barycentricPositions.body1.z;
      body2Ref.current.position.x = barycentricPositions.body2.x;
      body2Ref.current.position.z = barycentricPositions.body2.z;
    }
  });

  // Symbolic radii use cube-root mass scaling; they are not physical stellar radii.
  const radius1 = 0.3 + 0.12 * Math.cbrt(mass1 / PHYSICS_CONSTANTS.M_sun);
  const radius2 = 0.3 + 0.12 * Math.cbrt(mass2 / PHYSICS_CONSTANTS.M_sun);

  return (
    <group position={[-5, 0, 0]} scale={0.45}>
      {/* Gravitational-potential analogy */}
      <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
        <meshBasicMaterial
          color={SIMULATION_COLORS.positive}
          wireframe
          opacity={0.55}
          transparent
        />
      </mesh>

      {/* Body 1 */}
      <mesh ref={body1Ref}>
        <sphereGeometry args={[radius1, 24, 24]} />
        <meshStandardMaterial
          color={SIMULATION_COLORS.source}
          emissive={SIMULATION_COLORS.sourceEmissive}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Body 2 */}
      <mesh ref={body2Ref}>
        <sphereGeometry args={[radius2, 24, 24]} />
        <meshStandardMaterial
          color={SIMULATION_COLORS.accent}
          emissive="#6d28d9"
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
}
