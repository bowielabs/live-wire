import type { CSSProperties } from "react";
import type { Signal } from "./types";

/* ---- palette ---- */
export const C = {
  bg: "#070b15",
  canvas: "#0c1322",
  panel: "#111a2e",
  panel2: "#0e1626",
  border: "#243353",
  borderHi: "#33476f",
  text: "#dde6f7",
  muted: "#8294b6",
  faint: "#5d6e92",
  accent: "#3fe0c5",
  on: "#37e08b",
  off: "#34456b",
  nul: "#5b4f78",
  warn: "#f4a64d",
  bad: "#f2607a",
};

/** Map a signal value to its display colour. */
export const sigColor = (v: Signal): string =>
  v === true ? C.on : v === false ? C.off : C.nul;

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
