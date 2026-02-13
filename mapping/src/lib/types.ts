export type BoundType =
  | "text"
  | "image"
  | "background"
  | "button"
  | "icon"
  | "input"
  | "container"
  | "other";

export interface BoundStyle {
  fontSize?: string;
  fontWeight?: string;
  color?: string;
  textAlign?: string;
  bgColor?: string;
}

export interface Bound {
  id: string;
  type: BoundType;
  label: string;
  x: number; // % (0-100)
  y: number; // % (0-100)
  w: number; // % (0-100)
  h: number; // % (0-100)
  zIndex: number;
  content?: string;
  style?: BoundStyle;
}

export type ResizeHandle =
  | "nw"
  | "n"
  | "ne"
  | "e"
  | "se"
  | "s"
  | "sw"
  | "w";

export type InteractionMode = "select" | "draw";

export type PointerState =
  | { type: "idle" }
  | { type: "drawing"; startX: number; startY: number }
  | {
      type: "moving";
      boundId: string;
      offsetX: number;
      offsetY: number;
    }
  | {
      type: "resizing";
      boundId: string;
      handle: ResizeHandle;
      startX: number;
      startY: number;
      originalBound: Bound;
    };

export type BoundsAction =
  | { type: "SET_ALL"; bounds: Bound[] }
  | { type: "ADD"; bound: Bound }
  | { type: "UPDATE"; id: string; patch: Partial<Omit<Bound, "id">> }
  | { type: "DELETE"; id: string }
  | { type: "UNDO" }
  | { type: "REDO" };

export interface BoundsState {
  present: Bound[];
  past: Bound[][];
  future: Bound[][];
}

export interface ImageState {
  src: string; // base64 data URI
  naturalWidth: number;
  naturalHeight: number;
  fileName: string;
}

export interface AnalyzeRequest {
  image: string; // base64 without prefix
  mediaType: "image/png" | "image/jpeg" | "image/gif" | "image/webp";
}

export interface AnalyzeResponse {
  bounds: Bound[];
  method: AnalyzeMethod;
  pipeline?: {
    pass1Count: number;
    pass2Count: number;
    mergedCount: number;
    tilesUsed: number;
  };
}

// ── Pipeline internal types ──

/** Gemini box_2d raw response element */
export interface GeminiRawElement {
  type: BoundType;
  label: string;
  box_2d: [number, number, number, number]; // [y_min, x_min, y_max, x_max] 0-1000
  zIndex: number;
  content?: string;
  style?: BoundStyle;
}

/** Image tile for tall image splitting */
export interface ImageTile {
  buffer: Buffer;
  base64: string;
  mediaType: string;
  yOffsetPercent: number;  // start position relative to full image (0-100)
  heightPercent: number;   // height ratio relative to full image
}

/** Preprocessing result */
export interface PreprocessedImage {
  tiles: ImageTile[];
  originalWidth: number;
  originalHeight: number;
  resizedWidth: number;   // always 860
  resizedHeight: number;
  isTiled: boolean;
}

/** HuggingFace detection result */
export interface DetectionBox {
  label: string;
  score: number;
  box: { xmin: number; ymin: number; xmax: number; ymax: number };
}

export type AnalyzeMethod = "vision" | "fallback" | "manual";

export interface AnalyzeStatus {
  step: AnalyzeMethod | null;
  isLoading: boolean;
  message: string | null;
}
