import { useMemo } from "react";

export interface ConfettiProps {
  /** Increment to retrigger a burst. Value 0 means no burst yet. */
  token: number;
}

const COLORS = ["#37e08b", "#3fe0c5", "#9d8bf2", "#f4b03f", "#f278b0", "#5fd3f0"];
const COUNT = 28;

/** A brief celebratory burst centered on the viewport. Pure CSS animation. */
export default function Confetti({ token }: ConfettiProps) {
  const parts = useMemo(() => {
    if (!token) return [];
    return Array.from({ length: COUNT }, (_, i) => {
      const angle = (i / COUNT) * Math.PI * 2 + Math.random() * 0.4;
      const distance = 120 + Math.random() * 140;
      return {
        dx: Math.cos(angle) * distance,
        dy: Math.sin(angle) * distance,
        color: COLORS[i % COLORS.length],
        duration: 900 + Math.random() * 500,
        delay: Math.random() * 90,
        rotate: 360 + Math.random() * 540,
      };
    });
  }, [token]);

  if (!token) return null;

  return (
    <div
      key={token}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 30,
      }}
    >
      {parts.map((p, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 7,
            height: 12,
            background: p.color,
            borderRadius: 1.5,
            opacity: 1,
            transform: "translate(-50%, -50%)",
            animation: `gw-confetti ${p.duration}ms ease-out ${p.delay}ms forwards`,
            ["--dx" as unknown as string]: `${p.dx}px`,
            ["--dy" as unknown as string]: `${p.dy}px`,
            ["--rot" as unknown as string]: `${p.rotate}deg`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
