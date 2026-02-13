import type { BoundType } from "./types";

export const BOUND_TYPE_COLORS: Record<BoundType, string> = {
  text: "#3b82f6",       // blue
  image: "#10b981",      // emerald
  background: "#8b5cf6", // violet
  button: "#f59e0b",     // amber
  icon: "#ec4899",       // pink
  input: "#06b6d4",      // cyan
  container: "#6b7280",  // gray
  other: "#ef4444",      // red
};

export const BOUND_TYPE_LABELS: Record<BoundType, string> = {
  text: "Text",
  image: "Image",
  background: "Background",
  button: "Button",
  icon: "Icon",
  input: "Input",
  container: "Container",
  other: "Other",
};

export const ALL_BOUND_TYPES: BoundType[] = [
  "text",
  "image",
  "background",
  "button",
  "icon",
  "input",
  "container",
  "other",
];

export const GEMINI_MODEL = "gemini-2.5-flash";
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

// ── Pipeline constants ──
export const CANVAS_WIDTH = 860;
export const TILE_HEIGHT = 1200;       // px per tile
export const TILE_OVERLAP = 200;       // px overlap between tiles
export const TALL_IMAGE_RATIO = 2.0;   // height/width ratio to trigger tiling
export const BOX2D_SCALE = 1000;       // Gemini box_2d coordinate scale

export const HF_MODEL = "google/owlvit-base-patch32";
export const HF_MIN_CONFIDENCE = 0.15;
export const IOU_MATCH_THRESHOLD = 0.3;
export const IOU_HIGH_CONFIDENCE = 0.5;
