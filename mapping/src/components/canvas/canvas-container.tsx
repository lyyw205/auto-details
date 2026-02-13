"use client";

import { RefObject } from "react";
import type { Bound, InteractionMode, ResizeHandle } from "@/lib/types";
import { BoundOverlay } from "./bound-overlay";
import { DrawOverlay } from "./draw-overlay";

interface CanvasContainerProps {
  imageSrc: string;
  bounds: Bound[];
  selectedId: string | null;
  mode: InteractionMode;
  drawRect: { x: number; y: number; w: number; h: number } | null;
  containerRef: RefObject<HTMLDivElement | null>;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: () => void;
  onBoundPointerDown: (e: React.PointerEvent, id: string) => void;
  onResizePointerDown: (
    e: React.PointerEvent,
    id: string,
    handle: ResizeHandle
  ) => void;
}

export function CanvasContainer({
  imageSrc,
  bounds,
  selectedId,
  mode,
  drawRect,
  containerRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onBoundPointerDown,
  onResizePointerDown,
}: CanvasContainerProps) {
  const sortedBounds = [...bounds].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div className="flex-1 overflow-auto bg-zinc-100 p-8 dark:bg-zinc-900">
      <div
        ref={containerRef}
        className={`relative mx-auto inline-block ${
          mode === "draw" ? "cursor-crosshair" : ""
        }`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ touchAction: "none" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt="Reference"
          className="block max-h-[80vh] max-w-full select-none"
          draggable={false}
        />

        {sortedBounds.map((bound) => (
          <BoundOverlay
            key={bound.id}
            bound={bound}
            isSelected={bound.id === selectedId}
            onPointerDown={onBoundPointerDown}
            onResizePointerDown={onResizePointerDown}
          />
        ))}

        <DrawOverlay rect={drawRect} />
      </div>
    </div>
  );
}
