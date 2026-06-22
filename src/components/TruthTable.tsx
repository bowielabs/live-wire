import { useMemo } from "react";
import type { LevelDef, TruthRow, VerifyResult } from "../types";
import { btn, C } from "../theme";

export interface TruthTableProps {
  def: LevelDef;
  results: VerifyResult | null;
  /** index of the row matching the current input toggles */
  currentRow: number;
  /** when provided, show a pin/unpin control in the header */
  onTogglePin?: () => void;
  pinned?: boolean;
}

export default function TruthTable({ def, results, currentRow, onTogglePin, pinned }: TruthTableProps) {
  const truth = useMemo<TruthRow[] | null>(() => {
    if (!def.target) return null;
    const n = def.inputs.length;
    const rows: TruthRow[] = [];
    for (let m = 0; m < 1 << n; m++) {
      const bits: number[] = [];
      for (let i = 0; i < n; i++) bits.push((m >> (n - 1 - i)) & 1);
      rows.push({ bits, exp: !!def.target(...bits.map(Boolean)) });
    }
    return rows;
  }, [def]);

  if (!truth) return null;

  return (
    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 15 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
        <h3 style={{ margin: 0, fontSize: 14, color: C.text }}>Truth Table</h3>
        {onTogglePin && (
          <button
            onClick={onTogglePin}
            title={pinned ? "Unpin from the board" : "Pin beside the board to watch live"}
            style={btn({ padding: "3px 8px", fontSize: 11.5, ...(pinned ? { borderColor: C.accent, color: C.accent } : {}) })}
          >
            {pinned ? "📌 Unpin" : "📌 Pin"}
          </button>
        )}
      </div>
      <div style={{ maxHeight: 270, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-mono)", fontSize: 13 }}>
          <thead>
            <tr style={{ color: C.faint }}>
              {def.inputs.map((l) => (
                <th key={l} style={{ padding: "4px 6px", textAlign: "center", fontWeight: 400 }}>{l}</th>
              ))}
              <th style={{ padding: "4px 6px", color: C.accent }}>Q*</th>
              {results && <th style={{ padding: "4px 6px" }}>You</th>}
            </tr>
          </thead>
          <tbody>
            {truth.map((r, i) => {
              const here = i === currentRow;
              const res = results && results.rows[i];
              return (
                <tr key={i} style={{ background: here ? C.rowActiveBg : "transparent", outline: here ? `1px solid ${C.accent}` : "none" }}>
                  {r.bits.map((b, j) => (
                    <td key={j} style={{ padding: "4px 6px", textAlign: "center", color: b ? C.on : C.faint, borderTop: `1px solid ${C.panel2}` }}>
                      {b}
                    </td>
                  ))}
                  <td style={{ padding: "4px 6px", textAlign: "center", color: r.exp ? C.on : C.faint, borderTop: `1px solid ${C.panel2}` }}>
                    {r.exp ? 1 : 0}
                  </td>
                  {results && res && (
                    <td style={{ padding: "4px 6px", textAlign: "center", borderTop: `1px solid ${C.panel2}`, color: res.pass ? C.on : C.bad, fontWeight: 700 }}>
                      {res.out === null || res.out === undefined ? "—" : res.out ? 1 : 0}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ color: C.faint, fontSize: 11, marginTop: 7 }}>
        Highlighted row = current input toggles. Q* is the target.
      </div>
    </div>
  );
}
