import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { schwarzschildRadius } from "@/physics/gravity";
import { PHYSICS_CONSTANTS } from "@/utils/constants";

interface CentralMassProps {
  mass: number;
}

export default function CentralMass({ mass }: CentralMassProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const solarRadius = schwarzschildRadius(PHYSICS_CONSTANTS.M_sun);
  const radius = Math.max(0.35, 0.32 + (schwarzschildRadius(mass) / solarRadius) * 0.08);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.5} />
    </mesh>
  );
}
