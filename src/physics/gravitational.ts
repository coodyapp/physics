import { Vector3 } from "three";
import { PHYSICS_CONSTANTS } from "@/utils/constants";

export interface WaveSource {
  position: Vector3;
  mass1: number;
  mass2: number;
  orbitalRadius: number;
  orbitalFrequency: number;
}

export function calculateGravitationalWaveAmplitude(
  source: WaveSource,
  observerPosition: Vector3,
  time: number,
): number {
  const distance = source.position.distanceTo(observerPosition);
  const { mass1, mass2, orbitalFrequency } = source;

  // Chirp mass: M_c = (m1 * m2)^(3/5) / (m1 + m2)^(1/5)
  const M = Math.pow((mass1 * mass2) ** 3 / (mass1 + mass2), 1 / 5);

  // Leading-order quadrupole strain amplitude for a circular binary:
  //   h = (4 / r) * (G * M_c / c^2)^(5/3) * (pi * f)^(2/3) / c^2
  //     = 4 * (G * M_c)^(5/3) * (pi * f)^(2/3) / (c^4 * r)
  const amplitude =
    (4 * Math.pow(PHYSICS_CONSTANTS.G * M, 5 / 3) * Math.pow(Math.PI * orbitalFrequency, 2 / 3)) /
    (PHYSICS_CONSTANTS.c ** 4 * distance);

  return amplitude * Math.cos(2 * Math.PI * orbitalFrequency * time);
}

export function calculateStrainTensor(
  amplitude: number,
  polarization: "plus" | "cross",
): number[][] {
  const h = amplitude;

  if (polarization === "plus") {
    return [
      [h, 0, 0],
      [0, -h, 0],
      [0, 0, 0],
    ];
  } else {
    return [
      [0, h, 0],
      [h, 0, 0],
      [0, 0, 0],
    ];
  }
}
