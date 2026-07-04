import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import { ReactNode } from "react";

interface RendererProps {
  children: ReactNode;
  showGrid?: boolean;
  showAxis?: boolean;
}

export default function Renderer({ children, showGrid = true, showAxis = true }: RendererProps) {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas camera={{ position: [10, 10, 10], fov: 50 }}>
        <ambientLight intensity={0.5} />

        {showGrid && (
          <Grid
            args={[20, 20]}
            cellSize={1}
            cellThickness={0.5}
            cellColor="#6b7280"
            sectionSize={5}
            sectionThickness={1}
            sectionColor="#9ca3af"
            fadeDistance={30}
            fadeStrength={1}
            infiniteGrid
          />
        )}

        {showAxis && (
          <>
            <axesHelper args={[5]} />
          </>
        )}

        {children}

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}
