export interface BarycentricRadii {
  body1: number;
  body2: number;
}

export interface BarycentricPositions {
  body1: { x: number; z: number };
  body2: { x: number; z: number };
}

export function calculateAngularPhase(timeSeconds: number, frequencyHz: number) {
  return 2 * Math.PI * frequencyHz * timeSeconds;
}

export function calculateBarycentricRadii(
  mass1: number,
  mass2: number,
  separation: number,
): BarycentricRadii {
  const totalMass = mass1 + mass2;

  if (totalMass <= 0) {
    throw new Error("Total mass must be positive");
  }

  return {
    body1: (separation * mass2) / totalMass,
    body2: (separation * mass1) / totalMass,
  };
}

export function calculateBarycentricPositions(
  mass1: number,
  mass2: number,
  separation: number,
  phase: number,
): BarycentricPositions {
  const radii = calculateBarycentricRadii(mass1, mass2, separation);
  const cosPhase = Math.cos(phase);
  const sinPhase = Math.sin(phase);

  return {
    body1: {
      x: radii.body1 * cosPhase,
      z: radii.body1 * sinPhase,
    },
    body2: {
      x: -radii.body2 * cosPhase,
      z: -radii.body2 * sinPhase,
    },
  };
}
