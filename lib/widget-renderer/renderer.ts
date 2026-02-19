import type {
  WidgetJSON,
  WidgetElement,
  ElementStyle,
  WidgetSampleData,
  SampleDataImage,
} from "./types";

export interface RenderOptions {
  /** Apply sample_data to replace [placeholder] patterns */
  demoMode?: boolean;
  /** Override colors (for brand color remapping) */
  colorOverrides?: Record<string, string>;
  /** Wrap in full HTML document with head/styles */
  standalone?: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function applyColorOverrides(value: string, overrides: Record<string, string>): string {
  let result = value;
  for (const [from, to] of Object.entries(overrides)) {
    // Case-insensitive hex replacement
    const pattern = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    result = result.replace(pattern, to);
  }
  return result;
}

function resolveStyle(
  style: ElementStyle | undefined,
  overrides?: Record<string, string>
): ElementStyle {
  if (!style || !overrides || Object.keys(overrides).length === 0) return style ?? {};
  const resolved: ElementStyle = { ...style };
  if (resolved.color) resolved.color = applyColorOverrides(resolved.color, overrides);
  if (resolved.bgColor) resolved.bgColor = applyColorOverrides(resolved.bgColor, overrides);
  if (resolved.gradient) resolved.gradient = applyColorOverrides(resolved.gradient, overrides);
  return resolved;
}

function fontWeightValue(fw: ElementStyle["fontWeight"]): number {
  switch (fw) {
    case "medium": return 500;
    case "semibold": return 600;
    case "bold": return 700;
    default: return 400;
  }
}

/** Build inline style string for absolutely positioned wrapper div */
function positionStyle(el: WidgetElement): string {
  return [
    "position:absolute",
    `left:${el.x}%`,
    `top:${el.y}%`,
    `width:${el.w}%`,
    `height:${el.h}%`,
    `z-index:${el.zIndex}`,
  ].join(";");
}

/**
 * Replace [placeholder] tokens in content using sample_data.texts.
 * Matching is case-insensitive and strips the brackets for lookup.
 */
function applyDemoText(
  content: string,
  texts: Record<string, string>
): string {
  return content.replace(/\[([^\]]+)\]/g, (_match, key: string) => {
    const lower = key.toLowerCase();
    // Try exact key, then lowercase key
    return texts[key] ?? texts[lower] ?? `[${key}]`;
  });
}

// ── Element Renderers ─────────────────────────────────────────────────────────

function renderText(
  el: WidgetElement,
  style: ElementStyle,
  content: string
): string {
  const inlineStyles: string[] = [
    positionStyle(el),
    "overflow:hidden",
  ];
  if (style.opacity !== undefined) inlineStyles.push(`opacity:${style.opacity}`);

  const pStyles: string[] = [
    "margin:0",
    "width:100%",
  ];
  if (style.fontSize) pStyles.push(`font-size:${style.fontSize}`);
  if (style.fontWeight) pStyles.push(`font-weight:${fontWeightValue(style.fontWeight)}`);
  if (style.color) pStyles.push(`color:${style.color}`);
  if (style.textAlign) pStyles.push(`text-align:${style.textAlign}`);

  return `<div style="${inlineStyles.join(";")}"><p style="${pStyles.join(";")}">${content}</p></div>`;
}

