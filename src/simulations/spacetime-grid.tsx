import { useMemo } from "react";
import * as THREE from "three";
import { calculateSpacetimeCurvatureSimple } from "@/physics/gravity";

interface SpacetimeGridProps {
  mass: number;
  resolution: number;
  showCurvature: boolean;
}

export default function SpacetimeGrid({ mass, resolution, showCurvature }: SpacetimeGridProps) {
  const geometry = useMemo(() => {
    const size = 20;
    const geo = new THREE.PlaneGeometry(size, size, resolution, resolution);
    const positions = geo.attributes.position.array as Float32Array;

    // Scale mass for visualization (convert from kg to solar masses approximation)
    const scaledMass = mass / 1e30;

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];

      if (showCurvature) {
        const z = calculateSpacetimeCurvatureSimple(x, y, scaledMass);
        positions[i + 2] = z; // Curvature is already scaled in the function
      }
    }

    geo.computeVertexNormals();
    return geo;
  }, [mass, resolution, showCurvature]);

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
      <meshStandardMaterial color="#3b82f6" wireframe opacity={0.6} transparent />
    </mesh>
  );
}
