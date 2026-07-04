import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { schwarzschildRadius } from "@/physics/gravity";

interface CentralMassProps {
  mass: number;
}

export default function CentralMass({ mass }: CentralMassProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const rs = schwarzschildRadius(mass) * 1e-6; // Scale for visualization

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[Math.max(rs * 10, 0.5), 32, 32]} />
      <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.5} />
    </mesh>
  );
}
