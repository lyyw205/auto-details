/**
 * Widget JSON Schema Types — Single Source of Truth
 *
 * All widget data is stored in .widget.json files.
 * HTML is only generated for preview/final output via the renderer.
 * Coordinates are always in % (0-100) — no px conversion, no padding/gap.
 */

// ── Element Types ──

export type ElementType =
  | "text"
  | "image"
  | "background"
  | "button"
  | "icon"
  | "input"
  | "container"
  | "shape"
  | "other";

export interface ElementStyle {
  fontSize?: string;
  fontWeight?: "normal" | "medium" | "semibold" | "bold";
  color?: string;
  textAlign?: "left" | "center" | "right";
  bgColor?: string;
  borderRadius?: string;
  lineHeight?: string;
  opacity?: number;
  gradient?: string;
}

export interface ImagePlaceholder {
  ai_prompt: string;
  ai_style?: string;
  ai_ratio?: string;
}

export interface WidgetElement {
  id: string;
  type: ElementType;
  label: string;
  /** X position in % (0-100), relative to canvas */
  x: number;
  /** Y position in % (0-100), relative to canvas */
  y: number;
  /** Width in % (0-100) */
  w: number;
  /** Height in % (0-100) */
  h: number;
  zIndex: number;
  /** Text content with [placeholder] patterns, or visual description */
  content?: string;
  style?: ElementStyle;
  /** For image elements — AI generation hints */
  placeholder?: ImagePlaceholder;
}

// ── Widget Metadata ──

export type TaxonomyCategory = "intro" | "problem" | "features" | "trust" | "conversion";
export type WidgetTheme = "dark" | "light";
export type WidgetComposition = "stack" | "split" | "composed" | "wireframe";
export type WidgetStatus = "new" | "reviewed" | "archived";

export interface WidgetProvenance {
  source_ref: string;
  extracted_date: string;
  analysis_version?: string;
}

export interface FigmaHints {
  layout_structure: string;
  key_elements: string[];
}

export interface SampleDataImage {
  label: string;
  src: string;
  alt: string;
}

export interface WidgetSampleData {
  texts: Record<string, string>;
  images: SampleDataImage[];
}

// ── Canvas ──

export interface WidgetCanvas {
  /** Always 860 */
  width: 860;
  /** Section height in px */
  height: number;
}

// ── Main Widget JSON ──

export interface WidgetJSON {
  widget_id: string;
  taxonomy_id: string;
  category: TaxonomyCategory;
  style_tags: string[];
  theme: WidgetTheme;
  composition: WidgetComposition;
  provenance: WidgetProvenance;
  status: WidgetStatus;

  /** Copywriting guide for content generation */
  copywriting_guide?: string;

  canvas: WidgetCanvas;

  /** Layout elements with % coordinates — Single Source of Truth */
  elements: WidgetElement[];

  /**
   * Legacy HTML body for widgets migrated from .widget.html.
   * Used as fallback when elements array is empty.
   * New widgets should NEVER use this field.
   * @deprecated Will be removed after full migration to elements-based format.
   */
  html_body?: string;

  /** Hints for Figma Make prompt generation — direct from JSON, no HTML parsing */
  figma_hints?: FigmaHints;

  /** Sample data for gallery demo preview */
  sample_data?: WidgetSampleData;
}

// ── Registry Types ──

export interface RegistryEntry {
  widget_id: string;
  file: string;
  source_ref: string;
  style_tags: string[];
  composition: WidgetComposition;
  theme: WidgetTheme;
  status: WidgetStatus;
  added_date: string;
  /** For FeatureDetail widgets */
  variant?: "image-left" | "image-right";
  /** Duplicate detection */
  duplicate_of?: string;
  similarity_score?: number;
}

export interface WidgetRegistry {
  type: "WIDGET_REGISTRY";
  version: "3.0";
  total_widgets: number;
  presets: string[];
  widgets: Record<string, RegistryEntry[]>;
}

// ── Validation Types ──

export interface ValidationResult {
  pass: boolean;
  overall_accuracy?: number;
  total_elements: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  element_id?: string;
  field: string;
  message: string;
}

export interface ValidationWarning {
  element_id?: string;
  field: string;
  message: string;
  suggestion?: string;
}
