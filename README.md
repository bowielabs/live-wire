<p align="center">
  <img src="https://raw.githubusercontent.com/bowielabs/live-wire/main/public/og-image.png" alt="Live Wire — wire the gates, light up the signals. 100 levels of logic-circuit puzzles." />
</p>

# Live Wire

**▶ Play it live: [live-wire.pages.dev](https://live-wire.pages.dev/)**

A 100-level discrete-mathematics puzzle game. Wire IEC-notation logic gates on
a canvas to satisfy a target Boolean function, then verify your circuit against
every row of its truth table. Built with React, TypeScript, and Vite.

- **100 levels across 10 themed worlds** — from the humble inverter to a
  NAND-only 2-bit adder.
- **Live simulation** — signals propagate as you wire, with tri-state
  (unconnected) values shown distinctly.
- **Truth-table verification**, par scoring, gated progression, and a free-play
  sandbox.
- **Progress is saved locally** in your browser (`localStorage`).
- **Shareable circuits** — any board state can be encoded into a `#share=…` URL fragment; opening the link restores the exact gates, wires, and input toggles.
- **Installable PWA, offline-capable** — manifest + service worker precache every built asset; once visited, the game runs without a network connection.

---

## Requirements

- **Node.js ≥ 18** (developed on Node 25)
- **npm** (ships with Node)

Check your versions:

```bash
node --version
npm --version
```

## Install

```bash
git clone https://github.com/bowielabs/live-wire.git
cd live-wire
npm install
```

## Run in development

```bash
npm run dev
```

Vite prints a local URL (default `http://localhost:5173`). Open it in a browser.
The dev server has hot-module reload, so edits appear instantly.

## Build for production

```bash
npm run build
```

This type-checks the project (`tsc --noEmit`) and then emits an optimized static
bundle to `dist/`. Preview the built output locally with:

```bash
npm run preview
```

## Test

```bash
npm test          # run the suite once
npm run test:watch # re-run on change
```

The suite (Vitest) covers the simulation engine and includes a meta-test that
proves **every one of the 100 levels is realizable with its allowed gate
palette** — see [Testing](#testing) below.

## Type-check only

```bash
npm run typecheck
```

---

## npm scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Type-check, then build the static bundle to `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run typecheck` | `tsc --noEmit` (no build) |

## Project structure

```
src/
  types.ts            Shared domain types (GateType, Signal, NodeData, Wire, LevelDef, …)
  theme.ts            Colour palette and shared style helpers
  engine/             Framework-agnostic core (no React) — unit tested
    gates.ts          Gate definitions + cnt/num helpers
    geometry.ts       Canvas dimensions, port positions, wire paths
    simulate.ts       Combinational simulation + cycle detection
    board.ts          Fresh-board construction for a level
  data/
    levels.ts         The 100 levels, 10 worlds, and sandbox definition
  hooks/
    useProgress.ts    localStorage-backed progress persistence
    useCircuit.ts     Editable board state + all pointer interactions
  components/         Presentational React components (Canvas, Toolbar, panels, …)
  App.tsx             Top-level orchestrator
  main.tsx            React entry point
```

The `engine/` and `data/` modules have no React dependency and are imported
directly by the tests.

## How to play

- Add gates from the toolbar.
- Click an **output port**, then an **input port**, to draw a wire.
- Click a wire to cut it; click the **×** on a gate to delete it.
- Click an input box to flip its bit (0/1). Signals light up green for 1.
- Gate symbols use IEC 60617 notation (`&` = AND, `≥1` = OR, `=1` = XOR); a
  bubble on the output means it is negated (NAND/NOR/XNOR/NOT).
- Hit **Verify** to test your circuit against every row of the truth table.

Gate definitions and level data live in `src/engine/gates.ts` and
`src/data/levels.ts` if you want to add or tweak content.

## Testing

Tests live next to the code they cover as `*.test.ts` and run under Vitest in a
Node environment.

- **Engine unit tests** — gate truth tables, `simulate` (gates, fan-out,
  tri-state, chained gates, output passthrough), cycle detection, geometry, and
  board construction.
- **Level meta-test** — validates dataset integrity (100 levels, 10 worlds ×
  10, well-formed fields, total boolean-valued targets) and **proves each level
  is solvable** with its allowed gates. It uses Post's functional-completeness
  criterion to short-circuit universal palettes (e.g. `{NAND}`,
  `{AND,OR,NOT}`) and computes the gate-clone closure to check membership for
  non-universal palettes. Negative controls confirm the solver correctly
  rejects impossible levels.

> Note: the meta-test proves solvability, not that each hand-authored `par`
> (target gate count) is the exact minimum — exact minimum-circuit size with
> fan-out sharing is NP-hard and intentionally out of scope.

## Deployment

The build produces a fully static site in `dist/`, so it can be hosted on any
static host or CDN. No server or environment variables are needed at runtime —
progress is stored client-side.

### Cloudflare Pages via GitHub Actions (configured)

This repo ships a CI workflow at
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) that, on every
push to `main` (and on pull requests), installs dependencies, runs the test
suite, builds, and deploys to Cloudflare Pages with
[`wrangler-action`](https://github.com/cloudflare/wrangler-action). The project
name (`live-wire`) and output directory (`dist`) come from
[`wrangler.toml`](wrangler.toml). Pushes to `main` publish the production
deployment; PRs and other branches get preview deployments.

**One-time setup:**

1. **Create a Cloudflare API token** with the **"Cloudflare Pages — Edit"**
   permission (Cloudflare dashboard → My Profile → API Tokens).
2. **Find your Account ID** (Cloudflare dashboard → Workers & Pages → right
   sidebar, or any account URL).
3. **Add two GitHub repo secrets** (Settings → Secrets and variables → Actions):
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

That's it — the workflow itself runs `wrangler pages project create live-wire`
on every deploy (idempotently), so the very first push to `main` after the
secrets are in place will create the Pages project and ship the build to it.
Response caching and security headers are configured in
[`public/_headers`](public/_headers).

### Any static host

Run `npm run build` and serve the contents of `dist/` (e.g. S3 + CloudFront,
nginx, Caddy, GitHub Pages). If hosting under a sub-path rather than a domain
root, set Vite's [`base`](https://vite.dev/config/shared-options.html#base)
option in `vite.config.js`.

## Tech stack

- [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite 6](https://vite.dev/) for dev/build
- [Vitest](https://vitest.dev/) for testing
- SVG for the circuit canvas (no game-engine dependency)
