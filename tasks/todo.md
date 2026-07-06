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

## 2026-07-04 Homepage Simulation Wave Text Plan

- [x] Replace scientist-name hero rotation with names sourced from the available simulation routes.
- [x] Replace the sphere-backed text treatment with a no-sphere animated wave-line background behind regular text.
- [x] Remove the glitter and sphere WebGL background layers.
- [x] Provide static text when WebGL is unavailable or motion is reduced.
- [x] Run local validation and record results.

## 2026-07-04 Homepage Simulation Wave Text Results

- Homepage hero and carousel now use available simulation titles from direct simulation routes plus `LAB_SIMULATIONS`.
- Homepage hero now uses available simulation titles from direct simulation routes plus `LAB_SIMULATIONS`; the horizontal marquee keeps scrolling scientist names.
- Simulation names render as normal foreground text while a lightweight WebGL shader draws larger animated wave lines behind the text.
- Removed the old glitch text, glitter background, sphere background, and unused WebGL background wrapper.
- Validation passed: `vp check`, `vp test` (35 tests), and `vp build`.

## 2026-07-05 Simulation Review and Camera Plan

- [x] Audit every routed simulation and shared physics helper for concrete physics or implementation problems.
- [x] Add a shared 2D/3D camera selector and view-direction selector so every simulation gets the same controls.
- [x] Fix high-confidence simulation issues without changing route structure or unrelated UI.
- [x] Add or update regression tests for corrected physics behavior where practical.
- [x] Run `vp check`, `vp test`, and `vp build`, then record results.

## 2026-07-05 Review Notes

- All simulation routes currently flow through `FloatingSimulationLayout`, directly or through `LabSimulationLayout`, so global camera controls belong in the shared layout/renderer path.
- Confirmed issues to fix in this pass: Mercury uses only the first half-step of velocity Verlet, Mercury reset can leave extra bodies in scene state, EM wave E and B curves are out of phase, gravitational-wave frequency should be separated from orbital frequency, several controls have no or truncated effect, and electric-field lines do not use Coulomb superposition.

## 2026-07-05 Simulation Review Results

- Added shared camera controls to every simulation: perspective 3D, orthographic 2D, and selectable isometric/XY/XZ/YZ view directions.
- Fixed Mercury's orbit integration to use the full velocity-Verlet velocity update, and reset now reinitializes scene bodies.
- Fixed simulation correctness issues: Coulomb-superposed electric field lines, speed-scaled charged-particle gyro-radius, in-phase EM E/B waves, flattening heat diffusion, full ideal-gas particle count, meaningful Boltzmann density-of-states control, actual tunneling reset, wave-packet potential scattering, central-mass visual scaling, and GW frequency = 2x orbital frequency.
- Added a Mercury integrator regression test.
- Validation passed: `vp check`, `vp test` (36 tests), and `vp build`.

## 2026-07-05 Simulation Navigation Cleanup Plan

- [x] Keep the in-page Navigator scoped to lab groups and out of Relativity standalone simulations.
- [x] Add previous and next simulation controls to the floating header.
- [x] Remove the simulation-page Powered by Coody footer while leaving the homepage footer intact.
- [x] Run `vp check`, `vp test`, and `vp build`, then record results.

## 2026-07-05 Simulation Navigation Cleanup Results

- The floating header now has previous and next arrow buttons that cycle through standalone Relativity simulations and lab simulations in menu order.
- The in-page Navigator remains scoped to lab categories, so standalone Relativity simulations do not render it.
- Simulation pages no longer mount the Powered by Coody footer, and the unused simulation footer component was removed; the homepage footer remains in `src/home.tsx`.
- Validation passed: `vp install` completed with existing peer warnings, `vp check`, `vp test` (36 tests), and `vp build`.

## 2026-07-05 Code Analysis Plan

- [x] Inspect configured validation commands and current worktree context.
- [x] Run `vp install`, `vp check`, `vp test`, and `vp build`.
- [x] Review core physics and simulation source for concrete bugs not caught by automated checks.
- [x] Record findings, validation output, and recommended fixes.

