import type { VerifyResult } from "../types";
import { btn, C } from "../theme";

export interface StatusBarProps {
  message: string;
  results: VerifyResult | null;
  gateCount: number;
  par: number;
  hasTarget: boolean;
  showNext: boolean;
  onNext: () => void;
}

export default function StatusBar({ message, results, gateCount, par, hasTarget, showNext, onNext }: StatusBarProps) {
  return (
    <div
      style={{
        marginTop: 10,
        display: "flex",
        gap: 12,
        alignItems: "center",
        background: results ? (results.allPass ? "#10301f" : "#301a22") : C.panel2,
        border: `1px solid ${results ? (results.allPass ? C.on : C.bad) : C.border}`,
        borderRadius: 10,
        padding: "10px 13px",
        fontSize: 13.5,
        flexWrap: "wrap",
      }}
    >
      <span style={{ color: results ? (results.allPass ? C.on : C.bad) : C.text }}>{message}</span>
      <div style={{ flex: 1 }} />
      <span style={{ color: C.muted, fontFamily: "ui-monospace, monospace", fontSize: 12 }}>
        gates: {gateCount}
        {hasTarget ? ` · par ${par}` : ""}
      </span>
      {showNext && (
        <button onClick={onNext} style={btn({ background: C.on, color: "#04241f", fontWeight: 700, borderColor: C.on })}>
          Next level →
        </button>
      )}
    </div>
  );
}
