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
    method: "3D oscillator animation with a dynamic spring line and cube mass.",
    expectedOutput:
      "The block oscillates around the equilibrium marker while stiffness and damping alter motion.",
  },
  {
    category: "mechanics",
    slug: "damped-pendulum",
    title: "Damped Pendulum",
    summary: "Length, gravity, damping, and initial angle control pendulum motion.",
    principle:
      "For small angles, a pendulum behaves like a harmonic oscillator with period set by length and gravity.",
    equations: ["theta'' + (g/L) sin(theta) = -b theta'", "T ~= 2 pi sqrt(L/g)"],
    method: "Damped small-angle oscillator rendered as a 3D rod, bob, and arc envelope.",
    expectedOutput: "The bob swings through a visible arc and decays faster as damping rises.",
  },
  {
    category: "electromagnetism",
    slug: "electric-field-lines",
    title: "Electric Field Lines",
    summary: "Field vectors and streamlines from two point charges.",
    principle:
      "Coulomb fields add linearly, so the net electric field is the vector sum of each charge contribution.",
    equations: ["E(r) = sum_i k q_i (r - r_i) / |r - r_i|^3", "F = qE"],
    method: "3D streamline curves seeded around each charge with charge-dependent bending.",
    expectedOutput:
      "Cyan and rose field lines emerge from the charge spheres and change as spacing or polarity changes.",
  },
  {
    category: "electromagnetism",
    slug: "charged-particle-motion",
    title: "Charged Particle Motion",
    summary: "A charged particle curves through crossed electric and magnetic fields.",
    principle:
      "The Lorentz force bends velocity perpendicular to B while E accelerates along its direction.",
    equations: ["m dv/dt = q(E + v x B)", "dr/dt = v"],
    method: "Parametric 3D helical-drift trajectory driven by field controls.",
    expectedOutput:
      "The particle leaves a 3D cyan trail whose radius and drift change with E and B.",
  },
  {
    category: "electromagnetism",
    slug: "em-wave-propagation",
    title: "EM Wave Propagation",
    summary: "Electric and magnetic waves propagate as perpendicular 3D fields.",
    principle: "Maxwell curl equations couple E and H fields so changes in one drive the other.",
    equations: ["dE/dt = c^2 dB/dx", "dB/dt = -dE/dx"],
    method: "Animated 3D field curves with E and H components perpendicular to propagation.",
    expectedOutput:
      "Cyan and rose waves travel along the same axis with a visible phase relationship.",
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
      "Smooth temperature field with a fixed cold boundary, a central heat source, and isotherm contours.",
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
    method: "Deterministic 3D particle cloud constrained inside a transparent box.",
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
    method: "3D probability-density curve between two wall meshes.",
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
    method: "3D probability curve moving through a translucent potential wall.",
    expectedOutput: "A cyan packet interacts with the rose barrier and leaves a transmitted tail.",
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
      "Smooth probability-density surface with phase coloring, density contours, boundaries, and a circular potential barrier.",
    expectedOutput:
      "The packet spreads, scatters from the barrier, and separates into reflected and transmitted components.",
  },
];

export function getLabSimulationPath(simulation: Pick<LabSimulationMetadata, "category" | "slug">) {
  return `/simulations/${simulation.category}/${simulation.slug}`;
}
