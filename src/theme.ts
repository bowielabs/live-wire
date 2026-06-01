import type { CSSProperties } from "react";
import type { Signal } from "./types";

/* ---- palette ----
   Each entry resolves to a CSS custom property defined in src/index.css,
   so the active theme (data-theme="dark" | "light") swaps every reference
   without any component knowing which mode it's in.                    */
export const C = {
  bg:          "var(--c-bg)",
  canvas:      "var(--c-canvas)",
  panel:       "var(--c-panel)",
  panel2:      "var(--c-panel2)",
  border:      "var(--c-border)",
  borderHi:    "var(--c-border-hi)",
  text:        "var(--c-text)",
  muted:       "var(--c-muted)",
  faint:       "var(--c-faint)",
  accent:      "var(--c-accent)",
  on:          "var(--c-on)",
  off:         "var(--c-off)",
  nul:         "var(--c-nul)",
  warn:        "var(--c-warn)",
  bad:         "var(--c-bad)",

  /* semantic / surface tokens */
  appGradStart:   "var(--c-app-grad-start)",
  h1GradEnd:      "var(--c-h1-grad-end)",
  verifyGradEnd:  "var(--c-verify-grad-end)",
  gridDot:        "var(--c-grid-dot)",
  gateBody:       "var(--c-gate-body)",
  portRing:       "var(--c-port-ring)",
  glowOn:         "var(--c-glow-on)",
  glowOnStrong:   "var(--c-glow-on-strong)",
  glowOnSoft:     "var(--c-glow-on-soft)",
  glowOnWire:     "var(--c-glow-on-wire)",
  inputOnBg:      "var(--c-input-on-bg)",
  inputOffBg:     "var(--c-input-off-bg)",
  outputBg:       "var(--c-output-bg)",
  outputOnStroke: "var(--c-output-on-stroke)",
  outputOffFill:  "var(--c-output-off-fill)",
  outputNullFill: "var(--c-output-null-fill)",
  statusOkBg:     "var(--c-status-ok-bg)",
  statusFailBg:   "var(--c-status-fail-bg)",
  irlBg:          "var(--c-irl-bg)",
  irlBorder:      "var(--c-irl-border)",
  irlText:        "var(--c-irl-text)",
  irlLabel:       "var(--c-irl-label)",
  rowActiveBg:    "var(--c-row-active-bg)",
  levelActiveBg:  "var(--c-level-active-bg)",
  levelDoneBorder:"var(--c-level-done-border)",
  onAccentInk:    "var(--c-on-accent-ink)",
};

/** Map a signal value to its display colour. */
export const sigColor = (v: Signal): string =>
  v === true ? C.on : v === false ? C.off : C.nul;

/** Colour-blind-safe wire styling. Shape (stroke pattern) carries the
    signal as well as colour, so monochrome viewers can still tell the
    three states apart: solid = 1, dashed = 0, dotted = unconnected.   */
export interface WireStyle {
  stroke: string;
  strokeWidth: number;
  strokeDasharray: string | undefined;
  opacity: number;
  glow: boolean;
}
export const wireStyle = (v: Signal): WireStyle => {
  if (v === true)  return { stroke: C.on,  strokeWidth: 3.2, strokeDasharray: undefined, opacity: 1,    glow: true };
  if (v === false) return { stroke: C.off, strokeWidth: 2.2, strokeDasharray: "5 4",     opacity: 0.9,  glow: false };
  return                  { stroke: C.nul, strokeWidth: 1.8, strokeDasharray: "1.5 4",   opacity: 0.7,  glow: false };
};

/** Shared base style for toolbar / control buttons. */
export const btn = (extra: CSSProperties = {}): CSSProperties => ({
  background: C.panel,
  color: C.text,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  padding: "7px 12px",
  fontSize: 12.5,
  fontFamily: "ui-monospace, Menlo, monospace",
  cursor: "pointer",
  ...extra,
});
