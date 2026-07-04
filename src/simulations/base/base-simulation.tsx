import { ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";

interface BaseSimulationProps {
  title: string;
  description: string;
  children: ReactNode;
  renderControls: () => ReactNode;
  renderInfo: () => ReactNode;
  cameraPosition?: [number, number, number];
  cameraLookAt?: [number, number, number];
  showGrid?: boolean;
}

export function BaseSimulation({
  title,
  description,
  children,
  renderControls,
  renderInfo,
  cameraPosition = [0, 0, 30],
  cameraLookAt = [0, 0, 0],
  showGrid = true,
}: BaseSimulationProps) {
  return (
    <div className="w-full h-screen flex flex-col lg:flex-row gap-4 p-4">
      {/* Main Canvas */}
      <div className="flex-1 relative">
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={cameraPosition} />
          <OrbitControls target={cameraLookAt} enableDamping dampingFactor={0.05} />

          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={1} castShadow />

          {/* Grid Helper */}
          {showGrid && (
            <gridHelper args={[50, 50, "#444444", "#222222"]} rotation={[Math.PI / 2, 0, 0]} />
          )}

          {/* Simulation Content */}
          {children}
        </Canvas>
      </div>

      {/* Side Panel */}
      <div className="w-full lg:w-96 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="controls" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="controls">Controls</TabsTrigger>
            <TabsTrigger value="info">Information</TabsTrigger>
          </TabsList>

          <TabsContent value="controls" className="mt-4">
            <Card>
              <CardContent className="pt-6">{renderControls()}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="info" className="mt-4">
            <Card>
              <CardContent className="pt-6">{renderInfo()}</CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
