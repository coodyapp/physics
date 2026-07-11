import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { schwarzschildRadius } from "@/physics/gravity";
import { PHYSICS_CONSTANTS, SIMULATION_COLORS } from "@/utils/constants";

interface CentralMassProps {
  mass: number;
}

export default function CentralMass({ mass }: CentralMassProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const horizonMassScale = schwarzschildRadius(mass) / schwarzschildRadius(PHYSICS_CONSTANTS.M_sun);
  // Symbolic display radius: cube-root scaling avoids implying event-horizon dimensions.
  const radius = 0.35 + 0.1 * Math.cbrt(horizonMassScale);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial
        color={SIMULATION_COLORS.source}
        emissive={SIMULATION_COLORS.sourceEmissive}
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}
