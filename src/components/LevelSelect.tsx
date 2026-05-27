import type { RefObject } from "react";
import type { Progress } from "../types";
import { LEVELS, WORLDS } from "../data/levels";
import { C } from "../theme";

export interface LevelSelectProps {
  solved: Progress;
  levelIdx: number | "sandbox";
  activeRef: RefObject<HTMLButtonElement>;
  onSelect: (idx: number | "sandbox") => void;
  onResetProgress: () => void;
}

export default function LevelSelect({ solved, levelIdx, activeRef, onSelect, onResetProgress }: LevelSelectProps) {
  const unlocked = (i: number) => i === 0 || i in solved || i - 1 in solved;
  const starsFor = (i: number) => (!(i in solved) ? 0 : solved[i] <= LEVELS[i].par ? 2 : 1);

  return (
    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 15 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 9 }}>
        <h3 style={{ margin: 0, fontSize: 14 }}>
          Levels{" "}
          <span style={{ color: C.faint, fontFamily: "ui-monospace, monospace", fontSize: 11 }}>
            {Object.keys(solved).length}/{LEVELS.length} solved
          </span>
        </h3>
        {Object.keys(solved).length > 0 && (
          <button
            onClick={onResetProgress}
            style={{
              background: "transparent",
              border: "none",
              color: C.faint,
              fontSize: 11,
              cursor: "pointer",
              fontFamily: "ui-monospace, monospace",
              textDecoration: "underline",
            }}
          >
            reset progress
          </button>
        )}
      </div>
      <div style={{ maxHeight: 440, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4, paddingRight: 4 }}>
        {WORLDS.map((world) => {
          const items = LEVELS.map((lvl, i) => ({ lvl, i })).filter((x) => x.lvl.w === world.id);
          const done = items.filter((x) => x.i in solved).length;
          return (
            <div key={world.id} style={{ marginBottom: 2 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 6,
                  padding: "7px 4px 4px",
                  position: "sticky",
                  top: 0,
                  background: C.panel,
                  zIndex: 1,
                }}
              >
                <span style={{ color: world.color, fontWeight: 700, fontSize: 12.5 }}>
                  {world.id}. {world.name}
                </span>
                <span style={{ color: C.faint, fontSize: 10.5, fontFamily: "ui-monospace, monospace" }}>{done}/10</span>
                <span style={{ flex: 1 }} />
                <span style={{ color: C.faint, fontSize: 10, fontStyle: "italic" }}>{world.tag}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {items.map(({ lvl, i }) => {
                  const open = unlocked(i);
                  const st = starsFor(i);
                  const active = levelIdx === i;
                  const isDone = i in solved;
                  return (
                    <button
                      key={i}
                      ref={active ? activeRef : null}
                      disabled={!open}
                      onClick={() => onSelect(i)}
                      style={{
                        textAlign: "left",
                        background: active ? "#1a2c44" : C.panel2,
                        color: open ? C.text : C.faint,
                        border: `1px solid ${active ? C.accent : isDone ? "#2c4a38" : C.border}`,
                        borderRadius: 8,
                        padding: "7px 9px",
                        cursor: open ? "pointer" : "not-allowed",
                        fontFamily: "inherit",
                        fontSize: 12.5,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        opacity: open ? 1 : 0.55,
                      }}
                    >
                      <span style={{ fontFamily: "ui-monospace, monospace", color: world.color, fontSize: 10.5, width: 22 }}>
                        {String(i + 1).padStart(3, "0")}
                      </span>
                      <span style={{ flex: 1 }}>{open ? lvl.name : "🔒 Locked"}</span>
                      {isDone && st === 0 && <span style={{ color: C.on, fontSize: 11 }}>✓</span>}
                      <span style={{ color: C.warn, letterSpacing: 1, fontSize: 11 }}>
                        {st === 2 ? "★★" : st === 1 ? "★" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <button
        onClick={() => onSelect("sandbox")}
        style={{
          marginTop: 8,
          width: "100%",
          textAlign: "left",
          background: levelIdx === "sandbox" ? "#1a2c44" : C.panel2,
          color: C.text,
          border: `1px solid ${levelIdx === "sandbox" ? C.accent : C.border}`,
          borderRadius: 8,
          padding: "8px 10px",
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: 13,
        }}
      >
        ⚙ Sandbox — all gates, free play
      </button>
    </div>
  );
}
