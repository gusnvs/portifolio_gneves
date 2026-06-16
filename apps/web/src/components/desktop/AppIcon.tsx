import Image from "next/image";

/** Renders an app's snowman icon image (optimized) or falls back to its emoji. */
export function AppIcon({
  img,
  emoji,
  title,
  size,
  className = "",
}: {
  img?: string;
  emoji?: string;
  title: string;
  size: number;
  className?: string;
}) {
  if (img) {
    return (
      <Image
        src={img}
        alt={title}
        width={size}
        height={size}
        draggable={false}
        className={`object-contain ${className}`}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={className}
      style={{ fontSize: Math.round(size * 0.82), lineHeight: 1 }}
    >
      {emoji}
    </span>
  );
}
