import { Children, memo } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";

import { CoodyLogo } from "@/components/coody-logo";
import { WaveText } from "@/components/wave-text";
import { LAB_SIMULATIONS, getLabSimulationPath } from "@/simulations/physics-labs";
import { cn } from "@/utils/tailwind";

const ROUTED_SIMULATIONS = [
  { title: "Mass Effect", href: "/simulations/mass-effect" },
  { title: "Gravitational Waves", href: "/simulations/gravitational-waves" },
  { title: "Mercury Precession", href: "/simulations/mercury-precession" },
];

const AVAILABLE_SIMULATIONS = [
  ...ROUTED_SIMULATIONS,
  ...LAB_SIMULATIONS.map((simulation) => ({
    title: simulation.title,
    href: getLabSimulationPath(simulation),
  })),
];
const SIMULATION_NAMES = AVAILABLE_SIMULATIONS.map((simulation) => simulation.title);
const SIMULATIONS_HREF = AVAILABLE_SIMULATIONS[0]?.href ?? "/simulations/mass-effect";

const PHYSICIST_NAMES = [
  "Isaac Newton",
  "Galileo Galilei",
  "Johannes Kepler",
  "Emilie du Chatelet",
  "Michael Faraday",
  "James Clerk Maxwell",
  "Lord Kelvin",
  "Ludwig Boltzmann",
  "J. J. Thomson",
  "Max Planck",
  "Marie Curie",
  "Albert Einstein",
  "Ernest Rutherford",
  "Niels Bohr",
  "Satyendra Nath Bose",
  "Louis de Broglie",
  "Wolfgang Pauli",
  "Werner Heisenberg",
  "Erwin Schrodinger",
  "Paul Dirac",
  "Enrico Fermi",
  "Lise Meitner",
  "C. V. Raman",
  "Subrahmanyan Chandrasekhar",
  "Cecilia Payne-Gaposchkin",
  "Hideki Yukawa",
  "Richard Feynman",
  "Julian Schwinger",
  "Sin-Itiro Tomonaga",
  "Chien-Shiung Wu",
  "Murray Gell-Mann",
  "Maria Goeppert Mayer",
  "Abdus Salam",
  "Steven Weinberg",
  "Sheldon Glashow",
  "Vera Rubin",
  "Jocelyn Bell Burnell",
  "Kip Thorne",
  "Roger Penrose",
  "Stephen Hawking",
  "Donna Strickland",
  "Andrea Ghez",
] as const;

type WaveDirection = "ltr" | "rtl";

export type LogosCarouselProps = {
  children: ReactNode;
  direction?: WaveDirection;
  className?: string;
};

function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.18),transparent_24%),linear-gradient(180deg,rgba(0,0,0,0.2),rgba(0,0,0,0.94)_82%)]" />

      <main className="relative z-10 flex min-h-[calc(100svh-88px)] flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
        <section className="home-appear home-appear-first mx-auto max-w-5xl">
          <p className="text-xs font-medium uppercase tracking-[0.42em] text-white/50">Physics</p>
          <h1 className="mx-auto mt-5 w-[min(94vw,70rem)]">
            <WaveText names={SIMULATION_NAMES} />
          </h1>
        </section>

        <Link
          to={SIMULATIONS_HREF}
          className="home-appear home-appear-second mt-10 inline-flex rounded-full bg-white px-6 py-3 text-sm font-medium uppercase tracking-[0.18em] text-black shadow-2xl shadow-white/10 transition hover:-translate-y-0.5 hover:bg-white/90"
        >
          Go to simulations
        </Link>

        <LogosCarousel className="home-appear home-appear-third mt-12 w-full max-w-6xl">
          {PHYSICIST_NAMES.map((name) => (
            <span key={name}>{name}</span>
          ))}
        </LogosCarousel>
      </main>

      <footer className="home-appear home-appear-third relative z-10 flex justify-center px-4 pb-6">
        <div className="flex flex-col items-center gap-2 text-center drop-shadow-2xl">
          <span className="text-xs uppercase tracking-[0.28em] text-white/45">Powered by</span>
          <CoodyLogo height={24} />
        </div>
      </footer>
    </div>
  );
}

function LogosCarousel({ children, direction = "ltr", className }: LogosCarouselProps) {
  const logos = Children.toArray(children);
  const repeatedLogos = [...logos, ...logos];

  return (
    <div data-slot="logos-carousel" className={cn("relative overflow-hidden", className)}>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-black to-transparent sm:w-28" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-black to-transparent sm:w-28" />
      <div
        data-slot="logos-carousel-track"
        className={cn(
          "home-marquee-track flex w-max items-center gap-3",
          direction === "rtl" && "home-marquee-track-reverse",
        )}
        style={{ "--home-marquee-duration": "56s" } as CSSProperties}
      >
        {repeatedLogos.map((logo, index) => (
          <LogoColumn key={index} logo={logo} />
        ))}
      </div>
    </div>
  );
}

const LogoColumn = memo(function LogoColumn({ logo }: { logo: ReactNode }) {
  return (
    <div
      data-slot="logos-carousel-logo"
      className="flex min-w-max items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-5 py-2 text-sm text-white/68 shadow-2xl shadow-black/25 backdrop-blur-xl transition-colors hover:border-white/20 hover:text-white"
    >
      {logo}
    </div>
  );
});

export { Home };
