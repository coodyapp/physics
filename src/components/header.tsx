import { Link } from "react-router-dom";
import { Button } from "@/ui/button";
import { Moon, Sun, Home, Orbit, Waves, Sparkles } from "lucide-react";
import { useTheme } from "@/ui/theme-provider";

export default function Header() {
  const { theme, setTheme } = useTheme();

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

        <Link to="/simulations/mass-effect">
          <Button variant="ghost" size="sm" className="rounded-full gap-2 text-xs">
            <Orbit className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Mass Effect</span>
          </Button>
        </Link>

        <Link to="/simulations/gravitational-waves">
          <Button variant="ghost" size="sm" className="rounded-full gap-2 text-xs">
            <Waves className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Gravitational Waves</span>
          </Button>
        </Link>

        <Link to="/simulations/mercury-precession">
          <Button variant="ghost" size="sm" className="rounded-full gap-2 text-xs">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Mercury Precession</span>
          </Button>
        </Link>

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