## 2026-07-05 Code Analysis Results

- Initial validation passed: `vp install` completed with existing peer warnings, `vp check`, `vp test` (36 tests), and `vp build`.
- Fixed reviewed bugs: binary gravitational-wave helper now uses dominant GW frequency at `2 * orbitalFrequency`, time dilation returns `0` at/inside the horizon, Christoffel symbols preserve lower-index symmetry, crossed-field drift uses `E / B`, tunneling transmission responds to barrier height, zero-amplitude wave colors avoid `NaN`, and Mercury body count resets when controls recreate the scene.
- Added regression coverage for doubled GW oscillation, horizon time dilation, and Christoffel lower-index symmetry.
- Final validation passed: `vp check`, `vp test` (37 tests), and `vp build`.

## 2026-07-05 Simulation Chrome Alignment Plan

- [x] Render the floating header from the shared simulation layout so global view controls can use the layout's camera/grid state directly.
- [x] Reorder the header so Home is icon-only, the theme toggle sits immediately after it, and camera/view/grid/axis controls sit next in compact icon-only form.
- [x] Remove camera/view/grid/axis controls and the visible duplicate title from the right controls panel.
- [x] Anchor the left and right panels under the header, make their chrome transparent with backdrop blur, and switch collapse handles to upward/downward behavior.
- [x] Run `vp check`, `vp test`, and `vp build`, then record results.

## 2026-07-05 Simulation Chrome Alignment Results

- Floating simulation chrome now renders from `FloatingSimulationLayout`, with Home, theme, camera mode, view direction, grid, and axis controls grouped in the header.
- The right controls panel now omits the visible duplicate title and contains only simulation-specific parameters.
- Left and right panels are top-anchored below the header, use translucent blurred surfaces, and collapse via up/down handles.
- Lab route metadata was extracted to `src/simulations/physics-labs-data.ts` to avoid a header/layout circular import while keeping navigation labels shared.
- Validation passed: `vp check`, `vp test` (37 tests), and `vp build`.

## 2026-07-05 Header Panel Toggle Plan

- [x] Move left Information and right Controls open state into the shared floating simulation layout.
- [x] Add header icon buttons for Information and Settings panel toggles, separated from navigation and camera controls.
- [x] Remove the view-direction dropdown and make the view direction control cycle directly as an icon-only button.
- [x] Place previous and next simulation buttons side by side after the simulation selector.
- [x] Run `vp check`, `vp test`, and `vp build`, then record results.

## 2026-07-05 Physics Visualization Redesign Plan

- [x] Inspect screenshots and current implementations for Heat Diffusion Plate, Boltzmann Energy Distribution, and 2D Schrodinger Wave Packet.
- [x] Replace heat diffusion tiles with a continuous temperature field: height/color = temperature, contour rings = isotherms, center marker = heat source, square frame = cold boundary.
- [x] Replace Boltzmann blocks with a normalized smooth probability-density curve, filled occupancy area, sampled particle ensemble, and mean-energy marker.
- [x] Replace Schrodinger cuboids with a smooth `|psi|^2` surface, phase coloring, density contours, explicit square boundary, and circular potential barrier.
- [x] Run `vp check`, `vp test`, and `vp build`, then commit, push, and release.

## 2026-07-05 Physics Visualization Redesign Results

- Heat Diffusion Plate now uses a smooth field surface where height and color both represent temperature, with isotherm contours, a central source, and a cold boundary frame.
- Boltzmann Energy Distribution now uses a normalized density curve, probability fill, sampled occupancy particles, and a mean-energy marker instead of staircase blocks.
- 2D Schrodinger Wave Packet now uses a smooth `|psi|^2` surface, phase hue, density contours, square boundary, and circular potential barrier with reflected/transmitted packet behavior.
- Header panels are toggled from Information and Settings icons in the header; previous and next simulation controls are adjacent, and the view-direction dropdown was replaced by an icon-only cycle control.
- Local validation passed: `vp check`, `vp test` (37 tests), and `vp build`.
