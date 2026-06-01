/* ============================================================
   Procedural sound effects via the Web Audio API.

   We generate every sound from oscillators on the fly so there are
   no audio assets in the bundle and no licensing concerns. The
   AudioContext is created lazily on first play (which is always
   inside a user gesture, so autoplay policies are satisfied).
   ============================================================ */

export type SoundName = "gate-place" | "wire-connect" | "success" | "fail";

const STORAGE_KEY = "gw:muted";

let ctx: AudioContext | null = null;
let muted = ((): boolean => {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
})();
const listeners = new Set<() => void>();

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC: typeof AudioContext | undefined =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch {
      ctx = null;
      return null;
    }
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

/** One short tone with an exponential decay envelope. */
function tone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  peak = 0.07,
  freqEnd?: number
): void {
  const c = ensureCtx();
  if (!c) return;
  const t0 = c.currentTime;
  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), t0 + duration);
  }
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export function play(name: SoundName): void {
  if (muted) return;
  switch (name) {
    case "gate-place":
      tone(220, 0.08, "triangle", 0.06);
      break;
    case "wire-connect":
      tone(440, 0.1, "sine", 0.07, 660);
      break;
    case "success":
      tone(523.25, 0.14, "triangle", 0.08); // C5
      window.setTimeout(() => tone(659.25, 0.14, "triangle", 0.08), 80); // E5
      window.setTimeout(() => tone(783.99, 0.22, "triangle", 0.09), 170); // G5
      break;
    case "fail":
      tone(220, 0.2, "sawtooth", 0.05, 130);
      break;
  }
}

export const isMuted = () => muted;

export function setMuted(value: boolean): void {
  if (muted === value) return;
  muted = value;
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export const toggleMuted = (): void => setMuted(!muted);

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
