"use client";

interface DrawOverlayProps {
  rect: { x: number; y: number; w: number; h: number } | null;
}

export function DrawOverlay({ rect }: DrawOverlayProps) {
  if (!rect) return null;

  return (
    <div
      className="pointer-events-none absolute border-2 border-dashed border-blue-500 bg-blue-500/10"
      style={{
        left: `${rect.x}%`,
        top: `${rect.y}%`,
        width: `${rect.w}%`,
        height: `${rect.h}%`,
        zIndex: 9999,
      }}
    />
  );
}
