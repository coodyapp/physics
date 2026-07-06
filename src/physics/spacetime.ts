import { PHYSICS_CONSTANTS } from "@/utils/constants";
import { Vector3, Matrix4 } from "three";

/**
 * SpacetimeService - Handles spacetime calculations based on General Relativity
 * Following Single Responsibility Principle
 */
export class SpacetimeService {
  /**
   * Calculate the metric tensor for Schwarzschild spacetime
   * @throws Error if position is within the Schwarzschild radius
   */
  static calculateMetricTensor(position: Vector3, mass: number): Matrix4 {
    const r = position.length();
    const rs = this.schwarzschildRadius(mass);

    if (r <= rs) {
      throw new Error("Position is within the Schwarzschild radius");
    }

    const factor = 1 - rs / r;
    const cosTheta = Math.max(-1, Math.min(1, position.z / r));
    const sinThetaSquared = Math.max(0, 1 - cosTheta * cosTheta);

    // Three.js Matrix4 uses column-major order
    const matrix = new Matrix4();
    matrix.set(
      -factor,
      0,
      0,
      0,
      0,
      1 / factor,
      0,
      0,
      0,
      0,
      r ** 2,
      0,
      0,
      0,
      0,
      r ** 2 * sinThetaSquared,
    );
    return matrix;
  }

  /**
   * Calculate Christoffel symbols for Schwarzschild metric
   * Simplified for visualization purposes
   */
  static calculateChristoffelSymbols(position: Vector3, mass: number): number[][][] {
    const symbols: number[][][] = Array(4)
      .fill(null)
      .map(() =>
        Array(4)
          .fill(null)
          .map(() => Array(4).fill(0)),
      );

    const r = position.length();
    const rs = this.schwarzschildRadius(mass);

    // Non-zero components (simplified)
    symbols[0][0][1] = rs / (2 * r * (r - rs));
    symbols[0][1][0] = symbols[0][0][1];
    symbols[1][0][0] = (rs * (r - rs)) / (2 * r ** 3);

    return symbols;
  }

  /**
   * Calculate a curvature proxy for visualization.
   */
  static calculateSpacetimeCurvature(position: Vector3, mass: number): number {
    const r = position.length();
    const rs = this.schwarzschildRadius(mass);

    // Schwarzschild vacuum Ricci scalar is zero; this proxy preserves useful visual falloff.
    return rs / r ** 3;
  }

  /**
   * Calculate Schwarzschild radius (event horizon)
   */
  static schwarzschildRadius(mass: number): number {
    return (2 * PHYSICS_CONSTANTS.G * mass) / PHYSICS_CONSTANTS.c ** 2;
  }

  /**
   * Calculate time dilation factor based on Schwarzschild metric
   */
  static calculateTimeDilation(r: number, mass: number): number {
    const rs = this.schwarzschildRadius(mass);
    if (r <= rs) return 0;

    return Math.sqrt(1 - rs / r);
  }

  /**
   * Calculate a curvature proxy for visualization purposes.
   */
  static calculateRicciScalar(x: number, y: number, mass: number): number {
    const r = Math.sqrt(x * x + y * y);
    const minRadius = 0.5;
    const effectiveRadius = Math.max(r, minRadius);

    // Visualization proxy: curvature ∝ M/r³.
    return mass / Math.pow(effectiveRadius, 3);
  }

  /**
   * Calculate orbital velocity at given radius
   * Based on Newtonian approximation (valid for weak fields)
   */
  static calculateOrbitalVelocity(r: number, mass: number): number {
    return Math.sqrt((PHYSICS_CONSTANTS.G * mass) / r);
  }
}

/**
 * GravitationalWaveService - Handles gravitational wave calculations
 * Separated for Single Responsibility Principle
 */
export class GravitationalWaveService {
  /**
   * Calculate gravitational wave distortion
   * Based on linearized Einstein equations for weak gravitational waves
   */
  static calculateWaveDistortion(
    x: number,
    y: number,
    time: number,
    amplitude: number,
    frequency: number,
  ): number {
    if (amplitude === 0) return 0;

    const angularFrequency = 2 * Math.PI * frequency;
    // Wave vector (propagating in x direction) scaled for the visualization grid.
    const k = angularFrequency * 0.5;

    // Plus polarization: h_+ = A cos(ωt - kx)
    const phase = angularFrequency * time - k * x;
    const hPlus = amplitude * Math.cos(phase);

    // Cross polarization: h_x = A sin(ωt - kx)
    const hCross = amplitude * Math.sin(phase);

    // Combine polarizations with spatial dependence
    // This creates the characteristic quadrupole pattern
    const distortion =
      hPlus * Math.cos(2 * Math.atan2(y, x)) + hCross * Math.sin(2 * Math.atan2(y, x));

    // Apply spatial envelope for visualization
    const r = Math.sqrt(x * x + y * y);
    const envelope = Math.exp((-r * r) / 100);

    return distortion * envelope;
  }
}

// Export legacy functions for backward compatibility
export const calculateMetricTensor = SpacetimeService.calculateMetricTensor.bind(SpacetimeService);
export const calculateChristoffelSymbols =
  SpacetimeService.calculateChristoffelSymbols.bind(SpacetimeService);
export const calculateSpacetimeCurvature =
  SpacetimeService.calculateSpacetimeCurvature.bind(SpacetimeService);
export const calculateGravitationalWave =
  GravitationalWaveService.calculateWaveDistortion.bind(GravitationalWaveService);
export const calculateRicciScalar = SpacetimeService.calculateRicciScalar.bind(SpacetimeService);
export const calculateTimeDilation = SpacetimeService.calculateTimeDilation.bind(SpacetimeService);
export const calculateOrbitalVelocity =
  SpacetimeService.calculateOrbitalVelocity.bind(SpacetimeService);
