"use client";

import { useState, useCallback, useRef } from "react";
import type {
  Bound,
  InteractionMode,
  PointerState,
  ResizeHandle,
} from "@/lib/types";
import { pixelToPercent, normalizeRect, applyResize, clampBound } from "@/lib/geometry";

interface UseCanvasInteractionsProps {
  bounds: Bound[];
  mode: InteractionMode;
  onAddBound: (bound: Bound) => void;
  onUpdateBound: (id: string, patch: Partial<Omit<Bound, "id">>) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function useCanvasInteractions({
  bounds,
  mode,
  onAddBound,
  onUpdateBound,
  selectedId,
  onSelect,
}: UseCanvasInteractionsProps) {
  const [pointerState, setPointerState] = useState<PointerState>({
    type: "idle",
  });
  const [drawRect, setDrawRect] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getPercent = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      return pixelToPercent(
        clientX - rect.left,
        clientY - rect.top,
        rect.width,
        rect.height
      );
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      const pos = getPercent(e.clientX, e.clientY);

      if (mode === "draw") {
        setPointerState({ type: "drawing", startX: pos.x, startY: pos.y });
        setDrawRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
        onSelect(null);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }

      // select mode - check if clicking on a bound
      // handled by bound-overlay onPointerDown instead
      onSelect(null);
    },
    [mode, getPercent, onSelect]
  );

  const handleBoundPointerDown = useCallback(
    (e: React.PointerEvent, boundId: string) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      const pos = getPercent(e.clientX, e.clientY);
      const bound = bounds.find((b) => b.id === boundId);
      if (!bound) return;

      onSelect(boundId);
      setPointerState({
        type: "moving",
        boundId,
        offsetX: pos.x - bound.x,
        offsetY: pos.y - bound.y,
      });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [bounds, getPercent, onSelect]
  );

  const handleResizePointerDown = useCallback(
    (e: React.PointerEvent, boundId: string, handle: ResizeHandle) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      const pos = getPercent(e.clientX, e.clientY);
      const bound = bounds.find((b) => b.id === boundId);
      if (!bound) return;

      onSelect(boundId);
      setPointerState({
        type: "resizing",
        boundId,
        handle,
        startX: pos.x,
        startY: pos.y,
        originalBound: { ...bound },
      });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [bounds, getPercent, onSelect]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const pos = getPercent(e.clientX, e.clientY);

      switch (pointerState.type) {
        case "drawing": {
          const rect = normalizeRect(
            pointerState.startX,
            pointerState.startY,
            pos.x,
            pos.y
          );
          setDrawRect(rect);
          break;
        }
        case "moving": {
          const bound = bounds.find((b) => b.id === pointerState.boundId);
          if (!bound) break;
          const newX = pos.x - pointerState.offsetX;
          const newY = pos.y - pointerState.offsetY;
          const clamped = clampBound({ ...bound, x: newX, y: newY });
          onUpdateBound(pointerState.boundId, {
            x: clamped.x,
            y: clamped.y,
          });
          break;
        }
        case "resizing": {
          const dx = pos.x - pointerState.startX;
          const dy = pos.y - pointerState.startY;
          const resized = applyResize(
            pointerState.originalBound,
            pointerState.handle,
            dx,
            dy
          );
          onUpdateBound(pointerState.boundId, {
            x: resized.x,
            y: resized.y,
            w: resized.w,
            h: resized.h,
          });
          break;
        }
      }
    },
    [pointerState, getPercent, bounds, onUpdateBound]
  );

  const handlePointerUp = useCallback(() => {
    if (pointerState.type === "drawing" && drawRect) {
      if (drawRect.w > 1 && drawRect.h > 1) {
        const newBound: Bound = {
          id: `bound-${Date.now()}`,
          type: "other",
          label: "New Element",
          x: drawRect.x,
          y: drawRect.y,
          w: drawRect.w,
          h: drawRect.h,
          zIndex: bounds.length,
          content: "",
        };
        onAddBound(newBound);
        onSelect(newBound.id);
      }
    }
    setPointerState({ type: "idle" });
    setDrawRect(null);
  }, [pointerState, drawRect, bounds.length, onAddBound, onSelect]);

  return {
    containerRef,
    drawRect,
    pointerState,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleBoundPointerDown,
    handleResizePointerDown,
  };
}
