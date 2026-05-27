/* ============================================================
   Shared domain types for Logic Gate Lab.
   ============================================================ */

export type GateType =
  | "INPUT"
  | "OUTPUT"
  | "NOT"
  | "AND"
  | "OR"
  | "XOR"
  | "NAND"
  | "NOR"
  | "XNOR";

/** A signal value on a wire or port: true (1), false (0), or null (unconnected). */
export type Signal = boolean | null;

/** A target Boolean function for a level, evaluated over the level's inputs. */
export type TargetFn = (...bits: boolean[]) => boolean;

export interface NodeData {
  id: string;
  type: GateType;
  label?: string;
  x: number;
  y: number;
}

export interface Wire {
  id: string;
  from: { node: string };
  to: { node: string; port: number };
}

export interface Pending {
  node: string;
  kind: "in" | "out";
  port: number;
}

export interface InputPort {
  x: number;
  y: number;
  idx: number;
}

export interface Ports {
  inputs: InputPort[];
  output: { x: number; y: number } | null;
  w: number;
  h: number;
}

export interface LevelDef {
  /** world id (chapter) */
  w: number;
  name: string;
  goal: string;
  par: number;
  inputs: string[];
  palette: GateType[];
  concept: string;
  target: TargetFn | null;
  irl?: string;
}

export interface World {
  id: number;
  name: string;
  tag: string;
  color: string;
}

export interface Board {
  nodes: NodeData[];
  inputValues: Record<string, boolean>;
}

/** Per-level progress: level index -> gate count of the solving circuit. */
export type Progress = Record<number, number>;

/** A row of the target truth table for the current level. */
export interface TruthRow {
  bits: number[];
  exp: boolean;
}

/** A verified row: the player's output vs. the expected output. */
export interface VerifyRow {
  bits: number[];
  out: Signal;
  exp: boolean;
  pass: boolean;
}

export interface VerifyResult {
  rows: VerifyRow[];
  allPass: boolean;
}
