import React from "react";
import ReactDOM from "react-dom/client";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@/ui/theme-provider";
import { Toaster } from "@/ui/sonner";

import { Home } from "@/home";
import { MassEffectSimulation } from "@/simulations/mass-effect";
import { GravitationalWavesSimulation } from "@/simulations/gravitational-waves";
import { MercuryPrecessionSimulation } from "@/simulations/mercury-precession";
import { PhysicsLabRoute } from "@/simulations/physics-labs";
//import { NBodyGravitySimulation } from '@/simulations/n-body-gravity'
import Layout from "@/components/layout";
import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider defaultTheme="dark" storageKey="physics-theme">
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
            {/* <Route path="simulations/n-body-gravity" element={<NBodyGravitySimulation />} /> */}
          </Route>
        </Routes>
        <Toaster />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
