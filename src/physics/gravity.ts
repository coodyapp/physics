import { Vector3 } from "three";
import { calculateBarycentricPositions } from "@/physics/binary-orbit";
import { PHYSICS_CONSTANTS } from "@/utils/constants";

export interface CelestialBody {
  position: Vector3;
  velocity: Vector3;
  mass: number;
  radius: number;
}

export function calculateGravitationalForce(body1: CelestialBody, body2: CelestialBody): Vector3 {
  const direction = body2.position.clone().sub(body1.position);
  const distance = direction.length();

  if (distance < 0.001) return new Vector3();

  const forceMagnitude = (PHYSICS_CONSTANTS.G * body1.mass * body2.mass) / distance ** 2;
  return direction.normalize().multiplyScalar(forceMagnitude);
}

export function calculateGravitationalAcceleration(body: CelestialBody, force: Vector3): Vector3 {
  return force.clone().divideScalar(body.mass);
}

export function schwarzschildRadius(mass: number): number {
  return (2 * PHYSICS_CONSTANTS.G * mass) / PHYSICS_CONSTANTS.c ** 2;
}

export function escapeVelocity(mass: number, radius: number): number {
  return Math.sqrt((2 * PHYSICS_CONSTANTS.G * mass) / radius);
}

/**
 * Calculate combined gravitational field from two masses
 * Used for binary black hole systems
 */
export function calculateBinarySystem(
  x: number,
  y: number,
  mass1: number,
  mass2: number,
  separation: number,
  phase: number,
): number {
  const positions = calculateBarycentricPositions(mass1, mass2, separation, phase);

  // Distance to each mass
  const r1 = Math.sqrt((x - positions.body1.x) ** 2 + (y - positions.body1.z) ** 2);
  const r2 = Math.sqrt((x - positions.body2.x) ** 2 + (y - positions.body2.z) ** 2);

  // Combined gravitational potential
  const minRadius = 0.5;
  const curvature1 = -mass1 / Math.max(r1, minRadius);
  const curvature2 = -mass2 / Math.max(r2, minRadius);

  return curvature1 + curvature2;
}

/**
 * Simple spacetime curvature calculation for visualization
 * Based on simplified Schwarzschild metric
 */
export function calculateSpacetimeCurvatureSimple(x: number, y: number, mass: number): number {
  // Distance from center
  const r = Math.sqrt(x * x + y * y);

  // Avoid singularity at center
  const minRadius = 0.5;
  const effectiveRadius = Math.max(r, minRadius);

  // Simplified gravitational potential
  const curvature = -mass / effectiveRadius;

  // Apply smooth falloff
  const falloff = Math.exp(-effectiveRadius / 5);

  return curvature * falloff;
}
