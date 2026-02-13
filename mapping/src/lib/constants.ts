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
