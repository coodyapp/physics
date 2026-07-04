import { Children, memo } from "react";
import type { CSSProperties, ReactNode } from "react";

import { CoodyLogo } from "@/components/coody-logo";
import { GlitchText } from "@/components/glitch-text";
import { WebGLBackground } from "@/components/webgl-background";
import { cn } from "@/utils/tailwind";

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

const GLITCH_NAMES = ["Newton", "Maxwell", "Curie", "Einstein", "Noether", "Feynman"];

type WaveDirection = "ltr" | "rtl";

export type LogosCarouselProps = {
  children: ReactNode;
  direction?: WaveDirection;
  className?: string;
};

function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <WebGLBackground />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.18),transparent_24%),linear-gradient(180deg,rgba(0,0,0,0.2),rgba(0,0,0,0.94)_82%)]" />

      <main className="relative z-10 flex min-h-[calc(100svh-88px)] flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
        <section className="home-appear home-appear-first mx-auto max-w-5xl">
          <p className="text-xs font-medium uppercase tracking-[0.42em] text-white/50">Physics</p>
          <h1 className="mt-5 text-6xl font-semibold tracking-[-0.08em] text-white sm:text-8xl lg:text-9xl">
            <GlitchText words={GLITCH_NAMES} glitchInterval={2200} />
          </h1>
        </section>

        <LogosCarousel className="home-appear home-appear-second mt-12 w-full max-w-6xl">
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
