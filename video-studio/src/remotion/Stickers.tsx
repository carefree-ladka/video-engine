import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { FONT } from "./fonts";
import { EASING } from "./motion";

// Playful editorial accents (capsule pills, dots, a star, a rotated sticky note)
// scattered near the edges — used by looks like Capsule, BlockFrame, Creative Mode.
export const Stickers: React.FC<{
  accent: string;
  accent2: string;
  fg: string;
  seed?: number;
}> = ({ accent, accent2, fg, seed = 0 }) => {
  const frame = useCurrentFrame();
  const pop = (d: number) =>
    interpolate(frame, [d, d + 12], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASING.overshoot,
    });

  const items: React.ReactNode[] = [
    // capsule pill, top-left
    pill("frame · 01", accent, "#fff", { top: "12%", left: "7%", rotate: -8 }, pop(6)),
    // dot, top-right
    dot(accent2, 26, { top: "16%", right: "12%" }, pop(10)),
    // star, right
    star(accent, 46, { top: "30%", right: "8%", rotate: 6 }, pop(14)),
    // rotated sticky note, bottom-right
    note("vol. 01", fg, accent2, { bottom: "16%", right: "9%", rotate: 7 }, pop(18)),
    // small capsule, bottom-left
    pill("spec", accent2, "#fff", { bottom: "20%", left: "10%", rotate: 5 }, pop(22)),
  ];

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {items}
    </div>
  );
};

function base(style: any, p: number): React.CSSProperties {
  return {
    position: "absolute",
    opacity: p,
    transform: `${style.rotate ? `rotate(${style.rotate}deg)` : ""} scale(${0.7 + p * 0.3})`,
    top: style.top,
    left: style.left,
    right: style.right,
    bottom: style.bottom,
  };
}

function pill(text: string, bg: string, fg: string, pos: any, p: number) {
  return (
    <div
      key={`pill-${text}`}
      style={{
        ...base(pos, p),
        background: bg,
        color: fg,
        fontFamily: FONT,
        fontWeight: 800,
        fontSize: 22,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        padding: "8px 18px",
        borderRadius: 999,
        boxShadow: "0 8px 20px -8px rgba(0,0,0,0.4)",
      }}
    >
      {text}
    </div>
  );
}

function dot(color: string, size: number, pos: any, p: number) {
  return (
    <div
      key={`dot-${pos.top}-${pos.right}`}
      style={{
        ...base(pos, p),
        width: size,
        height: size,
        borderRadius: 999,
        background: color,
        boxShadow: "0 8px 20px -8px rgba(0,0,0,0.4)",
      }}
    />
  );
}

function star(color: string, size: number, pos: any, p: number) {
  return (
    <svg
      key="star"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={base(pos, p)}
    >
      <path
        d="M12 1l2.9 6.6L22 8.6l-5 4.7 1.3 7.1L12 17l-6.3 3.4L7 13.3 2 8.6l7.1-1z"
        fill={color}
      />
    </svg>
  );
}

function note(text: string, fg: string, bg: string, pos: any, p: number) {
  return (
    <div
      key={`note-${text}`}
      style={{
        ...base(pos, p),
        background: bg,
        color: "#111",
        fontFamily: FONT,
        fontWeight: 800,
        fontSize: 20,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        padding: "16px 20px",
        borderRadius: 8,
        boxShadow: "0 12px 26px -10px rgba(0,0,0,0.45)",
      }}
    >
      {text}
    </div>
  );
}
