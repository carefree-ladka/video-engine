import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import {
  contentAvailHeight,
  contentSideInset,
  contentTopInset,
} from "./layout";

// Top-aligns content in the safe area above the caption band and scales it
// DOWN (never up) so the given estimated content height always fits. This is
// the deterministic, SSR-safe way (matching the rest of the codebase) to keep
// tall scenes — code, diagrams, long bullet lists — clear of the captions.
export const FitStage: React.FC<{
  estHeight: number;
  children: React.ReactNode;
  align?: "center" | "stretch";
}> = ({ estHeight, children, align = "stretch" }) => {
  const { width, height } = useVideoConfig();
  const g = { width, height };
  const avail = contentAvailHeight(g);
  const scale = Math.min(1, avail / Math.max(1, estHeight));
  return (
    <AbsoluteFill
      style={{
        paddingTop: contentTopInset(g),
        paddingLeft: contentSideInset(g),
        paddingRight: contentSideInset(g),
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: align === "center" ? "center" : "stretch",
      }}
    >
      <div
        style={{
          width: "100%",
          transform: `scale(${scale})`,
          transformOrigin: "top center",
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};
