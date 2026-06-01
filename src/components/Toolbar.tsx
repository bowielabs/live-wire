import type { GateType } from "../types";
import { GATES } from "../engine/gates";
import { btn, C } from "../theme";
import { GATE_DRAG_KEY } from "./CircuitCanvas";

export interface ToolbarProps {
  palette: GateType[];
  onAddGate: (t: GateType) => void;
  onClear: () => void;
  onReset: () => void;
}

export default function Toolbar({ palette, onAddGate, onClear, onReset }: ToolbarProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: 7,
        flexWrap: "wrap",
        alignItems: "center",
        background: C.panel2,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: 9,
        marginBottom: 10,
      }}
    >
      <span style={{ color: C.faint, fontSize: 11, fontFamily: "var(--font-mono)", marginRight: 2 }}>
        GATES
      </span>
      {palette.map((t) => {
        const g = GATES[t];
        return (
          <button
            key={t}
            onClick={() => onAddGate(t)}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = "copy";
              e.dataTransfer.setData(GATE_DRAG_KEY, t);
            }}
            title={`${g.name} — click to place, or drag onto the canvas`}
            style={btn({ borderColor: g.fam, display: "flex", alignItems: "center", gap: 6, cursor: "grab" })}
          >
            <span style={{ color: g.fam, fontWeight: 700, fontSize: 14 }}>{g.sym}</span>
            <span>{g.name}</span>
          </button>
        );
      })}
      <div style={{ flex: 1 }} />
      <button onClick={onClear} style={btn()}>
        Clear
      </button>
      <button onClick={onReset} style={btn()}>
        Reset
      </button>
    </div>
  );
}
