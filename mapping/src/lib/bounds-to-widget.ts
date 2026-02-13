import type { Bound } from "./types";

const CANVAS_WIDTH = 860;

/**
 * Convert bounds data to a .widget.html string.
 * Each bound becomes an absolutely positioned element inside a <section>.
 */
export function boundsToWidgetHTML(
  bounds: Bound[],
  options: {
    widgetId: string;
    taxonomyId: string;
    category: string;
    sourceRef: string;
    sectionHeight: number; // px
  }
): string {
  const { widgetId, taxonomyId, category, sourceRef, sectionHeight } = options;
  const sorted = [...bounds].sort((a, b) => a.zIndex - b.zIndex);

  // Extract dominant colors for style_tags
  const colors = sorted
    .map((b) => b.style?.color || b.style?.bgColor)
    .filter(Boolean) as string[];

  // Detect theme from background bounds
  const bgBound = sorted.find((b) => b.type === "background");
  const theme = detectTheme(bgBound?.style?.bgColor);

  const meta = {
    widget_id: widgetId,
    taxonomy_id: taxonomyId,
    category,
    style_tags: [],
    theme,
    provenance: {
      source_ref: sourceRef,
      extracted_date: new Date().toISOString().split("T")[0],
    },
  };

  const elements = sorted.map((b) => renderBound(b, sectionHeight)).join("\n");

  return `<!--WIDGET_META
${JSON.stringify(meta, null, 2)}
-->
<section id="${taxonomyId.toLowerCase()}" style="position: relative; width: ${CANVAS_WIDTH}px; height: ${sectionHeight}px; overflow: hidden;${bgBound?.style?.bgColor ? ` background: ${bgBound.style.bgColor};` : ""}">
${elements}
</section>
`;
}

function detectTheme(bgColor?: string): "dark" | "light" {
  if (!bgColor) return "dark";
  const hex = bgColor.replace("#", "");
  if (hex.length < 6) return "dark";
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? "light" : "dark";
}

function renderBound(b: Bound, sectionHeight: number): string {
  // Convert % to px
  const left = Math.round((b.x / 100) * CANVAS_WIDTH);
  const top = Math.round((b.y / 100) * sectionHeight);
  const width = Math.round((b.w / 100) * CANVAS_WIDTH);
  const height = Math.round((b.h / 100) * sectionHeight);

  const baseStyle = `position: absolute; left: ${left}px; top: ${top}px; width: ${width}px; height: ${height}px; z-index: ${b.zIndex};`;

  switch (b.type) {
    case "text":
      return renderText(b, baseStyle);
    case "image":
      return renderImage(b, baseStyle);
    case "background":
      return renderBackground(b, baseStyle);
    case "button":
      return renderButton(b, baseStyle);
    case "icon":
      return renderIcon(b, baseStyle);
    case "container":
      return renderContainer(b, baseStyle);
    default:
      return renderOther(b, baseStyle);
  }
}

function renderText(b: Bound, baseStyle: string): string {
  const s = b.style || {};
  const fontSize = s.fontSize || "22px";
  const fontWeight = mapFontWeight(s.fontWeight);
  const color = s.color || "#FFFFFF";
  const textAlign = s.textAlign || "center";
  const content = escapeHTML(b.content || `[${b.label}]`);

  return `  <div style="${baseStyle} display: flex; align-items: center; justify-content: ${alignToJustify(textAlign)}; padding: 8px;">
    <p style="font-size: ${fontSize}; font-weight: ${fontWeight}; color: ${color}; text-align: ${textAlign}; line-height: 1.4; margin: 0;">${content}</p>
  </div>`;
}

function renderImage(b: Bound, baseStyle: string): string {
  return `  <div class="img-placeholder" style="${baseStyle} display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; background: #2A2A2A; color: #666; font-size: 14px; border-radius: 8px;" data-ai-prompt="${escapeAttr(b.content || b.label)}" data-ai-style="product_hero">
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
    <span class="img-label">${escapeHTML(b.label)}</span>
  </div>`;
}

function renderBackground(b: Bound, baseStyle: string): string {
  const bgColor = b.style?.bgColor || "#111111";
  return `  <div style="${baseStyle} background: ${bgColor};"></div>`;
}

function renderButton(b: Bound, baseStyle: string): string {
  const s = b.style || {};
  const bgColor = s.bgColor || "var(--brand-main)";
  const color = s.color || "#FFFFFF";
  const fontSize = s.fontSize || "18px";
  const content = escapeHTML(b.content || b.label);

  return `  <div style="${baseStyle} display: flex; align-items: center; justify-content: center;">
    <button style="padding: 12px 32px; border-radius: 9999px; background: ${bgColor}; color: ${color}; font-size: ${fontSize}; font-weight: 700; border: none; cursor: pointer;">${content}</button>
  </div>`;
}

function renderIcon(b: Bound, baseStyle: string): string {
  const color = b.style?.color || "#888888";
  return `  <div style="${baseStyle} display: flex; align-items: center; justify-content: center; color: ${color};" title="${escapeAttr(b.label)}">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>
  </div>`;
}

function renderContainer(b: Bound, baseStyle: string): string {
  const bgColor = b.style?.bgColor || "rgba(255,255,255,0.05)";
  return `  <div style="${baseStyle} background: ${bgColor}; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px;"></div>`;
}

function renderOther(b: Bound, baseStyle: string): string {
  const bgColor = b.style?.bgColor || "rgba(255,255,255,0.1)";
  return `  <div style="${baseStyle} background: ${bgColor};" title="${escapeAttr(b.label)}"></div>`;
}

function mapFontWeight(w?: string): number {
  switch (w) {
    case "bold": return 700;
    case "semibold": return 600;
    case "medium": return 500;
    default: return 400;
  }
}

function alignToJustify(align: string): string {
  switch (align) {
    case "left": return "flex-start";
    case "right": return "flex-end";
    default: return "center";
  }
}

function escapeHTML(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
