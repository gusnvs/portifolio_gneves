import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const ORANGE = "#ff6a1a";
const CREAM = "#f3ede1";

const SPARKS = [
  { x: 300, y: 320, delay: 14, size: 46 },
  { x: 770, y: 300, delay: 20, size: 34 },
  { x: 800, y: 560, delay: 26, size: 40 },
  { x: 270, y: 600, delay: 32, size: 28 },
  { x: 540, y: 220, delay: 38, size: 30 },
];

export const MascotIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 11, mass: 0.9 } });
  const scale = interpolate(enter, [0, 1], [0.15, 1]);
  const rotate = interpolate(enter, [0, 1], [-28, 0]);
  const bob = Math.sin(frame / 9) * 12;

  const textOpacity = interpolate(frame, [44, 62], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textY = interpolate(frame, [44, 62], [44, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 40%, #1b1119, #0b0a0c)" }}>
      <AbsoluteFill
        style={{ background: `radial-gradient(circle at 50% 42%, ${ORANGE}30, transparent 46%)` }}
      />

      {SPARKS.map((s, i) => {
        const pop = spring({ frame: frame - s.delay, fps, config: { damping: 9 } });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: s.x,
              top: s.y,
              fontSize: s.size,
              color: ORANGE,
              transform: `scale(${pop}) rotate(${pop * 90}deg)`,
              opacity: pop,
            }}
          >
            ✦
          </div>
        );
      })}

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <Img
          src={staticFile("mascote.png")}
          style={{
            width: 540,
            transform: `translateY(${bob - 40}px) scale(${scale}) rotate(${rotate}deg)`,
            filter: `drop-shadow(0 24px 60px ${ORANGE}55)`,
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 130 }}
      >
        <div
          style={{
            opacity: textOpacity,
            transform: `translateY(${textY}px)`,
            fontFamily: "Arial, Helvetica, sans-serif",
            fontWeight: 800,
            fontSize: 88,
            letterSpacing: -3,
            color: CREAM,
          }}
        >
          GUSTAVO <span style={{ color: ORANGE }}>NEVES</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
