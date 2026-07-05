import { describe, it, expect } from "vite-plus/test";
import { Vector3 } from "three";
import { PHYSICS_CONSTANTS } from "@/utils/constants";
import {
  advanceOrbitState,
  calculatePrecessionPerOrbit,
  calculateRealPrecessionPerOrbit,
  calculateOrbitalVelocity,
} from "@/simulations/mercury-precession";

const { M_sun } = PHYSICS_CONSTANTS;
const RAD_TO_ARCSEC = (180 * 3600) / Math.PI;

describe("Mercury precession — real SI reference", () => {
  // Mercury: a = 5.791e10 m, e = 0.206, ~415 orbits per century.
  const mercuryA = 5.791e10;
  const mercuryE = 0.206;
  const orbitsPerCentury = 415;

  it("recovers Mercury's ~43 arcsec/century anomalous precession", () => {
    const radPerOrbit = calculateRealPrecessionPerOrbit(M_sun, mercuryA, mercuryE);
    const arcsecPerCentury = radPerOrbit * RAD_TO_ARCSEC * orbitsPerCentury;
    // The observed value is 42.98 arcsec/century.
    expect(arcsecPerCentury).toBeCloseTo(42.98, 0);
  });

  it("gives ~0.103 arcsec per orbit", () => {
    const radPerOrbit = calculateRealPrecessionPerOrbit(M_sun, mercuryA, mercuryE);
    expect(radPerOrbit * RAD_TO_ARCSEC).toBeCloseTo(0.1035, 2);
  });

  it("scales linearly with central mass (Δω ∝ M)", () => {
    const r1 = calculateRealPrecessionPerOrbit(M_sun, mercuryA, mercuryE);
    const r2 = calculateRealPrecessionPerOrbit(2 * M_sun, mercuryA, mercuryE);
    expect(r2 / r1).toBeCloseTo(2, 6);
  });

  it("increases with eccentricity (1/(1-e^2) factor)", () => {
    const low = calculateRealPrecessionPerOrbit(M_sun, mercuryA, 0.1);
    const high = calculateRealPrecessionPerOrbit(M_sun, mercuryA, 0.5);
    expect(high).toBeGreaterThan(low);
  });
});

describe("Mercury precession — simulation units", () => {
  const a = 8;
  const e = 0.206;

  it("produces a visible, positive precession for a 1-solar-mass star", () => {
    const rad = calculatePrecessionPerOrbit(M_sun, a, e);
    expect(rad).toBeGreaterThan(0);
    // Tuned to be a few degrees per orbit so it is visible.
    const deg = (rad * 180) / Math.PI;
    expect(deg).toBeGreaterThan(0.5);
    expect(deg).toBeLessThan(10);
  });

  it("scales linearly with mass", () => {
    const r1 = calculatePrecessionPerOrbit(M_sun, a, e);
    const r3 = calculatePrecessionPerOrbit(3 * M_sun, a, e);
    expect(r3 / r1).toBeCloseTo(3, 6);
  });

  it("orbital velocity satisfies the vis-viva equation", () => {
    // Perihelion r = a(1-e); v^2 = GM(2/r - 1/a) with M = 1 solar mass in sim units.
    const r = a * (1 - e);
    const v = calculateOrbitalVelocity(M_sun, r, a);
    const expected = Math.sqrt(1 * 1 * (2 / r - 1 / a));
    expect(v).toBeCloseTo(expected, 6);
    // Weak-field: v << c_sim.
    expect(v).toBeLessThan(8);
  });

  it("orbital velocity at r = a (circular) is sqrt(GM/a)", () => {
    const v = calculateOrbitalVelocity(M_sun, a, a);
    expect(v).toBeCloseTo(Math.sqrt(1 / a), 6);
  });

  it("advances velocity with the full velocity-Verlet kick", () => {
    const radius = 8;
    const dt = 0.1;
    const next = advanceOrbitState(
      {
        position: new Vector3(radius, 0, 0),
        velocity: new Vector3(0, calculateOrbitalVelocity(M_sun, radius, radius), 0),
      },
      M_sun,
      false,
      dt,
    );

    expect(next.velocity.x).toBeCloseTo(-dt / radius ** 2, 4);
  });
});
