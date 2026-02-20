import type { Bound, BoundType, BoundStyle, GeminiRawElement } from "./types";
import { BOX2D_SCALE } from "./constants";

export const ANALYZE_PROMPT = `You are a visual element detector for Korean product detail pages (상품 상세페이지).

Analyze the image and detect the design elements. Return bounding boxes using the box_2d format.

STEP 1 — SECTION BACKGROUNDS FIRST:
Identify every distinct background color or gradient region. Each background change marks a section boundary.
Detect these as type "background" elements FIRST, spanning the full width of that section.

STEP 2 — KEY ELEMENTS PER SECTION:
Within each section, detect only the KEY design elements: headings, body text blocks, product images, buttons, icons.

CRITICAL RULES FOR PRODUCT IMAGES:
- A product photo (제품 사진) is ONE "image" element. Do NOT detect text printed on or inside the product photo separately.
- Multiple products grouped together in one area = ONE "image" element labeled "제품셋 이미지".
- Only detect "text" elements for copywriting text that is part of the PAGE DESIGN (titles, descriptions, captions), NOT text that is part of a product photograph.

Rules:
1. Return ONLY a JSON array. No markdown, no explanation, no code fences.
2. Each object must use this exact format:
{
  "type": "text|image|background|button|icon|input|container|other",
  "label": "short Korean description of the element",
  "box_2d": [y_min, x_min, y_max, x_max],
  "zIndex": 0,
  "content": "actual text or visual description",
  "style": {
    "fontSize": "estimated size like 40px, 24px, 14px",
    "fontWeight": "normal|medium|semibold|bold",
    "color": "#hex color of text or foreground",
    "textAlign": "left|center|right",
    "bgColor": "#hex background color (if distinct)"
  }
}
3. box_2d coordinates are integers 0-1000 in [y_min, x_min, y_max, x_max] order.
   - 0 = top-left corner, 1000 = bottom-right corner
   - y_min: top edge, x_min: left edge, y_max: bottom edge, x_max: right edge
4. type classification:
   - "background": full-width colored/gradient area defining a section. ALWAYS detect these.
   - "text": page design text (heading, body, caption). NOT text inside product photos.
   - "image": product photo or illustration. One product = one image. Multiple products grouped = one image.
   - "button": clickable button with text
   - "icon": small graphic symbol
   - "container": card, box, or grouping area
   - "other": divider, badge, decorative element
5. z-index: background = 0, elements on top get higher values (1, 2, 3...).
6. label: short Korean name (e.g., "메인 타이틀", "제품 이미지", "제품셋 이미지", "섹션 배경", "CTA 버튼")
7. content: actual text for text elements, visual description for non-text elements.
8. style: estimate visual properties from what you see.
9. Aim for 15-40 elements total. Focus on meaningful design elements, not every tiny detail.
10. Bounding boxes must tightly fit the actual visual edges of each element.

Analyze the image now. Return ONLY the JSON array.`;

/**
 * Convert Gemini box_2d [y_min, x_min, y_max, x_max] (0-1000)
 * to Bound {x, y, w, h} (0-100%), with optional tile offset correction.
 */
export function box2dToBound(
  raw: GeminiRawElement,
  index: number,
  tileYOffsetPercent: number = 0,
  tileHeightPercent: number = 100
): Bound {
  const [yMin, xMin, yMax, xMax] = raw.box_2d;

  // Convert 0-1000 → 0-100% (within tile)
  const xPercent = (xMin / BOX2D_SCALE) * 100;
  const wPercent = ((xMax - xMin) / BOX2D_SCALE) * 100;
  const yInTilePercent = (yMin / BOX2D_SCALE) * 100;
  const hInTilePercent = ((yMax - yMin) / BOX2D_SCALE) * 100;

  // Map tile-local Y to global Y
  const yPercent = tileYOffsetPercent + (yInTilePercent / 100) * tileHeightPercent;
  const hPercent = (hInTilePercent / 100) * tileHeightPercent;

  const rawStyle = raw.style as Record<string, string> | undefined;
  const style: BoundStyle | undefined = rawStyle
    ? {
        fontSize: rawStyle.fontSize || undefined,
        fontWeight: rawStyle.fontWeight || undefined,
        color: rawStyle.color || undefined,
        textAlign: rawStyle.textAlign || undefined,
        bgColor: rawStyle.bgColor || undefined,
      }
    : undefined;

  return {
    id: `bound-${Date.now()}-${index}`,
    type: (raw.type as BoundType) || "other",
    label: raw.label || `Element ${index + 1}`,
    x: clamp(xPercent),
    y: clamp(yPercent),
    w: clamp(wPercent, 0.5),
    h: clamp(hPercent, 0.5),
    zIndex: raw.zIndex || 0,
    content: raw.content || "",
    ...(style && { style }),
  };
}

function clamp(value: number, min: number = 0, max: number = 100): number {
  return Math.max(min, Math.min(max, value));
}
