import { PHYSICS_CONSTANTS } from "@/utils/constants";

/**
 * Chirp mass of a binary system.
 * M_c = (m1 * m2)^(3/5) / (m1 + m2)^(1/5)
 */
function chirpMass(mass1: number, mass2: number): number {
  return Math.pow(mass1 * mass2, 3 / 5) / Math.pow(mass1 + mass2, 1 / 5);
}

export class GravitationalWavesService {
  /**
   * Leading-order gravitational-wave strain amplitude for a circular binary.
   * h = 4 * (G * M_c / c^2)^(5/3) * (pi * f / c)^(2/3) / r
   */
  static calculateWaveAmplitude(
    mass1: number,
    mass2: number,
    distance: number,
    frequency: number,
  ): number {
    const { G, c } = PHYSICS_CONSTANTS;
    const mc = chirpMass(mass1, mass2);
    return (
      (4 * Math.pow((G * mc) / (c * c), 5 / 3) * Math.pow((Math.PI * frequency) / c, 2 / 3)) /
      distance
    );
  }

  /**
   * Orbital frequency from Kepler's third law.
   * f = sqrt(G * (m1 + m2) / a^3) / (2 * pi)
   */
  static calculateFrequency(mass1: number, mass2: number, separation: number): number {
    const { G } = PHYSICS_CONSTANTS;
    const totalMass = mass1 + mass2;
    return Math.sqrt((G * totalMass) / Math.pow(separation, 3)) / (2 * Math.PI);
  }

  /**
   * Strain amplitude using the chirp-mass quadrupole formula (alias of calculateWaveAmplitude).
   */
  static calculateStrainAmplitude(
    mass1: number,
    mass2: number,
    distance: number,
    frequency: number,
  ): number {
    return this.calculateWaveAmplitude(mass1, mass2, distance, frequency);
  }
}
