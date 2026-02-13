"use client";

import type { Bound, ResizeHandle } from "@/lib/types";
import { BOUND_TYPE_COLORS } from "@/lib/constants";

interface BoundOverlayProps {
  bound: Bound;
  isSelected: boolean;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
  onResizePointerDown: (
    e: React.PointerEvent,
    id: string,
    handle: ResizeHandle
  ) => void;
}

const HANDLES: { handle: ResizeHandle; cursor: string; style: React.CSSProperties }[] = [
  { handle: "nw", cursor: "nwse-resize", style: { top: -4, left: -4 } },
  { handle: "n", cursor: "ns-resize", style: { top: -4, left: "50%", transform: "translateX(-50%)" } },
  { handle: "ne", cursor: "nesw-resize", style: { top: -4, right: -4 } },
  { handle: "e", cursor: "ew-resize", style: { top: "50%", right: -4, transform: "translateY(-50%)" } },
  { handle: "se", cursor: "nwse-resize", style: { bottom: -4, right: -4 } },
  { handle: "s", cursor: "ns-resize", style: { bottom: -4, left: "50%", transform: "translateX(-50%)" } },
  { handle: "sw", cursor: "nesw-resize", style: { bottom: -4, left: -4 } },
  { handle: "w", cursor: "ew-resize", style: { top: "50%", left: -4, transform: "translateY(-50%)" } },
];

export function BoundOverlay({
  bound,
  isSelected,
  onPointerDown,
  onResizePointerDown,
}: BoundOverlayProps) {
  const color = BOUND_TYPE_COLORS[bound.type];

  return (
    <div
      onPointerDown={(e) => onPointerDown(e, bound.id)}
      className="absolute cursor-move"
      style={{
        left: `${bound.x}%`,
        top: `${bound.y}%`,
        width: `${bound.w}%`,
        height: `${bound.h}%`,
        zIndex: bound.zIndex + 10,
        border: `2px solid ${color}`,
        backgroundColor: `${color}${isSelected ? "30" : "15"}`,
        outline: isSelected ? `2px solid ${color}` : "none",
        outlineOffset: 1,
      }}
    >
      {/* Label */}
      <span
        className="absolute -top-5 left-0 whitespace-nowrap rounded px-1 py-0.5 text-[10px] font-medium text-white"
        style={{ backgroundColor: color }}
      >
        {bound.label}
      </span>

      {/* Resize handles */}
      {isSelected &&
        HANDLES.map(({ handle, cursor, style }) => (
          <div
            key={handle}
            onPointerDown={(e) => onResizePointerDown(e, bound.id, handle)}
            className="absolute h-2 w-2 rounded-sm border border-white"
            style={{
              ...style,
              backgroundColor: color,
              cursor,
              zIndex: 999,
            }}
          />
        ))}
    </div>
  );
}
