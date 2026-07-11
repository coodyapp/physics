import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/ui/button";
import {
  Axis3d,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  Home,
  Info,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Settings,
  Sun,
} from "lucide-react";
import { useTheme } from "@/ui/theme-provider";
import type { CameraViewDirection, CameraViewMode } from "@/components/renderer";
import {
  getLabSimulationPath,
  LAB_CATEGORY_LABELS,
  LAB_CATEGORY_ORDER,
  LAB_SIMULATIONS,
} from "@/simulations/physics-labs-data";
import { cn } from "@/utils/tailwind";
import { useSimulationMotion } from "@/hooks/use-simulation-motion";

const STANDALONE_SIMULATIONS = [
  { title: "Mass Effect", href: "/simulations/mass-effect" },
  { title: "Gravitational Waves", href: "/simulations/gravitational-waves" },
  { title: "Mercury Precession", href: "/simulations/mercury-precession" },
] as const;

const SIMULATION_LINKS = [
  ...STANDALONE_SIMULATIONS,
  ...LAB_SIMULATIONS.map((simulation) => ({
    title: simulation.title,
    href: getLabSimulationPath(simulation),
  })),
];

const KNOWN_SIMULATION_PATHS = new Set(SIMULATION_LINKS.map((simulation) => simulation.href));

const VIEW_DIRECTIONS: { value: CameraViewDirection; label: string }[] = [
  { value: "isometric", label: "Isometric" },
  { value: "xy", label: "XY plane" },
  { value: "xz", label: "XZ plane" },
  { value: "yz", label: "YZ plane" },
];

const chromeButtonClassName =
  "relative rounded-full border border-border/55 bg-background/45 text-foreground shadow-lg backdrop-blur-xl hover:bg-background/75 hover:text-foreground focus-visible:ring-ring/70 disabled:bg-background/30 dark:bg-background/35 dark:hover:bg-background/60";

const activeChromeButtonClassName =
  "border-primary/60 bg-primary/80 text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground";

interface HeaderProps {
  showGrid: boolean;
  showAxis: boolean;
  cameraMode: CameraViewMode;
  cameraDirection: CameraViewDirection;
  isInformationOpen: boolean;
  isControlsOpen: boolean;
  informationPanelId: string;
  controlsPanelId: string;
  onGridToggle: (value: boolean) => void;
  onAxisToggle: (value: boolean) => void;
  onCameraModeChange: (value: CameraViewMode) => void;
  onCameraDirectionChange: (value: CameraViewDirection) => void;
  onInformationToggle: (value: boolean) => void;
  onControlsToggle: (value: boolean) => void;
  onCameraReset: () => void;
}

