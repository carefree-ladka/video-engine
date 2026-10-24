import React from "react";
import { FaInstagram, FaYoutube } from "react-icons/fa6";
import { FONT } from "./fonts";

// Social handle chips for the end card. Handles come from brand.json.
export const SocialHandles: React.FC<{
  instagram?: string;
  youtube?: string;
  fg: string;
  size?: number;
  opacity?: number;
  rise?: number;
}> = ({ instagram, youtube, fg, size = 46, opacity = 1, rise = 0 }) => {
  const items: Array<{
    icon: React.ReactNode;
    handle: string;
  }> = [];
  if (instagram)
    items.push({
      icon: <FaInstagram size={size} color="#E1306C" />,
      handle: instagram,
    });
  if (youtube)
    items.push({
      icon: <FaYoutube size={size} color="#FF0000" />,
      handle: youtube,
    });
  if (!items.length) return null;

  return (
    <div
      style={{
        display: "flex",
        gap: 20,
        justifyContent: "center",
        flexWrap: "wrap",
        opacity,
        transform: `translateY(${rise}px)`,
      }}
    >
      {items.map((it, i) => (
        <div
          key={i}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 16,
            padding: "14px 26px",
            borderRadius: 999,
            background:
              "linear-gradient(165deg, rgba(255,255,255,0.10), rgba(255,255,255,0.035))",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.10), 0 12px 30px -16px rgba(0,0,0,0.7)",
          }}
        >
          <span style={{ display: "inline-flex" }}>{it.icon}</span>
          <span
            style={{
              fontFamily: FONT,
              fontSize: Math.round(size * 0.74),
              fontWeight: 700,
              color: fg,
              letterSpacing: "-0.01em",
            }}
          >
            {it.handle}
          </span>
        </div>
      ))}
    </div>
  );
};
