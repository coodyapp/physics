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
