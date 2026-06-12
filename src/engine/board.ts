import type { Board, LevelDef, NodeData } from "../types";
import { VBH } from "./geometry";

/** Build a fresh board (inputs + a single output) for a level definition. */
export function buildBoard(def: LevelDef): Board {
  const ins = def.inputs;
  const n = ins.length;
  const nodes: NodeData[] = [];
  // Start inputs and the output close together so simple levels frame tightly
  // (see fitViewBox); the board still has room to the right as gates are added.
  ins.forEach((label, i) => {
    nodes.push({ id: "in" + i, type: "INPUT", label, x: 70, y: (VBH / (n + 1)) * (i + 1) - 22 });
  });
  nodes.push({ id: "out", type: "OUTPUT", label: "Q", x: 470, y: VBH / 2 - 22 });
  const inputValues: Record<string, boolean> = {};
  nodes.filter((nd) => nd.type === "INPUT").forEach((nd) => (inputValues[nd.id] = false));
  return { nodes, inputValues };
}
