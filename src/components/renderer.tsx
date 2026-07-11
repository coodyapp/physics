import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
import { ReactNode, useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { useSimulationMotion } from "@/hooks/use-simulation-motion";

export type CameraViewMode = "3d" | "2d";
export type CameraViewDirection = "isometric" | "xy" | "xz" | "yz";

interface RendererProps {
  children: ReactNode;
  showGrid?: boolean;
  showAxis?: boolean;
  cameraPosition?: [number, number, number];
  cameraFov?: number;
  cameraTarget?: [number, number, number];
  cameraMode?: CameraViewMode;
  cameraDirection?: CameraViewDirection;
  cameraZoom?: number;
  name?: string;
  description?: string;
  resetKey?: number;
}

function cameraDistance(
  cameraPosition: [number, number, number],
  cameraTarget: [number, number, number],
) {
  return Math.max(
    1,
    Math.hypot(
      cameraPosition[0] - cameraTarget[0],
      cameraPosition[1] - cameraTarget[1],
      cameraPosition[2] - cameraTarget[2],
    ),
  );
}

function getCameraPosition(
  direction: CameraViewDirection,
  distance: number,
  target: [number, number, number],
): [number, number, number] {
  if (direction === "xy") return [target[0], target[1], target[2] + distance];
  if (direction === "xz") return [target[0], target[1] + distance, target[2]];
  if (direction === "yz") return [target[0] + distance, target[1], target[2]];

  const component = distance / Math.sqrt(3);
  return [target[0] + component, target[1] + component, target[2] + component];
}

function getCameraUp(direction: CameraViewDirection): [number, number, number] {
  if (direction === "xz") return [0, 0, -1];
  return [0, 1, 0];
}

function getGridRotation(direction: CameraViewDirection): [number, number, number] {
  if (direction === "xy") return [Math.PI / 2, 0, 0];
  if (direction === "yz") return [0, 0, Math.PI / 2];
  return [0, 0, 0];
}

function CameraPose({
  position,
  target,
  up,
  fov,
  zoom,
}: {
  position: [number, number, number];
  target: [number, number, number];
  up: [number, number, number];
  fov: number;
  zoom: number;
}) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(...position);
    camera.up.set(...up);
    camera.lookAt(...target);

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }

    if (camera instanceof THREE.OrthographicCamera) {
      camera.zoom = zoom;
      camera.updateProjectionMatrix();
    }
  }, [
    camera,
    fov,
    position[0],
    position[1],
    position[2],
    target[0],
    target[1],
    target[2],
    up[0],
    up[1],
    up[2],
    zoom,
  ]);

  return null;
}

export default function Renderer({
  children,
  showGrid = true,
  showAxis = true,
  cameraPosition = [10, 10, 10],
  cameraFov = 50,
  cameraTarget = [0, 0, 0],
  cameraMode = "3d",
  cameraDirection = "isometric",
  cameraZoom = 28,
  name = "Interactive physics simulation",
  description = "Three-dimensional visualization with adjustable camera and simulation controls.",
  resetKey = 0,
}: RendererProps) {
  const { isPlaying } = useSimulationMotion();
  const [isVisible, setIsVisible] = useState(!document.hidden);
  const distance = cameraDistance(cameraPosition, cameraTarget);
  const resolvedCameraPosition = useMemo(
    () => getCameraPosition(cameraDirection, distance, cameraTarget),
    [cameraDirection, distance, cameraTarget[0], cameraTarget[1], cameraTarget[2]],
  );
  const cameraUp = useMemo(() => getCameraUp(cameraDirection), [cameraDirection]);
  const gridRotation = useMemo(() => getGridRotation(cameraDirection), [cameraDirection]);

  useEffect(() => {
    const onVisibilityChange = () => setIsVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  return (
    <div
      className="absolute inset-0 h-full w-full"
      role="img"
      aria-label={name}
      aria-describedby="simulation-canvas-description simulation-canvas-instructions"
    >
      <p id="simulation-canvas-description" className="sr-only">
        {description}
      </p>
      <p id="simulation-canvas-instructions" className="sr-only">
        Drag to orbit or pan, scroll to zoom, and press R to reset camera. Use toolbar controls to
        change camera view, grid, axes, and animation.
      </p>
      <Canvas
        aria-hidden="true"
        dpr={[1, 1.5]}
        frameloop={isPlaying && isVisible ? "always" : "demand"}
      >
        <PerspectiveCamera
          makeDefault={cameraMode === "3d"}
          position={resolvedCameraPosition}
          fov={cameraFov}
          near={0.1}
          far={1000}
        />
        <OrthographicCamera
          makeDefault={cameraMode === "2d"}
          position={resolvedCameraPosition}
          zoom={cameraZoom}
          near={0.1}
          far={1000}
        />
        <CameraPose
          key={resetKey}
          position={resolvedCameraPosition}
          target={cameraTarget}
          up={cameraUp}
          fov={cameraFov}
          zoom={cameraZoom}
        />

        <ambientLight intensity={0.5} />

        {showGrid && (
          <group rotation={gridRotation}>
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
          </group>
        )}

        {showAxis && (
          <>
            <axesHelper args={[5]} />
          </>
        )}

        {children}

        <OrbitControls
          key={`controls-${resetKey}`}
          makeDefault
          target={cameraTarget}
          enableRotate={cameraMode === "3d"}
          enablePan
          enableZoom
        />
      </Canvas>
    </div>
  );
}
