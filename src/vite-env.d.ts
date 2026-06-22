/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Dev-only override: set to "0" to keep the real level-lock progression
      while running `vite dev` (levels are otherwise all unlocked locally). */
  readonly VITE_UNLOCK_ALL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
