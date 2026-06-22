/**
 * Dev-only switches.
 *
 * UNLOCK_ALL lets you jump to any level while developing locally. It's on by
 * default under `vite dev`; opt out with `VITE_UNLOCK_ALL=0 npm run dev` to
 * exercise the real lock progression. `import.meta.env.DEV` is false in
 * production builds, so this can never leak to the deployed app.
 */
export const UNLOCK_ALL = import.meta.env.DEV && import.meta.env.VITE_UNLOCK_ALL !== "0";
