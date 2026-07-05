export const PHYSICS_CONSTANTS = {
  G: 6.6743e-11, // Gravitational constant (m³ kg⁻¹ s⁻²)
  c: 299792458, // Speed of light (m/s)
  h: 6.62607015e-34, // Planck constant (J⋅s)
  hbar: 1.054571817e-34, // Reduced Planck constant (J⋅s)
  k: 1.380649e-23, // Boltzmann constant (J/K)
  e: 1.602176634e-19, // Elementary charge (C)
  m_e: 9.1093837015e-31, // Electron mass (kg)
  m_p: 1.67262192369e-27, // Proton mass (kg)
  m_n: 1.67492749804e-27, // Neutron mass (kg)
  M_sun: 1.989e30, // Solar mass (kg)
  R_earth: 6.371e6, // Earth radius (m)
  AU: 1.496e11, // Astronomical unit (m)
} as const;

export const SIMULATION_CONSTANTS = {
  TIME_STEP: 0.01, // Time step for simulations (seconds)
  MAX_ITERATIONS: 1000, // Maximum iterations per frame
  EPSILON: 1e-10, // Numerical precision threshold
} as const;

export const VISUALIZATION_DEFAULTS = {
  GRID_SIZE: 20,
  GRID_DIVISIONS: 20,
  GRID_RESOLUTION: 32,
  CAMERA_DISTANCE: 10,
  ANIMATION_SPEED: 1,
  MIN_MESH_SIZE: 0.1,
  MAX_MESH_SIZE: 5,
} as const;

export const HERO_CONTENT = {
  badge: "Interactive physics across scales",
  title: {
    main: "Explore physics",
    highlight: "from forces to spacetime",
  },
  description:
    "Three.js simulations that turn motion, fields, waves, quanta, heat, and relativity into explorable visual models.",
  cta: {
    text: "Explore Simulations",
    link: "/simulations/mass-effect",
  },
} as const;

export const PHYSICIST_TRIBUTE = {
  title: "A tribute to the architects of modern physics",
  description:
    "Inspired by Newton, Maxwell, Curie, Bohr, Schrödinger, Feynman, and Einstein, whose models of motion, fields, matter, quanta, and spacetime shape the phenomena simulated here.",
  names: [
    "Isaac Newton",
    "James Clerk Maxwell",
    "Marie Curie",
    "Niels Bohr",
    "Erwin Schrödinger",
    "Richard Feynman",
    "Albert Einstein",
  ],
} as const;

export const PHYSICS_CATEGORIES = [
  {
    name: "Mechanics",
    summary: "Forces, orbital motion, stability, and conservation laws.",
    status: "Live foundation",
    href: "/simulations/mercury-precession",
  },
  {
    name: "Electromagnetism",
    summary: "Fields, waves, charge dynamics, and radiation.",
    status: "Planned",
  },
  {
    name: "Thermodynamics",
    summary: "Heat flow, entropy, diffusion, and statistical behavior.",
    status: "Planned",
  },
  {
    name: "Relativity",
    summary: "Curved spacetime, gravitational waves, and precession.",
    status: "Live simulations",
    href: "/simulations/mass-effect",
  },
  {
    name: "Quantum",
    summary: "Wavefunctions, spectra, uncertainty, and tunneling.",
    status: "Planned",
  },
] as const;

export const FEATURED_SIMULATIONS = [
  {
    title: "Mass and Curvature",
    category: "Relativity",
    description: "Visualize how mass deforms a spacetime grid.",
    href: "/simulations/mass-effect",
  },
  {
    title: "Gravitational Waves",
    category: "Relativity",
    description: "Explore binary-source wave distortion.",
    href: "/simulations/gravitational-waves",
  },
  {
    title: "Mercury Precession",
    category: "Mechanics + Relativity",
    description: "Compare orbital motion with relativistic correction.",
    href: "/simulations/mercury-precession",
  },
] as const;

export const EINSTEIN_QUOTES: string[] = [
  "Imagination is more important than knowledge. For knowledge is limited, whereas imagination embraces the entire world.",
  "I have no special talent. I am only passionately curious.",
  "The important thing is not to stop questioning. Curiosity has its own reason for existence.",
  "Logic will get you from A to B. Imagination will take you everywhere.",
  "The most incomprehensible thing about the universe is that it is comprehensible.",
  "Look deep into nature, and then you will understand everything better.",
  "All of science is nothing more than a refinement of everyday thinking.",
  "We still do not know one thousandth of one percent of what nature has revealed to us.",
  "People like us, who believe in physics, know that the distinction between past, present, and future is only a stubbornly persistent illusion.",
  "Time and space are modes by which we think and not conditions in which we live.",
  "Reality is merely an illusion, albeit a very persistent one.",
  "Education is not the learning of facts, but the training of the mind to think.",
  "A person who never made a mistake never tried anything new.",
  "The measure of intelligence is the ability to change.",
  "Once you stop learning, you start dying.",
  "Try not to become a man of success, but rather try to become a man of value.",
  "Peace cannot be kept by force; it can only be achieved by understanding.",
  "Only a life lived for others is a life worthwhile.",
  "The true sign of intelligence is not knowledge but imagination.",
  "In the middle of difficulty lies opportunity.",
  "The most beautiful experience we can have is the mysterious.",
  "To raise new questions, new possibilities, to regard old problems from a new angle, requires creative imagination and marks real advance in science.",
];
