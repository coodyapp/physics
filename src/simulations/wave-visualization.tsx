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
    const resolution = 40;
    const geo = new THREE.PlaneGeometry(size, size, resolution, resolution);
    geo.setAttribute(
      "color",
      new THREE.BufferAttribute(new Float32Array((resolution + 1) ** 2 * 3), 3),
    );
    return geo;
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current?.geometry) return;

    timeRef.current += delta;

    const positions = meshRef.current.geometry.attributes.position;
    const colors = meshRef.current.geometry.attributes.color;
    const colorArray = colors.array;
    const amplitudeScale = Math.max(Math.abs(amplitude), Number.EPSILON);

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);

      const z = calculateGravitationalWave(x, y, timeRef.current, amplitude, frequency);
      positions.setZ(i, z);

      // Color based on displacement
      const colorIntensity = THREE.MathUtils.clamp(
        (z + amplitudeScale) / (amplitudeScale * 2),
        0,
        1,
      );
      colorArray[i * 3] = 0.2 + colorIntensity * 0.5; // R
      colorArray[i * 3 + 1] = 0.4 + colorIntensity * 0.3; // G
      colorArray[i * 3 + 2] = 0.8; // B
    }

    positions.needsUpdate = true;
    colors.needsUpdate = true;
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={[5, 0, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={0.45}
    >
      <meshBasicMaterial vertexColors wireframe opacity={0.8} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}
