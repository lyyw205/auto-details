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
}

export type AnalyzeMethod = "vision" | "fallback" | "manual";

export interface AnalyzeStatus {
  step: AnalyzeMethod | null;
  isLoading: boolean;
  message: string | null;
}
