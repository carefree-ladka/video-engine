import React from "react";
import { AbsoluteFill } from "remotion";

// Custom pure-CSS transition presentations for @remotion/transitions.
// CSS transforms only (no WebGL shaders), so they render reliably headless.
// A presentation is { component, props }; the component receives
// presentationDirection ("entering" | "exiting") and presentationProgress 0..1.

type PresProps = {
  children: React.ReactNode;
  presentationDirection: "entering" | "exiting";
  presentationProgress: number;
  passedProps: any;
};

// Zoom-punch: incoming scales up from 0.9 while fading in; outgoing pushes to
// 1.12 while fading out. Reads as a confident "snap" into the next scene.
const ZoomPresentation: React.FC<PresProps> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  const entering = presentationDirection === "entering";
  const p = presentationProgress;
  const scale = entering ? 0.9 + p * 0.1 : 1 + p * 0.12;
  const opacity = entering ? p : 1 - p;
  return (
    <AbsoluteFill
      showInTimeline={false}
      style={{ opacity, transform: `scale(${scale})`, ...(passedProps?.style ?? {}) }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const zoomTransition = (props?: { style?: React.CSSProperties }) => ({
  component: ZoomPresentation,
  props: props ?? {},
});

// Push: the outgoing scene slides off while the incoming slides on from the
// chosen edge (vertical by default — a clean "deck" push).
const PushPresentation: React.FC<PresProps> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  const entering = presentationDirection === "entering";
  const dir: "from-bottom" | "from-top" | "from-left" | "from-right" =
    passedProps?.direction ?? "from-bottom";
  const axis = dir === "from-left" || dir === "from-right" ? "X" : "Y";
  const sign = dir === "from-top" || dir === "from-left" ? -1 : 1;
  const pct = entering
    ? (1 - presentationProgress) * 100 * sign
    : -presentationProgress * 100 * sign;
  return (
    <AbsoluteFill
      showInTimeline={false}
      style={{ transform: `translate${axis}(${pct}%)` }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const pushTransition = (props?: {
  direction?: "from-bottom" | "from-top" | "from-left" | "from-right";
}) => ({
  component: PushPresentation,
  props: props ?? {},
});