export default function Header({
  showGrid,
  showAxis,
  cameraMode,
  cameraDirection,
  isInformationOpen,
  isControlsOpen,
  informationPanelId,
  controlsPanelId,
  onGridToggle,
  onAxisToggle,
  onCameraModeChange,
  onCameraDirectionChange,
  onInformationToggle,
  onControlsToggle,
  onCameraReset,
}: HeaderProps) {
  const { isPlaying, prefersReducedMotion, toggle: toggleMotion } = useSimulationMotion();
  const { theme, setTheme } = useTheme();
  const nextTheme = theme === "light" ? "dark" : "light";
  const location = useLocation();
  const navigate = useNavigate();
  const currentSimulationIndex = SIMULATION_LINKS.findIndex(
    (simulation) => simulation.href === location.pathname,
  );
  const currentSimulationFound = currentSimulationIndex >= 0;
  const previousSimulation = currentSimulationFound
    ? SIMULATION_LINKS[
        (currentSimulationIndex - 1 + SIMULATION_LINKS.length) % SIMULATION_LINKS.length
      ]
    : undefined;
  const nextSimulation = currentSimulationFound
    ? SIMULATION_LINKS[(currentSimulationIndex + 1) % SIMULATION_LINKS.length]
    : undefined;
  return (
    <header
      aria-label="Simulation controls and navigation"
      className="max-w-[calc(100vw-2rem)] rounded-[1.75rem] border border-border/55 bg-background/45 shadow-2xl backdrop-blur-2xl"
    >
      <div
        className="flex items-center gap-1 overflow-x-auto px-2 py-2 [scrollbar-width:thin] sm:gap-2 sm:px-3"
        role="toolbar"
        aria-label="Scrollable simulation toolbar"
        tabIndex={0}
      >
        <Button
          asChild
          variant="ghost"
          size="icon-lg"
          className={chromeButtonClassName}
          aria-label="Home"
          title="Home"
        >
          <Link to="/">
            <Home />
            <span className="sr-only">Home</span>
          </Link>
        </Button>

        <Button
          variant="ghost"
          size="icon-lg"
          className={chromeButtonClassName}
          aria-label={`Switch to ${nextTheme} theme`}
          title={`Switch to ${nextTheme} theme`}
          onClick={() => setTheme(nextTheme)}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <div aria-hidden="true" className="h-6 w-px shrink-0 bg-border/50" />

        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className={cn(chromeButtonClassName, isInformationOpen && activeChromeButtonClassName)}
          aria-label="Information panel"
          aria-controls={informationPanelId}
          aria-expanded={isInformationOpen}
          aria-pressed={isInformationOpen}
          title={isInformationOpen ? "Hide information" : "Show information"}
          onClick={() => onInformationToggle(!isInformationOpen)}
        >
          <Info />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className={cn(chromeButtonClassName, isControlsOpen && activeChromeButtonClassName)}
          aria-label="Settings panel"
          aria-controls={controlsPanelId}
          aria-expanded={isControlsOpen}
          aria-pressed={isControlsOpen}
          title={isControlsOpen ? "Hide settings" : "Show settings"}
          onClick={() => onControlsToggle(!isControlsOpen)}
        >
          <Settings />
        </Button>

        <div aria-hidden="true" className="h-6 w-px shrink-0 bg-border/50" />

        <select
          aria-label="Camera projection"
          title="Camera projection"
          value={cameraMode}
          onChange={(event) => onCameraModeChange(event.target.value as CameraViewMode)}
          className="h-10 shrink-0 rounded-full border border-border/55 bg-background/45 px-2 text-xs shadow-lg backdrop-blur-xl focus-visible:ring-2"
        >
          <option value="3d">3D</option>
          <option value="2d">2D</option>
        </select>

        <select
          aria-label="Camera direction"
          title="Camera direction"
          value={cameraDirection}
          onChange={(event) => onCameraDirectionChange(event.target.value as CameraViewDirection)}
          className="h-10 w-24 shrink-0 rounded-full border border-border/55 bg-background/45 px-2 text-xs shadow-lg backdrop-blur-xl focus-visible:ring-2"
        >
          {VIEW_DIRECTIONS.map((direction) => (
            <option key={direction.value} value={direction.value}>
              {direction.label}
            </option>
          ))}
        </select>

        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className={chromeButtonClassName}
          aria-label="Reset camera"
          title="Reset camera (R)"
          onClick={onCameraReset}
        >
          <RotateCcw />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className={cn(chromeButtonClassName, isPlaying && activeChromeButtonClassName)}
          aria-label={isPlaying ? "Pause animation" : "Play animation"}
          aria-pressed={isPlaying}
          title={`${isPlaying ? "Pause" : "Play"} animation${prefersReducedMotion ? " (reduced motion preferred)" : ""}`}
          onClick={toggleMotion}
        >
          {isPlaying ? <Pause /> : <Play />}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className={cn(chromeButtonClassName, showGrid && activeChromeButtonClassName)}
          aria-label={showGrid ? "Hide coordinate grid" : "Show coordinate grid"}
          aria-pressed={showGrid}
          title={showGrid ? "Hide grid" : "Show grid"}
          onClick={() => onGridToggle(!showGrid)}
        >
          <Grid3x3 />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className={cn(chromeButtonClassName, showAxis && activeChromeButtonClassName)}
          aria-label={showAxis ? "Hide coordinate axes" : "Show coordinate axes"}
          aria-pressed={showAxis}
          title={showAxis ? "Hide axis" : "Show axis"}
          onClick={() => onAxisToggle(!showAxis)}
        >
          <Axis3d />
        </Button>

        <div aria-hidden="true" className="h-6 w-px shrink-0 bg-border/50" />

        <select
          aria-label="Choose simulation"
          value={KNOWN_SIMULATION_PATHS.has(location.pathname) ? location.pathname : ""}
          onChange={(event) => navigate(event.target.value)}
          className="h-10 w-[34vw] min-w-[8.5rem] max-w-[160px] rounded-full border border-border/55 bg-background/45 px-3 text-xs text-foreground shadow-lg outline-none backdrop-blur-xl transition-colors hover:bg-background/75 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:w-[280px] sm:max-w-[280px]"
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

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="icon-lg"
            className={chromeButtonClassName}
            disabled={!previousSimulation}
            aria-label={
              previousSimulation
                ? `Previous simulation: ${previousSimulation.title}`
                : "Previous simulation"
            }
            title={
              previousSimulation ? `Previous: ${previousSimulation.title}` : "Previous simulation"
            }
            onClick={() => previousSimulation && navigate(previousSimulation.href)}
          >
            <ChevronLeft />
          </Button>

          <Button
            variant="ghost"
            size="icon-lg"
            className={chromeButtonClassName}
            disabled={!nextSimulation}
            aria-label={
              nextSimulation ? `Next simulation: ${nextSimulation.title}` : "Next simulation"
            }
            title={nextSimulation ? `Next: ${nextSimulation.title}` : "Next simulation"}
            onClick={() => nextSimulation && navigate(nextSimulation.href)}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </header>
  );
}