function renderImage(el: WidgetElement, style: ElementStyle, demoImages: SampleDataImage[]): string {
  const wrapStyles: string[] = [
    positionStyle(el),
    "overflow:hidden",
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "background:#c4c4c4",
  ];
  if (style.borderRadius) wrapStyles.push(`border-radius:${style.borderRadius}`);
  if (style.opacity !== undefined) wrapStyles.push(`opacity:${style.opacity}`);

  const aiPrompt = el.placeholder?.ai_prompt ?? el.label ?? "";
  const aiStyle = el.placeholder?.ai_style ?? "";

  // In demo mode, use first matching sample image if available
  const matchedImage = demoImages.find(
    (img) => img.label.toLowerCase() === el.label.toLowerCase()
  ) ?? (demoImages.length > 0 ? demoImages[0] : null);

  if (matchedImage) {
    return `<div style="${wrapStyles.join(";")}" data-ai-prompt="${esc(aiPrompt)}" data-ai-style="${esc(aiStyle)}"><img src="${esc(matchedImage.src)}" alt="${esc(matchedImage.alt)}" style="width:100%;height:100%;object-fit:cover;" /></div>`;
  }

  // Placeholder with camera icon
  const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`;
  const labelHtml = `<div style="margin-top:8px;font-size:11px;color:#888;text-align:center;">${esc(el.label)}</div>`;

  return `<div class="img-placeholder" style="${wrapStyles.join(";")}" data-ai-prompt="${esc(aiPrompt)}" data-ai-style="${esc(aiStyle)}"><div style="display:flex;flex-direction:column;align-items:center;">${svgIcon}${labelHtml}</div></div>`;
}

function renderBackground(el: WidgetElement, style: ElementStyle): string {
  const bgStyles: string[] = [positionStyle(el)];
  if (style.gradient) {
    bgStyles.push(`background:${style.gradient}`);
  } else if (style.bgColor) {
    bgStyles.push(`background:${style.bgColor}`);
  } else {
    bgStyles.push("background:#f5f5f5");
  }
  if (style.opacity !== undefined) bgStyles.push(`opacity:${style.opacity}`);
  if (style.borderRadius) bgStyles.push(`border-radius:${style.borderRadius}`);
  return `<div style="${bgStyles.join(";")}"></div>`;
}

function renderButton(el: WidgetElement, style: ElementStyle, content: string): string {
  const wrapStyles = [positionStyle(el), "display:flex", "align-items:center", "justify-content:center"];
  if (style.opacity !== undefined) wrapStyles.push(`opacity:${style.opacity}`);

  const btnStyles: string[] = [
    "border:none",
    "cursor:pointer",
    "width:100%",
    "height:100%",
  ];
  if (style.bgColor) btnStyles.push(`background:${style.bgColor}`);
  else btnStyles.push("background:#333");
  if (style.color) btnStyles.push(`color:${style.color}`);
  else btnStyles.push("color:#fff");
  if (style.fontSize) btnStyles.push(`font-size:${style.fontSize}`);
  if (style.fontWeight) btnStyles.push(`font-weight:${fontWeightValue(style.fontWeight)}`);
  if (style.borderRadius) btnStyles.push(`border-radius:${style.borderRadius}`);

  return `<div style="${wrapStyles.join(";")}"><button style="${btnStyles.join(";")}">${content}</button></div>`;
}

function renderIcon(el: WidgetElement, style: ElementStyle): string {
  const wrapStyles = [positionStyle(el), "display:flex", "align-items:center", "justify-content:center"];
  if (style.opacity !== undefined) wrapStyles.push(`opacity:${style.opacity}`);

  const color = style.color ?? "#333";
  const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="60%" height="60%" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="${esc(color)}" /></svg>`;

  return `<div style="${wrapStyles.join(";")}">${svgIcon}</div>`;
}

function renderContainer(el: WidgetElement, style: ElementStyle): string {
  const divStyles = [
    positionStyle(el),
    "border:1px solid rgba(0,0,0,0.12)",
    "box-sizing:border-box",
  ];
  if (style.bgColor) divStyles.push(`background:${style.bgColor}`);
  if (style.borderRadius) divStyles.push(`border-radius:${style.borderRadius}`);
  if (style.opacity !== undefined) divStyles.push(`opacity:${style.opacity}`);
  return `<div style="${divStyles.join(";")}"></div>`;
}

function renderShape(el: WidgetElement, style: ElementStyle): string {
  const divStyles = [positionStyle(el)];
  if (style.bgColor) divStyles.push(`background:${style.bgColor}`);
  if (style.borderRadius) divStyles.push(`border-radius:${style.borderRadius}`);
  if (style.opacity !== undefined) divStyles.push(`opacity:${style.opacity}`);
  return `<div style="${divStyles.join(";")}"></div>`;
}

