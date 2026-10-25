import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import {
  captionBandTop,
  contentAvailHeight,
  contentSideInset,
  contentTopInset,
} from "./layout";

// Centers content in the safe area between the top inset and the caption band,
// and scales it DOWN (never up) so the given estimated content height always
// fits. Vertically centering (rather than top-aligning) removes the dead gap
// that used to sit between short content and the captions. The caption band is
// reserved as bottom padding so centering never pushes content into the
// subtitles. Deterministic and SSR-safe, matching the rest of the codebase.
export const FitStage: React.FC<{
  estHeight: number;
  children: React.ReactNode;
  align?: "center" | "stretch";
}> = ({ estHeight, children, align = "stretch" }) => {
  const { width, height } = useVideoConfig();
  const g = { width, height };
  const avail = contentAvailHeight(g);
  const scale = Math.min(1, avail / Math.max(1, estHeight));
  // Bottom padding = the reserved caption band, so "center" is the midpoint of
  // the content area, not the whole frame.
  const bandReserve = height - captionBandTop(g);
  return (
    <AbsoluteFill
      style={{
        paddingTop: contentTopInset(g),
        paddingBottom: bandReserve,
        paddingLeft: contentSideInset(g),
        paddingRight: contentSideInset(g),
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: align === "center" ? "center" : "stretch",
      }}
    >
      <div
        style={{
          width: "100%",
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};
