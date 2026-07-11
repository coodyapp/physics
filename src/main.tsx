import React from "react";
import ReactDOM from "react-dom/client";
import { useEffect } from "react";
import { Routes, Route, BrowserRouter, Link, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/ui/theme-provider";
import { Toaster } from "@/ui/sonner";

import { Home } from "@/home";
import { MassEffectSimulation } from "@/simulations/mass-effect";
import { GravitationalWavesSimulation } from "@/simulations/gravitational-waves";
import { MercuryPrecessionSimulation } from "@/simulations/mercury-precession";
import { PhysicsLabRoute } from "@/simulations/physics-labs";
import Layout from "@/components/layout";
import { SimulationMotionProvider } from "@/hooks/use-simulation-motion";
import { LAB_SIMULATIONS } from "@/simulations/physics-labs-data";
import "./styles/globals.css";

function RouteTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    const lab = LAB_SIMULATIONS.find((item) => pathname.endsWith(`/${item.category}/${item.slug}`));
    const standalone: Record<string, string> = {
      "/simulations/mass-effect": "Mass Effect",
      "/simulations/gravitational-waves": "Gravitational Waves",
      "/simulations/mercury-precession": "Mercury Precession",
    };
    const title = pathname === "/" ? "Physics Simulations" : (lab?.title ?? standalone[pathname]);
    document.title = title ? `${title} | Physics` : "Page not found | Physics";
  }, [pathname]);

  return null;
}

function NotFound() {
  return (
    <main className="grid min-h-screen place-content-center gap-4 bg-background p-6 text-center">
      <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">404</p>
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <Link className="underline underline-offset-4" to="/">
        Return to simulation catalog
      </Link>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider defaultTheme="dark" storageKey="physics-theme">
        <SimulationMotionProvider>
          <RouteTitle />
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="simulations/mass-effect" element={<MassEffectSimulation />} />
              <Route
                path="simulations/gravitational-waves"
                element={<GravitationalWavesSimulation />}
              />
              <Route
                path="simulations/mercury-precession"
                element={<MercuryPrecessionSimulation />}
              />
              <Route path="simulations/:category/:slug" element={<PhysicsLabRoute />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </SimulationMotionProvider>
        <Toaster />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
