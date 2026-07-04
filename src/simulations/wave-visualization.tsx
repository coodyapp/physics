import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { calculateGravitationalWave } from "@/physics/spacetime";

interface WaveVisualizationProps {
  frequency: number;
  amplitude: number;
}

export default function WaveVisualization({ frequency, amplitude }: WaveVisualizationProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  const geometry = useMemo(() => {
    const size = 20;
    const resolution = 48;
    const geo = new THREE.PlaneGeometry(size, size, resolution, resolution);
    return geo;
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current?.geometry) return;

    timeRef.current += delta;

    const positions = meshRef.current.geometry.attributes.position;
    const colors = new Float32Array(positions.count * 3);

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);

      const z = calculateGravitationalWave(x, y, timeRef.current, amplitude, frequency);
      positions.setZ(i, z);

      // Color based on displacement
      const colorIntensity = (z + amplitude) / (amplitude * 2);
      colors[i * 3] = 0.2 + colorIntensity * 0.5; // R
      colors[i * 3 + 1] = 0.4 + colorIntensity * 0.3; // G
      colors[i * 3 + 2] = 0.8; // B
    }

    positions.needsUpdate = true;

    if (!meshRef.current.geometry.attributes.color) {
      meshRef.current.geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    } else {
      meshRef.current.geometry.attributes.color.array.set(colors);
      meshRef.current.geometry.attributes.color.needsUpdate = true;
    }

    meshRef.current.geometry.computeVertexNormals();
  });

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
      <meshStandardMaterial
        vertexColors
        wireframe
        opacity={0.8}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
