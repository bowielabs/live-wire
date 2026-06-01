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
  width: 36,
  height: 36,
  cursor: "pointer",
  fontSize: 16,
  lineHeight: "30px",
  padding: 0,
  fontFamily: "inherit",
} as const;

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
      <button onClick={onOpenLevels} aria-label="Open levels" title="Levels" style={iconBtn}>
        ☰
      </button>
      <h1
        className="gw-app-title"
        style={{
          margin: 0,
          fontSize: 19,
          fontWeight: 700,
          background: `linear-gradient(90deg, ${C.accent}, ${C.h1GradEnd})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: 0.4,
        }}
      >
        Wirecraft
      </h1>
      <button
        onClick={onOpenInfo}
        title="Level info"
        style={{
          background: C.panel2,
          color: C.text,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          padding: "6px 10px",
          cursor: "pointer",
          fontSize: 12.5,
          fontFamily: "ui-monospace, Menlo, monospace",
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
