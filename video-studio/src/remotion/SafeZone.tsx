import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";

export const SafeZone: React.FC<{ children: React.ReactNode; center?: boolean }> = ({ children, center = true }) => {
  const { width, height } = useVideoConfig();
  const vertical = height > width;
  const pad = vertical
    ? { top: height * 0.1, bottom: height * 0.2, left: width * 0.07, right: width * 0.07 }
    : { top: height * 0.08, bottom: height * 0.08, left: width * 0.06, right: width * 0.06 };
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
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
