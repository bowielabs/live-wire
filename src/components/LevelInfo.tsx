import type { LevelDef } from "../types";
import { WORLDS } from "../data/levels";
import { btn, C } from "../theme";

export interface LevelInfoProps {
  def: LevelDef;
  levelIdx: number | "sandbox";
  /** when provided, show a pin/unpin control in the header */
  onTogglePin?: () => void;
  pinned?: boolean;
}

export default function LevelInfo({ def, levelIdx, onTogglePin, pinned }: LevelInfoProps) {
  const world = WORLDS.find((x) => x.id === def.w);
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 15 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        {world ? (
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: 1, color: world.color, marginBottom: 4 }}>
            WORLD {world.id} · {world.name.toUpperCase()}
          </div>
        ) : (
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: 1, color: C.faint, marginBottom: 4 }}>
            FREE PLAY
          </div>
        )}
        {onTogglePin && (
          <button
            onClick={onTogglePin}
            title={pinned ? "Unpin from the board" : "Pin beside the board"}
            style={btn({ padding: "3px 8px", fontSize: 11.5, marginTop: -4, ...(pinned ? { borderColor: C.accent, color: C.accent } : {}) })}
          >
            {pinned ? "📌 Unpin" : "📌 Pin"}
          </button>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 19 }}>{def.name}</h2>
        <span style={{ color: C.accent, fontFamily: "var(--font-mono)", fontSize: 12 }}>
          {typeof levelIdx === "number" ? `LV ${levelIdx + 1}/100` : "SANDBOX"}
        </span>
      </div>
      <div
        style={{
          marginTop: 7,
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          color: C.accent,
          background: C.panel2,
          border: `1px solid ${C.border}`,
          borderRadius: 7,
          padding: "6px 9px",
          display: "inline-block",
        }}
      >
        {def.goal}
      </div>
      <p style={{ color: C.muted, fontSize: 13.5, lineHeight: 1.6, marginBottom: 0 }}>{def.concept}</p>
      {def.irl && (
        <div
          style={{
            marginTop: 10,
            background: C.irlBg,
            border: `1px solid ${C.irlBorder}`,
            borderRadius: 8,
            padding: "8px 10px",
            fontSize: 12.5,
            color: C.irlText,
            lineHeight: 1.55,
          }}
        >
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: 1, color: C.irlLabel }}>
            ⚡ IN THE REAL WORLD
          </span>
          <div style={{ marginTop: 3 }}>{def.irl}</div>
        </div>
      )}
    </div>
  );
}
