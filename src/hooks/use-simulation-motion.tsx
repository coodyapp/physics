import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface SimulationMotionValue {
  isPlaying: boolean;
  prefersReducedMotion: boolean;
  setIsPlaying: (playing: boolean) => void;
  toggle: () => void;
}

const SimulationMotionContext = createContext<SimulationMotionValue | null>(null);

export function SimulationMotionProvider({ children }: { children: ReactNode }) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => {
      setPrefersReducedMotion(query.matches);
      if (query.matches) setIsPlaying(false);
    };

    updatePreference();
    query.addEventListener("change", updatePreference);
    return () => query.removeEventListener("change", updatePreference);
  }, []);

  return (
    <SimulationMotionContext.Provider
      value={{
        isPlaying,
        prefersReducedMotion,
        setIsPlaying,
        toggle: () => setIsPlaying((playing) => !playing),
      }}
    >
      {children}
    </SimulationMotionContext.Provider>
  );
}

export function useSimulationMotion() {
  const value = useContext(SimulationMotionContext);
  if (!value) throw new Error("useSimulationMotion must be used within SimulationMotionProvider");
  return value;
}
