import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/ui/button";
import { Moon, Sun, Home } from "lucide-react";
import { useTheme } from "@/ui/theme-provider";
import {
  getLabSimulationPath,
  LAB_CATEGORY_LABELS,
  LAB_CATEGORY_ORDER,
  LAB_SIMULATIONS,
} from "@/simulations/physics-labs";

const STANDALONE_SIMULATIONS = [
  { title: "Mass Effect", href: "/simulations/mass-effect" },
  { title: "Gravitational Waves", href: "/simulations/gravitational-waves" },
  { title: "Mercury Precession", href: "/simulations/mercury-precession" },
] as const;

export default function Header() {
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const knownPaths = new Set([
    ...STANDALONE_SIMULATIONS.map((simulation) => simulation.href),
    ...LAB_SIMULATIONS.map((simulation) => getLabSimulationPath(simulation)),
  ]);

  return (
    <header className="rounded-full border border-border/40 bg-background/80 backdrop-blur-xl shadow-2xl">
      <div className="flex items-center gap-2 px-4 py-2">
        <Link to="/">
          <Button variant="ghost" size="sm" className="rounded-full gap-2">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </Button>
        </Link>

        <div className="h-4 w-px bg-border/40" />

        <select
          aria-label="Choose simulation"
          value={knownPaths.has(location.pathname) ? location.pathname : ""}
          onChange={(event) => navigate(event.target.value)}
          className="h-8 max-w-[210px] rounded-full border border-border/40 bg-background px-3 text-xs text-foreground outline-none sm:max-w-[280px]"
        >
          <option value="" disabled>
            Simulations
          </option>
          <optgroup label="Relativity">
            {STANDALONE_SIMULATIONS.map((simulation) => (
              <option key={simulation.href} value={simulation.href}>
                {simulation.title}
              </option>
            ))}
          </optgroup>
          {LAB_CATEGORY_ORDER.map((category) => (
            <optgroup key={category} label={LAB_CATEGORY_LABELS[category]}>
              {LAB_SIMULATIONS.filter((simulation) => simulation.category === category).map(
                (simulation) => (
                  <option key={simulation.slug} value={getLabSimulationPath(simulation)}>
                    {simulation.title}
                  </option>
                ),
              )}
            </optgroup>
          ))}
        </select>

        <div className="h-4 w-px bg-border/40" />

        <Button
          variant="ghost"
          size="sm"
          className="rounded-full"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </header>
  );
}
