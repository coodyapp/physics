import { useRef } from "react";
import { Mesh } from "three";

interface MeshProps {
  position?: [number, number, number];
  color?: string;
  size?: number;
  opacity?: number;
  wireframe?: boolean;
  type?: "sphere" | "box" | "cone";
}

export default function GenericMesh({
  position = [0, 0, 0],
  color = "#3b82f6",
  size = 1,
  opacity = 1,
  wireframe = false,
  type = "sphere",
}: MeshProps) {
  const meshRef = useRef<Mesh>(null);

  const renderGeometry = () => {
    switch (type) {
      case "box":
        return <boxGeometry args={[size, size, size]} />;
      case "cone":
        return <coneGeometry args={[size, size * 2, 32]} />;
      case "sphere":
      default:
        return <sphereGeometry args={[size, 32, 32]} />;
    }
  };

  return (
    <mesh ref={meshRef} position={position}>
      {renderGeometry()}
      <meshStandardMaterial
        color={color}
        transparent={opacity < 1}
        opacity={opacity}
        wireframe={wireframe}
      />
    </mesh>
  );
}
