import { useEffect, useState } from "react";
import type { Progress } from "../types";

interface KVStore {
  get: (k: string) => Promise<{ value: string } | null>;
  set: (k: string, v: string) => Promise<void>;
}

/* Persistence: prefer the artifact runtime's window.storage if present,
   otherwise fall back to localStorage. Both expose the same async
   get(key) -> { value } / set(key, value) shape. */
const STORE: KVStore | null =
  typeof window === "undefined"
    ? null
    : (window as unknown as { storage?: KVStore }).storage ||
      (window.localStorage
        ? {
            get: async (k) => {
              const v = window.localStorage.getItem(k);
              return v == null ? null : { value: v };
            },
            set: async (k, v) => {
              window.localStorage.setItem(k, v);
            },
          }
        : null);

const SAVE_KEY = "lglab:progress:v1";

export function useProgress() {
  const [solved, setSolved] = useState<Progress>({});
  const [loaded, setLoaded] = useState(false);

  /* load saved progress once on mount */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (STORE) {
        try {
          const r = await STORE.get(SAVE_KEY);
          if (!cancelled && r && r.value) {
            const parsed = JSON.parse(r.value);
            if (parsed && typeof parsed === "object") setSolved(parsed as Progress);
          }
        } catch {
          /* no saved progress yet — first run */
        }
      }
      if (!cancelled) setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* save whenever progress changes (after initial load) */
  useEffect(() => {
    if (!loaded || !STORE) return;
    (async () => {
      try {
        await STORE.set(SAVE_KEY, JSON.stringify(solved));
      } catch (e) {
        console.error("Logic Gate Lab: could not save progress", e);
      }
    })();
  }, [solved, loaded]);

  const resetProgress = () => setSolved({});

  return { solved, setSolved, loaded, resetProgress };
}
