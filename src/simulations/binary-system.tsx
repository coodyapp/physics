import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { calculateBinarySystem } from "@/physics/gravity";

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
    const resolution = 32;
    const geo = new THREE.PlaneGeometry(size, size, resolution, resolution);
    return geo;
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current?.geometry) return;

    timeRef.current += delta;

    const positions = meshRef.current.geometry.attributes.position;
    const separation = 5;
    const phase = timeRef.current * frequency;

    // Update grid positions based on binary system
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);

      const z = calculateBinarySystem(x, y, mass1 / 1e30, mass2 / 1e30, separation, phase);
      positions.setZ(i, z * 2); // Scale for visibility
    }

    positions.needsUpdate = true;
    meshRef.current.geometry.computeVertexNormals();

    // Animate the binary system bodies
    if (body1Ref.current && body2Ref.current) {
      body1Ref.current.position.x = (separation / 2) * Math.cos(phase);
      body1Ref.current.position.z = (separation / 2) * Math.sin(phase);

      body2Ref.current.position.x = -(separation / 2) * Math.cos(phase);
      body2Ref.current.position.z = -(separation / 2) * Math.sin(phase);
    }
  });

  const radius1 = Math.max(0.3, mass1 / 1e31);
  const radius2 = Math.max(0.3, mass2 / 1e31);

  return (
    <group>
      {/* Grid */}
      <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#3b82f6" wireframe opacity={0.6} transparent />
      </mesh>

      {/* Body 1 */}
      <mesh ref={body1Ref}>
        <sphereGeometry args={[radius1, 24, 24]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.5} />
      </mesh>

      {/* Body 2 */}
      <mesh ref={body2Ref}>
        <sphereGeometry args={[radius2, 24, 24]} />
        <meshStandardMaterial color="#8b5cf6" emissive="#6d28d9" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}
