import type { GateType } from "../types";
import { GATES } from "../engine/gates";
import { btn, C } from "../theme";

export interface ToolbarProps {
  palette: GateType[];
  showVerify: boolean;
  onAddGate: (t: GateType) => void;
  onClear: () => void;
  onReset: () => void;
  onVerify: () => void;
}

export default function Toolbar({ palette, showVerify, onAddGate, onClear, onReset, onVerify }: ToolbarProps) {
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
      <span style={{ color: C.faint, fontSize: 11, fontFamily: "ui-monospace, monospace", marginRight: 2 }}>
        GATES
      </span>
      {palette.map((t) => {
        const g = GATES[t];
        return (
          <button
            key={t}
            onClick={() => onAddGate(t)}
            style={btn({ borderColor: g.fam, display: "flex", alignItems: "center", gap: 6 })}
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
      {showVerify && (
        <button
          onClick={onVerify}
          style={btn({
            background: `linear-gradient(90deg, ${C.accent}, #2bb9d6)`,
            color: "#04241f",
            fontWeight: 700,
            borderColor: C.accent,
          })}
        >
          ▶ Verify
        </button>
      )}
    </div>
  );
}
