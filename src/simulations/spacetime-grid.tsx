import { useMemo } from "react";
import * as THREE from "three";
import { calculatePotentialWellProxy } from "@/physics/gravity";
import { PHYSICS_CONSTANTS, SIMULATION_COLORS } from "@/utils/constants";

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

    // Dimensionless solar-mass scale drives a stylized potential surface.
    const scaledMass = mass / PHYSICS_CONSTANTS.M_sun;

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];

      if (showCurvature) {
        const z = calculatePotentialWellProxy(x, y, scaledMass);
        positions[i + 2] = z; // Curvature is already scaled in the function
      }
    }

    geo.computeVertexNormals();
    return geo;
  }, [mass, resolution, showCurvature]);

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
      <meshStandardMaterial
        color={SIMULATION_COLORS.positive}
        wireframe
        opacity={0.6}
        transparent
      />
    </mesh>
  );
}
