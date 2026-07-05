# Physics Simulation Expansion

- [x] Inspect current homepage, reference files in `tmp/`, and CI/CD workflows.
- [x] Replace homepage with a simple WebGL-backed landing page.
- [x] Add horizontal physicist-name scrolling inspired by the pasted carousel behavior.
- [x] Add a homepage footer with the Coody logo and Powered by Coody copy.
- [x] Move useful `tmp/` references into source, wire CSS through `src/styles/globals.css`, and remove `tmp/`.
- [x] Apply latest footer feedback: no background, with the Coody logo below Powered by.
- [x] Add 9 simulations total: 3 electromagnetism, 3 thermodynamics, 3 quantum mechanics.
- [x] For every new simulation, include concept, equations, numerical method, commented implementation, and expected output description.
- [x] Wire new simulations into routes and grouped navigation.
- [x] Run `yarn vp check`, `yarn test`, and `yarn build`.
- [ ] Review diff/status, commit, push, and verify CI/CD deployment.

## Simulation Plan

- Electromagnetism: electric field lines for point charges using Coulomb superposition; charged particle in crossed fields using RK4 Lorentz-force integration; EM wave propagation using a 1D FDTD Yee-style update.
- Thermodynamics: heat diffusion on a plate using explicit finite differences; ideal gas kinetic model using Monte Carlo-style particle collisions; Boltzmann energy distribution using Metropolis sampling.
- Quantum mechanics: particle-in-a-box wavefunction evolution using eigenstate superposition; quantum tunneling using finite-difference time-domain Schrodinger update; 2D Gaussian wave packet evolution using a finite-difference time-domain grid solver.

## Review Notes

- `src/home.tsx` is the homepage route entry.
- Existing `/simulations/...` routes automatically use the simulation layout.
- The existing header is too narrow for 9 more direct links, so grouped navigation is required.
- Existing CI/CD workflows deploy to Cloudflare Pages on `main` pushes; they must use the repository package manager (`yarn`).

## Results

- `yarn vp check` passed: formatting, linting, and type checking.
- `yarn test` passed: 29 tests across 2 files.
- `yarn build` passed and produced `dist/`.

## 2026-07-04 Simulation UI, Navigation, and Deployment Plan

- [x] Inspect current simulation routes, controls, navigation, and Cloudflare deployment setup.
- [x] Standardize the lab simulation parameter panel so each lab exposes controls in the same place and style.
- [x] Add grouped in-page simulation navigation with previous/next movement and active-state links.
- [x] Add more simulations using the shared lab pattern.
- [x] Run `vp check`, `vp test`, and `vp build`.
- [x] Review diff/status/log, commit intended changes, push, and deploy.

## 2026-07-04 Review Notes

- Added a Mechanics lab category with projectile motion, spring-mass oscillator, and damped pendulum simulations.
- Reworked the lab parameter overlay into a reusable control surface with consistent labels, current values, and min/max ranges.
- Added an in-page Simulation Navigator card with previous/next links and grouped active-state links.
- Validation passed: `vp check`, `vp test`, `vp build`, and `yarn build`.
- Deployed from commit `cc46cc3` through CD run `28722725848`; Cloudflare Pages deployment passed and `https://physics.coody.app/simulations/mechanics/projectile-motion` returned the app shell.

## 2026-07-04 Production Refactor Plan

- [x] Inspect dirty state, repository structure, simulation architecture, tests, and deploy workflow.
- [x] Audit dead code, duplicated UI patterns, naming issues, and detectable physics bugs.
- [x] Add shared simulation panel/slider/layout primitives and refactor legacy 3D simulation controls around them.
- [x] Remove high-confidence dead code and stale commented routes.
- [x] Fix detected physics bugs: Schwarzschild metric angular term, binary barycenter/frequency phase, solar-mass display units, and Boltzmann acceptance bias.
- [x] Add regression tests for the fixed physics helpers.
- [x] Run `vp check`, `vp test`, `vp build`, and `yarn build`.
- [x] Commit intended changes only, push to `main`, and verify CD deployment.

## 2026-07-04 Production Refactor Analysis

- Current local worktree has unrelated unstaged edits in `src/home.tsx`, `src/utils/constants.ts`, and `src/assets/`; those must remain untouched unless explicitly staged later.
- Existing simulation UI has three patterns: floating controls/info panels, Mercury side tabs, and lab-specific overlay controls. The safe first step is shared primitives without changing cameras or routes.
- High-confidence dead code: `src/components/mesh.tsx`, `src/simulations/base/simulation.interface.ts`, and commented n-body route/import references in `src/main.tsx`.
- Several generated `src/ui/*` components are production-unreachable, but keeping them is lower risk because they function as the local design-system inventory.
- Larger fixes deferred after this pass: Mercury per-frame React state refactor, full 3D conversion of all labs, and splitting `physics-labs.tsx` into per-simulation modules.

## 2026-07-04 Production Refactor Results

- Added shared `CollapsiblePanel`, `NumberSlider`, and `FloatingSimulationLayout` primitives for consistent 3D simulation controls/info UI.
- Refactored Mass Effect and Gravitational Waves to use the shared floating simulation layout; refactored Mercury parameter sliders to use `NumberSlider`.
- Fixed solar-mass scaling in Mass Effect and Gravitational Waves, binary barycenter placement for unequal masses, gravitational wave Hz phase conversion, Schwarzschild metric angular terms, and Boltzmann Metropolis acceptance.
- Removed high-confidence dead code: stale n-body route comments, unused `mesh.tsx`, and unused simulation interface types.
- Added regression coverage; local validation passed: `vp check`, `vp test` (35 tests), `vp build`, and `yarn build`.
- Deployed refactor commit `984e0d4` through CD run `28724069146`; Cloudflare Pages deployment passed.

## 2026-07-04 Single Control and 3D Simulation Plan

- [x] Confirm remaining inconsistency: labs still use canvas overlay controls and Mercury still uses the old side-tab `BaseSimulation` shell.
- [x] Extend the shared floating simulation layout enough to support every simulation route.
- [x] Replace all lab canvas visualizations with React Three Fiber 3D scenes and move every parameter into the shared right-side controls panel.
- [x] Migrate Mercury Precession from `BaseSimulation` to `FloatingSimulationLayout`.
- [x] Delete the now-unused `BaseSimulation` shell.
- [x] Run local validation, commit intended changes only, push, and verify CD deployment.

## 2026-07-04 Single Control and 3D Simulation Results

- All simulation routes now use the same `FloatingSimulationLayout` controls/info pattern.
- Lab simulations were converted from 2D canvas overlays to React Three Fiber 3D scenes with shared right-side parameter controls.
- Mercury Precession no longer uses the old side-tab `BaseSimulation`; that shell was removed.
- Local validation passed: `vp check`, `vp test` (35 tests), `vp build`, and `yarn build`.
- Deployed commit `c67f62b` through CD run `28726235727`; Cloudflare Pages deployment passed.
