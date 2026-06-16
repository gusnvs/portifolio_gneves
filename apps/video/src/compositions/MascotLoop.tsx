import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const ORANGE = "#ff6a1a";

/** A seamless idle loop — the mascot gently bobs and wobbles. */
export const MascotLoop: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const t = (frame / durationInFrames) * Math.PI * 2; // 0..2π over the loop
  const bob = Math.sin(t) * 16;
  const wobble = Math.sin(t) * 4;
  const breathe = 1 + Math.sin(t) * 0.015;

  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, #1b1119, #0b0a0c)" }}>
      <AbsoluteFill
        style={{ background: `radial-gradient(circle at 50% 50%, ${ORANGE}26, transparent 50%)` }}
      />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <Img
          src={staticFile("mascote.png")}
          style={{
            width: 620,
            transform: `translateY(${bob}px) rotate(${wobble}deg) scale(${breathe})`,
            filter: `drop-shadow(0 20px 50px ${ORANGE}44)`,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
