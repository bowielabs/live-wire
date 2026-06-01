import type { Theme } from "../hooks/useTheme";
import { C } from "../theme";

export interface AppBarProps {
  levelLabel: string;
  theme: Theme;
  muted: boolean;
  onToggleTheme: () => void;
  onToggleMute: () => void;
  onOpenLevels: () => void;
  onOpenInfo: () => void;
}

const iconBtn = {
  background: "transparent",
  color: C.text,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  width: 34,
  height: 34,
  cursor: "pointer",
  fontSize: 15,
  lineHeight: "30px",
  padding: 0,
  fontFamily: "inherit",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
} as const;

/** A compact derivative of the favicon for in-app use — same gate silhouette,
    no gradient background so it sits cleanly on the AppBar panel. */
function GateMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
      <rect x="9" y="9" width="14" height="14" rx="2.5" fill={C.accent} />
      <rect x="9" y="9" width="14" height="2.5" fill="rgba(12,19,34,0.45)" />
      <circle cx="5" cy="12" r="1.7" fill={C.on} />
      <circle cx="5" cy="20" r="1.7" fill={C.on} />
      <circle cx="27" cy="16" r="1.7" fill={C.on} />
    </svg>
  );
}

export default function AppBar({
  levelLabel,
  theme,
  muted,
  onToggleTheme,
  onToggleMute,
  onOpenLevels,
  onOpenInfo,
}: AppBarProps) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
        padding: "10px 12px",
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        marginBottom: 10,
      }}
    >
      <button
        onClick={onOpenLevels}
        aria-label="Open levels"
        title="Levels"
        style={iconBtn}
      >
        ☰
      </button>

      <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <GateMark />
        <h1
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 600,
            color: C.text,
            letterSpacing: "-0.01em",
            lineHeight: 1,
          }}
        >
          Live Wire
        </h1>
      </div>

      <button
        onClick={onOpenInfo}
        title="Level info"
        style={{
          background: "transparent",
          color: C.muted,
          border: `1px solid ${C.border}`,
          borderRadius: 999,
          padding: "5px 10px",
          cursor: "pointer",
          fontSize: 11.5,
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.02em",
          maxWidth: "60vw",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {levelLabel}
      </button>

      <div style={{ flex: 1 }} />

      <button
        onClick={onToggleMute}
        aria-label={muted ? "Unmute sound effects" : "Mute sound effects"}
        title={muted ? "Unmute" : "Mute"}
        style={iconBtn}
      >
        {muted ? "🔇" : "🔊"}
      </button>
      <button
        onClick={onToggleTheme}
        aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        title={theme === "dark" ? "Light mode" : "Dark mode"}
        style={iconBtn}
      >
        {theme === "dark" ? "☾" : "☀"}
      </button>
    </header>
  );
}
