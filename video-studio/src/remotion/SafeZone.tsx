import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { captionBandPct, contentSideInset, contentTopInset } from "./layout";

export const SafeZone: React.FC<{
  children: React.ReactNode;
  center?: boolean;
}> = ({ children, center = true }) => {
  const { width, height } = useVideoConfig();
  const g = { width, height };
  // Bottom padding reserves the full caption band so centered content is
  // lifted clear of the subtitles on every platform.
  const pad = {
    top: contentTopInset(g),
    bottom: height * captionBandPct(g),
    left: contentSideInset(g),
    right: contentSideInset(g),
  };
  return (
    <AbsoluteFill
      style={{
        paddingTop: pad.top,
        paddingBottom: pad.bottom,
        paddingLeft: pad.left,
        paddingRight: pad.right,
        display: "flex",
        flexDirection: "column",
        justifyContent: center ? "center" : "flex-start",
        overflow: "hidden",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
