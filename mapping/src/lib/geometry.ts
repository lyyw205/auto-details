import type { Bound, ResizeHandle } from "./types";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function clampPercent(value: number): number {
  return clamp(value, 0, 100);
}

export function clampBound(b: Bound): Bound {
  const x = clampPercent(b.x);
  const y = clampPercent(b.y);
  const w = clamp(b.w, 0.5, 100 - x);
  const h = clamp(b.h, 0.5, 100 - y);
  return { ...b, x, y, w, h };
}

export function pixelToPercent(
  px: number,
  py: number,
  containerWidth: number,
  containerHeight: number
): { x: number; y: number } {
  return {
    x: (px / containerWidth) * 100,
    y: (py / containerHeight) * 100,
  };
}

export function normalizeRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { x: number; y: number; w: number; h: number } {
  const x = Math.min(x1, x2);
  const y = Math.min(y1, y2);
  const w = Math.abs(x2 - x1);
  const h = Math.abs(y2 - y1);
  return { x, y, w, h };
}

export function applyResize(
  original: Bound,
  handle: ResizeHandle,
  dx: number,
  dy: number
): Bound {
  let { x, y, w, h } = original;

  switch (handle) {
    case "nw":
      x += dx;
      y += dy;
      w -= dx;
      h -= dy;
      break;
    case "n":
      y += dy;
      h -= dy;
      break;
    case "ne":
      y += dy;
      w += dx;
      h -= dy;
      break;
    case "e":
      w += dx;
      break;
    case "se":
      w += dx;
      h += dy;
      break;
    case "s":
      h += dy;
      break;
    case "sw":
      x += dx;
      w -= dx;
      h += dy;
      break;
    case "w":
      x += dx;
      w -= dx;
      break;
  }

  return clampBound({ ...original, x, y, w, h });
}
