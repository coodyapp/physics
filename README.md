# Physics

Interactive General Relativity and gravitational physics visualizations built with React, Three.js, React Three Fiber, Tailwind CSS, and Vite+.

The app focuses on visually explaining spacetime curvature, gravitational waves, and Mercury's relativistic perihelion precession while keeping the underlying equations tested.

## Features

- Spacetime curvature around a central mass using a Schwarzschild-radius visualization.
- Binary massive-body curvature wells and gravitational-wave surface distortion.
- Mercury perihelion precession with a simulation-unit system calibrated for stable, visible orbits.
- Physics tests for Newtonian gravity, Schwarzschild radius, escape velocity, gravitational-wave strain, Kepler frequency, spacetime helpers, and Mercury's real ~43 arcsec/century precession.
- Unified Vite+ workflow for install, check, test, dev, build, and preview commands.

## Tooling

This project uses Vite+ through the `vp` CLI. Use `vp` commands instead of calling the package manager or Vite/Vitest directly.

Useful commands:

- `vp install` installs dependencies.
- `vp dev` starts the development server.
- `vp check` formats, lints, and type checks.
- `vp test` runs the test suite.
- `vp build` creates a production build.
- `vp preview` previews the production build.
- `vp run <script>` runs a package script through Vite+.

## Requirements

- Vite+ CLI available as `vp`.
- Node.js managed by Vite+ or your local environment.

Check your environment with:

```bash
vp env doctor
```

## Setup

Install dependencies:

```bash
vp install
```

## Development

Start the local dev server:

```bash
vp dev
```

Open the local URL printed by Vite+.

Routes:

- `/` home page.
- `/simulations/mass-effect` spacetime curvature around mass.
- `/simulations/gravitational-waves` binary system and wave distortion.
- `/simulations/mercury-precession` relativistic orbital precession.

## Quality Checks

Run the full check loop:

```bash
vp check
vp test
vp build
```

The current test suite includes 29 physics tests.

## Production Build

Build the app:

```bash
vp build
```

Preview the generated `dist/` output:

```bash
vp preview
```

## Physics Notes

Core equations covered by tests include:

- Newtonian gravity: `F = G m1 m2 / r^2`.
- Gravitational acceleration: `a = F / m`.
- Orbital velocity: `v = sqrt(GM/r)`.
- Escape velocity: `v_esc = sqrt(2GM/r)`.
- Schwarzschild radius: `r_s = 2GM/c^2`.
- Schwarzschild precession: `Delta omega = 6 pi GM / (c^2 a (1-e^2))`.
- Binary Kepler frequency: `f = sqrt(G(m1+m2)/a^3) / (2 pi)`.
- Leading-order gravitational-wave strain: `h = 4 (G M_c / c^2)^(5/3) (pi f / c)^(2/3) / r`.
- Chirp mass: `M_c = (m1 m2)^(3/5) / (m1 + m2)^(1/5)`.

The Mercury simulation intentionally uses dimensionless simulation units for the rendered orbit. Real SI constants at `a = 8` render units would produce superluminal, numerically unstable motion. The info panel still validates real Mercury precession using SI units and the real solar mass.

## Project Structure

- `src/physics/` pure physics services and equations.
- `src/simulations/` React Three Fiber simulation scenes.
- `src/components/` app-level layout, renderer, controls, and panels.
- `src/ui/` shared UI primitives used by the app.
- `src/styles/globals.css` Tailwind v4 theme and dark-mode variant.
- `vite.config.ts` Vite+ config for build, lint, formatting, staged hooks, and Vite plugins.

## Migration Notes

The project has been migrated to Vite+:

- Vite config imports use `vite-plus`.
- Tests import from `vite-plus/test`.
- Standalone `vite` and `vitest` dev dependencies were removed; Vite+ provides them.
- Validation runs through `vp install`, `vp check`, `vp test`, and `vp build`.

## Troubleshooting

If tooling behaves unexpectedly, run:

```bash
vp env doctor
```

If dependencies are out of sync, run:

```bash
vp install
```
