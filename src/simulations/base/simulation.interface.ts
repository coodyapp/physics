import { ReactNode } from "react";

export type IntegratorType = "euler" | "verlet" | "rk4";

export interface SimulationConfig {
  timeStep: number;
  maxIterations: number;
  gravityConstant: number;
  speedOfLight: number;
  integrator: IntegratorType;
}

export interface SimulationProps {
  title: string;
  description: string;
  config?: Partial<SimulationConfig>;
  integratorType?: IntegratorType;
}

export interface SimulationSceneProps {
  onBodiesChange?: (count: number) => void;
}

export interface SimulationControls {
  renderControls: () => ReactNode;
  renderInfo: () => ReactNode;
}
