import { Vector3 } from "three";
import { PHYSICS_CONSTANTS } from "@/utils/constants";

export class PhysicsService {
  static readonly G = PHYSICS_CONSTANTS.G; // Gravitational constant (m^3 kg^-1 s^-2)
  static readonly C = PHYSICS_CONSTANTS.c; // Speed of light (m/s)

  static calculateGravitationalForce(mass1: number, mass2: number, distance: number): number {
    return (this.G * mass1 * mass2) / (distance * distance);
  }

  static calculateOrbitalVelocity(centralMass: number, radius: number): number {
    return Math.sqrt((this.G * centralMass) / radius);
  }

  static calculateEscapeVelocity(mass: number, radius: number): number {
    return Math.sqrt((2 * this.G * mass) / radius);
  }

  static schwarzschildRadius(mass: number): number {
    return (2 * this.G * mass) / (this.C * this.C);
  }

  static calculateSpacetimeCurvature(
    mass: number,
    position: Vector3,
    centerPosition: Vector3,
  ): number {
    const r = position.distanceTo(centerPosition);
    if (r === 0) return 0;

    const rs = this.schwarzschildRadius(mass);
    return -rs / (2 * r);
  }
}
