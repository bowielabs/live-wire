import type { VerifyResult } from "../types";
import { btn, C } from "../theme";

export interface BottomBarProps {
  message: string;
  results: VerifyResult | null;
  gateCount: number;
  par: number;
  minGates?: number;
  hasTarget: boolean;
  pinnedTruth: boolean;
  showNext: boolean;
  onToggleTruth: () => void;
  onTogglePinTruth: () => void;
  onVerify: () => void;
  onNext: () => void;
}

export default function BottomBar({
  message,
  results,
  gateCount,
  par,
  minGates,
  hasTarget,
  pinnedTruth,
  showNext,
  onToggleTruth,
  onTogglePinTruth,
  onVerify,
  onNext,
}: BottomBarProps) {
  return (
    <div
      style={{
        marginTop: 10,
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
        background: results ? (results.allPass ? C.statusOkBg : C.statusFailBg) : C.panel2,
        border: `1px solid ${results ? (results.allPass ? C.on : C.bad) : C.border}`,
        borderRadius: 12,
        padding: "10px 13px",
        fontSize: 13.5,
      }}
    >
      <span style={{ color: results ? (results.allPass ? C.on : C.bad) : C.text, flex: "1 1 200px" }}>
        {message}
      </span>
      <span style={{ color: C.muted, fontFamily: "var(--font-mono)", fontSize: 12 }}>
        gates: {gateCount}
        {hasTarget ? ` · par ${par}` : ""}
        {minGates ? ` · prove with ≥${minGates}` : ""}
      </span>
      {hasTarget && (
        <button onClick={onToggleTruth} title="Open truth table" style={btn()}>
          ≣ Truth
        </button>
      )}
      {hasTarget && (
        <button
          onClick={onTogglePinTruth}
          title={pinnedTruth ? "Unpin the truth table" : "Pin the truth table beside the board"}
          style={btn(pinnedTruth ? { borderColor: C.accent, color: C.accent } : {})}
        >
          📌 {pinnedTruth ? "Pinned" : "Pin"}
        </button>
      )}
      {hasTarget && (
        <button
          onClick={onVerify}
          style={btn({
            background: C.accent,
            color: C.onAccentInk,
            fontWeight: 700,
            borderColor: C.accent,
          })}
        >
          ▶ Verify
        </button>
      )}
      {showNext && (
        <button
          onClick={onNext}
          style={btn({ background: C.on, color: C.onAccentInk, fontWeight: 700, borderColor: C.on })}
        >
          Next level →
        </button>
      )}
    </div>
  );
}
