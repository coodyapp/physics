export function calculateBoltzmannAcceptance(
  oldEnergy: number,
  newEnergy: number,
  temperature: number,
) {
  if (temperature <= 0) {
    throw new Error("Temperature must be positive");
  }

  const densityRatio = Math.sqrt((newEnergy + 1e-6) / (oldEnergy + 1e-6));
  const boltzmannRatio = Math.exp(-(newEnergy - oldEnergy) / temperature);

  return Math.min(1, densityRatio * boltzmannRatio);
}