function renderOther(el: WidgetElement, style: ElementStyle): string {
  const divStyles = [positionStyle(el)];
  if (style.bgColor) divStyles.push(`background:${style.bgColor}`);
  if (style.opacity !== undefined) divStyles.push(`opacity:${style.opacity}`);
  return `<div style="${divStyles.join(";")}"></div>`;
}

/** HTML-escape a string for use in attribute values */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Render a single element to HTML string.
 * canvasHeight is required to compute % heights correctly (kept in signature
 * for future use; all coordinates are already in % so no conversion is done).
 */
export function renderElement(
  el: WidgetElement,
  _canvasHeight: number,
  options?: Pick<RenderOptions, "demoMode" | "colorOverrides"> & {
    sampleData?: WidgetSampleData;
  }
): string {
  const overrides = options?.colorOverrides ?? {};
  const style = resolveStyle(el.style, overrides);

  let content = el.content ?? el.label ?? "";

  // Apply color overrides to content (e.g. inline hex colors in text)
  if (Object.keys(overrides).length > 0) {
    content = applyColorOverrides(content, overrides);
  }

  // Demo mode: replace [placeholder] tokens
  if (options?.demoMode && options.sampleData?.texts) {
    content = applyDemoText(content, options.sampleData.texts);
  }

  const demoImages: SampleDataImage[] =
    options?.demoMode && options.sampleData?.images ? options.sampleData.images : [];

  switch (el.type) {
    case "text":
      return renderText(el, style, content);
    case "image":
      return renderImage(el, style, demoImages);
    case "background":
      return renderBackground(el, style);
    case "button":
      return renderButton(el, style, content);
    case "icon":
      return renderIcon(el, style);
    case "container":
      return renderContainer(el, style);
    case "shape":
      return renderShape(el, style);
    case "input":
    case "other":
    default:
      return renderOther(el, style);
  }
}

/**
 * Render a complete widget to HTML string.
 * Used for both gallery preview and final page composition.
 */
export function renderWidget(widget: WidgetJSON, options?: RenderOptions): string {
  const { canvas, elements, html_body } = widget;

  // Fallback: legacy html_body when no elements defined
  if ((!elements || elements.length === 0) && html_body) {
    const sectionHtml = `<section id="${esc(widget.taxonomy_id.toLowerCase())}" style="position:relative;width:860px;height:${canvas.height}px;overflow:hidden;">${html_body}</section>`;
    if (options?.standalone) {
      return wrapStandalone(sectionHtml, canvas.height);
    }
    return sectionHtml;
  }

  // Sort elements by zIndex ascending so DOM order matches paint order
  const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  const elementHtml = sorted
    .map((el) =>
      renderElement(el, canvas.height, {
        demoMode: options?.demoMode,
        colorOverrides: options?.colorOverrides,
        sampleData: widget.sample_data,
      })
    )
    .join("\n");

  const sectionHtml = `<section id="${esc(widget.taxonomy_id.toLowerCase())}" style="position:relative;width:860px;height:${canvas.height}px;overflow:hidden;">\n${elementHtml}\n</section>`;

  if (options?.standalone) {
    return wrapStandalone(sectionHtml, canvas.height);
  }

  return sectionHtml;
}

function wrapStandalone(bodyContent: string, canvasHeight: number): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Widget Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://cdn.jsdelivr.net" />
  <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css" rel="stylesheet" />
  <style>
    :root {
      --brand-main: #333333;
      --accent: #666666;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #f0f0f0;
      font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      min-height: 100vh;
    }
    .page-canvas {
      width: 860px;
      min-height: ${canvasHeight}px;
      background: #fff;
      position: relative;
      overflow: hidden;
    }
    .img-placeholder {
      background: #c4c4c4;
    }
  </style>
</head>
<body>
  <div class="page-canvas">
    ${bodyContent}
  </div>
</body>
</html>`;
}
