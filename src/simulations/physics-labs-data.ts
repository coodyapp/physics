export type LabCategory = "mechanics" | "electromagnetism" | "thermodynamics" | "quantum-mechanics";

export interface LabSimulationMetadata {
  category: LabCategory;
  slug: string;
  title: string;
  summary: string;
  principle: string;
  equations: string[];
  method: string;
  expectedOutput: string;
}

export const LAB_CATEGORY_LABELS: Record<LabCategory, string> = {
  mechanics: "Mechanics",
  electromagnetism: "Electromagnetism",
  thermodynamics: "Thermodynamics",
  "quantum-mechanics": "Quantum Mechanics",
};

export const LAB_CATEGORY_ORDER: LabCategory[] = [
  "mechanics",
  "electromagnetism",
  "thermodynamics",
  "quantum-mechanics",
];

export const LAB_SIMULATIONS: LabSimulationMetadata[] = [
  {
    category: "mechanics",
    slug: "projectile-motion",
    title: "Projectile Motion",
    summary: "Launch angle, speed, and gravity shape a ballistic trajectory.",
    principle:
      "Horizontal velocity stays constant while vertical velocity changes under uniform gravitational acceleration.",
    equations: [
      "x(t) = v0 cos(theta) t",
      "y(t) = v0 sin(theta) t - 1/2 g t^2",
      "R = v0^2 sin(2 theta) / g",
    ],
    method: "Analytic constant-acceleration kinematics sampled as a 3D trajectory.",
    expectedOutput:
      "The orange sphere follows the cyan arc; speed and gravity reshape the path in real time.",
  },
  {
    category: "mechanics",
    slug: "spring-mass-oscillator",
    title: "Spring-Mass Oscillator",
    summary: "A driven spring trades energy between motion and stored elastic potential.",
    principle:
      "Hooke's law pulls displacement back toward equilibrium while damping removes mechanical energy.",
    equations: ["m x'' + c x' + kx = F0 sin(omega t)", "U = 1/2 kx^2"],
    method: "Fixed-step semi-implicit integration of the forced, damped oscillator equation.",
    expectedOutput:
      "The block oscillates around the equilibrium marker while stiffness and damping alter motion.",
  },
  {
    category: "mechanics",
    slug: "damped-pendulum",
    title: "Damped Pendulum",
    summary: "Length, gravity, damping, and initial angle control pendulum motion.",
    principle:
      "A pendulum's restoring torque follows sin(theta); its period approaches the harmonic result only at small angles.",
    equations: ["theta'' + (g/L) sin(theta) = -b theta'", "T ~= 2 pi sqrt(L/g)"],
    method:
      "Fixed-substep semi-implicit Euler integration of the nonlinear damped pendulum equation.",
    expectedOutput: "The bob swings through a visible arc and decays faster as damping rises.",
  },
  {
    category: "mechanics",
    slug: "keplers-laws",
    title: "Kepler's Laws",
    summary:
      "An orbiting planet reveals elliptical paths, changing orbital speed, and period scaling.",
    principle:
      "Gravity produces elliptical orbits with equal areas swept in equal times and T squared proportional to a cubed.",
    equations: ["r = a(1-e^2)/(1+e cos(theta))", "dA/dt = constant", "T^2 = 4 pi^2 a^3/(GM)"],
    method: "Analytic Kepler orbit sampled by eccentric anomaly with live swept-area sectors.",
    expectedOutput:
      "The planet accelerates near perihelion while equal-time sectors retain equal area.",
  },
  {
    category: "mechanics",
    slug: "solar-system",
    title: "My Solar System",
    summary: "Two gravitating bodies orbit their shared center of mass.",
    principle:
      "Every body attracts every other body, conserving momentum around the center of mass.",
    equations: [
      "F_ij = G m_i m_j r_ij/|r_ij|^3",
      "R_cm = sum(m_i r_i)/sum(m_i)",
      "v_c = sqrt(GM/r)",
    ],
    method: "Scaled binary orbit with mass-dependent barycentric radii and persistent trails.",
    expectedOutput:
      "Both bodies circle a fixed barycenter; mass ratio changes each orbital radius.",
  },
  {
    category: "mechanics",
    slug: "balancing-torque",
    title: "Balancing Act",
    summary: "Masses placed around a fulcrum rotate a plank according to net torque.",
    principle: "A lever balances when clockwise and counterclockwise moments cancel.",
    equations: ["tau = r F", "sum(tau) = I alpha", "m1 r1 = m2 r2"],
    method: "Damped rotational response driven by two adjustable point-load torques.",
    expectedOutput:
      "The plank settles level for equal moments and tips toward the stronger moment otherwise.",
  },
  {
    category: "mechanics",
    slug: "projectile-data-lab",
    title: "Projectile Data Lab",
    summary: "Repeated launches turn uncertain initial speed into a landing distribution.",
    principle: "Small launch variations propagate nonlinearly into range measurements.",
    equations: ["R = v0^2 sin(2 theta)/g", "mean(R) = sum(R_i)/N", "sigma^2 = sum((R_i-mean)^2)/N"],
    method: "Deterministic seeded samples plotted as trajectories, landing marks, and a histogram.",
    expectedOutput: "Increasing spread widens the landing cluster and range histogram.",
  },
  {
    category: "mechanics",
    slug: "sound-waves",
    title: "Sound Waves",
    summary: "Longitudinal pressure waves propagate from an oscillating loudspeaker.",
    principle:
      "Frequency controls wavelength while amplitude controls pressure variation and particle excursion.",
    equations: ["p(x,t) = p0 + A sin(kx-omega t)", "v = f lambda", "I proportional to A^2"],
    method: "Animated particle rows and pressure wavefronts sampled from a traveling sinusoid.",
    expectedOutput:
      "Higher frequency packs wavefronts closer; larger amplitude increases particle motion.",
  },
  {
    category: "mechanics",
    slug: "buoyancy",
    title: "Buoyancy",
    summary: "A block floats or sinks according to object and fluid density.",
    principle: "Displaced fluid supplies an upward force equal to its weight.",
    equations: [
      "F_b = rho_fluid g V_displaced",
      "F_g = rho_object g V",
      "V_sub/V = rho_object/rho_fluid",
    ],
    method: "Damped vertical motion toward density-dependent floating equilibrium.",
    expectedOutput:
      "Light blocks float partly submerged while dense blocks settle at the tank bottom.",
  },
  {
    category: "electromagnetism",
    slug: "electric-field-lines",
    title: "Electric Field Lines",
    summary: "Field vectors and streamlines from two point charges.",
    principle:
      "Coulomb fields add linearly, so the net electric field is the vector sum of each charge contribution.",
    equations: ["E(r) = sum_i k q_i (r - r_i) / |r - r_i|^3", "F = qE"],
    method:
      "Planar Coulomb-field streamlines traced along E from positive charges (or backward from negatives).",
    expectedOutput:
      "Planar field lines run away from positive charge and toward negative charge as spacing or polarity changes.",
  },
  {
    category: "electromagnetism",
    slug: "charged-particle-motion",
    title: "Charged Particle Motion",
    summary: "A charged particle curves through crossed electric and magnetic fields.",
    principle:
      "The Lorentz force bends velocity perpendicular to B while E accelerates along its direction.",
    equations: ["m dv/dt = q(E + v x B)", "dr/dt = v"],
    method: "Fixed-step Boris integration of the Lorentz-force equation with q/m = 1.",
    expectedOutput:
      "The particle leaves a continuous cyan trail; electric acceleration and magnetic curvature follow field signs.",
  },
  {
    category: "electromagnetism",
    slug: "em-wave-propagation",
    title: "EM Wave Propagation",
    summary: "Electric and magnetic waves propagate as perpendicular 3D fields.",
    principle:
      "In a plane wave, electric and magnetic fields are mutually perpendicular and transverse to propagation.",
    equations: [
      "E = E0 y-hat sin(kx - omega t)",
      "B = (E0/c) z-hat sin(kx - omega t)",
      "c = omega/k",
    ],
    method:
      "Analytic sinusoidal plane-wave visualization; no FDTD grid or Courant stability model.",
    expectedOutput:
      "Cyan E (+y) and rose B (+z) stay in phase and propagate along +x at fixed display speed.",
  },
  {
    category: "thermodynamics",
    slug: "heat-diffusion",
    title: "Heat Diffusion Plate",
    summary: "A hot spot spreads through a square plate.",
    principle:
      "Heat flows from high temperature to low temperature according to the temperature Laplacian.",
    equations: ["dT/dt = alpha (d2T/dx2 + d2T/dy2)"],
    method:
      "Continuous analytic Gaussian heat kernel with cold-edge fade; contours use the same temperature field.",
    expectedOutput:
      "A warm region diffuses outward from the source while the square boundary remains visibly cooler.",
  },
  {
    category: "thermodynamics",
    slug: "ideal-gas",
    title: "Ideal Gas Kinetics",
    summary: "Particles move in a 3D box and form a kinetic gas cloud.",
    principle: "Microscopic elastic motion produces macroscopic pressure and temperature behavior.",
    equations: ["PV = NkT", "1/2 m <v^2> proportional to T"],
    method:
      "Seeded Maxwell-Boltzmann velocities advanced by a fixed-step accumulator with specular wall reflection.",
    expectedOutput:
      "Particles move faster and fill the box more energetically as temperature rises.",
  },
  {
    category: "thermodynamics",
    slug: "boltzmann-distribution",
    title: "Boltzmann Energy Distribution",
    summary: "Thermal state occupancy follows a smooth Boltzmann energy distribution.",
    principle:
      "At equilibrium, states with energy E occur with probability weighted by exp(-E/kT).",
    equations: ["P(E) proportional to g(E) exp(-E/kT)", "S = -sum_i p_i ln p_i"],
    method:
      "A normalized probability-density curve, filled occupancy area, sampled ensemble, and mean-energy marker.",
    expectedOutput:
      "Higher temperature broadens the occupied energy range and shifts the mean-energy marker rightward.",
  },
  {
    category: "quantum-mechanics",
    slug: "particle-in-box",
    title: "Particle in a Box",
    summary: "Bound-state superposition evolves inside infinite potential walls.",
    principle: "Stationary eigenstates gain phase at rates set by quantized energies.",
    equations: [
      "psi_n(x) = sqrt(2/L) sin(n pi x/L)",
      "E_n proportional to n^2",
      "|psi|^2 is probability density",
    ],
    method:
      "Normalized infinite-well basis superposition sampled as a 3D probability-density curve.",
    expectedOutput:
      "The cyan density curve oscillates as the ground state interferes with a selected excited state.",
  },
  {
    category: "quantum-mechanics",
    slug: "quantum-tunneling",
    title: "Quantum Tunneling",
    summary: "A wave packet partly transmits through a finite barrier.",
    principle:
      "The Schrodinger equation allows nonzero probability inside and beyond classically forbidden barriers.",
    equations: ["i dpsi/dt = -1/2 d2psi/dx2 + V(x) psi", "rho = |psi|^2"],
    method:
      "Analytic rectangular-barrier transmission (including width and above-barrier reflection) drives heuristic Gaussian density envelopes.",
    expectedOutput:
      "A cyan density envelope splits visually into reflected and transmitted portions at the barrier.",
  },
  {
    category: "quantum-mechanics",
    slug: "schrodinger-2d",
    title: "2D Schrodinger Wave Packet",
    summary: "A Gaussian wave packet moves through a circular potential region.",
    principle:
      "The 2D time-dependent Schrodinger equation disperses and scatters probability density.",
    equations: ["i dpsi/dt = -1/2 Laplacian(psi) + V(x,y) psi", "rho(x,y) = |psi|^2"],
    method:
      "Heuristic Gaussian density and phase visualization with scripted reflection and transmission; not a 2D PDE solve.",
    expectedOutput:
      "The packet spreads, scatters from the barrier, and separates into reflected and transmitted components.",
  },
];

export function getLabSimulationPath(simulation: Pick<LabSimulationMetadata, "category" | "slug">) {
  return `/simulations/${simulation.category}/${simulation.slug}`;
}
