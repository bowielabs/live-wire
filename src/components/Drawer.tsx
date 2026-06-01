import { useEffect, type ReactNode } from "react";
import { C } from "../theme";

export interface DrawerProps {
  side: "left" | "right";
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/**
 * A simple slide-in panel with a darkening backdrop. Close on backdrop click
 * or Escape. The panel itself owns its own scrolling.
 */
export default function Drawer({ side, open, onClose, title, children }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const hidden = side === "left" ? "translateX(-100%)" : "translateX(100%)";

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden={!open}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(2, 6, 16, 0.55)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 180ms ease",
          zIndex: 20,
        }}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        style={{
          position: "fixed",
          top: 0,
          bottom: 0,
          [side]: 0,
          width: "min(360px, 86vw)",
          background: C.panel,
          borderLeft: side === "right" ? `1px solid ${C.border}` : "none",
          borderRight: side === "left" ? `1px solid ${C.border}` : "none",
          transform: open ? "translateX(0)" : hidden,
          transition: "transform 220ms ease",
          zIndex: 21,
          display: "flex",
          flexDirection: "column",
          boxShadow: open ? "0 12px 36px rgba(0,0,0,0.4)" : "none",
        }}
      >
        {title && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 14px",
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            <strong style={{ color: C.text, fontSize: 14 }}>{title}</strong>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                background: "transparent",
                border: "none",
                color: C.muted,
                cursor: "pointer",
                fontSize: 20,
                lineHeight: 1,
                padding: "2px 6px",
                fontFamily: "inherit",
              }}
            >
              ×
            </button>
          </div>
        )}
        <div style={{ overflowY: "auto", padding: 12, flex: 1 }}>{children}</div>
      </aside>
    </>
  );
}
