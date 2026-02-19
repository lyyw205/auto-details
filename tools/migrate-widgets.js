#!/usr/bin/env node
/**
 * migrate-widgets.js
 *
 * Converts all .widget.html files in widgets/ to .widget.json format.
 *
 * For each file:
 *   1. Parses <!--WIDGET_META {...} --> comment for metadata
 *   2. Extracts <section> HTML body
 *   3. Does best-effort element extraction (text, image, button, background)
 *   4. Writes .widget.json alongside the .widget.html (does NOT delete HTML)
 *
 * Usage: node tools/migrate-widgets.js
 */

"use strict";

const fs = require("fs");
const path = require("path");

// ── Config ──────────────────────────────────────────────────────────────────

const WIDGETS_DIR = path.resolve(__dirname, "../widgets");
const CANVAS_WIDTH = 860;
const DEFAULT_HEIGHT = 700;

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Recursively find all .widget.html files under a directory,
 * excluding node_modules and _presets.
 */
function findWidgetHtmlFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    if (entry.name === "node_modules" || entry.name === "_presets") continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findWidgetHtmlFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".widget.html")) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Extract the JSON object from <!--WIDGET_META ... --> comment.
 * Returns parsed object or throws on failure.
 */
function parseWidgetMeta(content) {
  const match = content.match(/<!--WIDGET_META\s*([\s\S]*?)\s*-->/);
  if (!match) throw new Error("WIDGET_META comment not found");
  return JSON.parse(match[1]);
}

/**
 * Extract the <section ...>...</section> HTML body (everything after the
 * WIDGET_META comment, trimmed).
 */
function extractHtmlBody(content) {
  // Remove the WIDGET_META block and trim
  const withoutMeta = content.replace(/<!--WIDGET_META[\s\S]*?-->/, "").trim();
  // Expect <section ...> as the root element
  const sectionMatch = withoutMeta.match(/<section[\s\S]*<\/section>/i);
  return sectionMatch ? sectionMatch[0].trim() : withoutMeta;
}

/**
 * Estimate section height (px) from inline style attributes like
 *   style="min-height: 700px;"  or  style="height: 500px;"
 * Falls back to DEFAULT_HEIGHT.
 */
function estimateHeight(htmlBody) {
  const minH = htmlBody.match(/min-height:\s*(\d+)px/i);
  if (minH) return parseInt(minH[1], 10);

  // Tailwind class like min-h-[500px]
  const tailwindMinH = htmlBody.match(/min-h-\[(\d+)px\]/);
  if (tailwindMinH) return parseInt(tailwindMinH[1], 10);

  // Explicit height class like h-[600px] on <section
  const sectionTag = htmlBody.match(/<section[^>]*>/i);
  if (sectionTag) {
    const hClass = sectionTag[0].match(/\bh-\[(\d+)px\]/);
    if (hClass) return parseInt(hClass[1], 10);
  }

  return DEFAULT_HEIGHT;
}

/**
 * Detect layout type from the section's class/style attributes.
 * Returns "split" | "stack" | "grid" | "stack" (default).
 */
function detectLayout(htmlBody) {
  const sectionTag = (htmlBody.match(/<section[^>]*>/i) || [""])[0];
  if (/grid-cols-2/.test(sectionTag)) return "split";
  if (/grid/.test(sectionTag)) return "grid";
  if (/flex-row/.test(sectionTag)) return "split";
  return "stack";
}

/**
 * Very lightweight "DOM"-style attribute extractor.
 * Returns an array of { tag, attrs, text } objects for all matched tags.
 */
function extractTags(html, tagPattern) {
  const results = [];
  // Match opening tag + content until matching close tag (non-nested, best effort)
  const re = new RegExp(
    `<(${tagPattern})([^>]*)>([\\s\\S]*?)<\\/(?:${tagPattern})>`,
    "gi"
  );
  let m;
  while ((m = re.exec(html)) !== null) {
    results.push({
      tag: m[1].toLowerCase(),
      attrs: m[2],
      innerHtml: m[3],
      text: m[3].replace(/<[^>]+>/g, "").trim(),
    });
  }
  return results;
}

/**
 * Extract value of a data-* attribute from an attrs string.
 */
function getDataAttr(attrs, name) {
  const re = new RegExp(`data-${name}="([^"]*)"`, "i");
  const m = attrs.match(re);
  return m ? m[1] : undefined;
}

/**
 * Extract inline style property value, e.g. getStyleProp(attrs, "color") → "#222222"
 */
function getStyleProp(combined, prop) {
  const re = new RegExp(`${prop}:\\s*([^;,"]+)`, "i");
  const m = combined.match(re);
  return m ? m[1].trim() : undefined;
}

/**
 * Extract hex color or rgb(...) from a string.
 */
function extractColor(str) {
  if (!str) return undefined;
  const m = str.match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)/);
  return m ? m[0] : undefined;
}

/**
 * Identify composition from meta (with fallback to HTML analysis).
 */
function resolveComposition(meta, htmlBody) {
  if (meta.composition) return meta.composition;
  const layout = detectLayout(htmlBody);
  if (layout === "split") return "split";
  return "stack";
}

// ── Element Extraction ───────────────────────────────────────────────────────

/**
 * Convert a .widget.html <section> body into a best-effort WidgetElement[].
 *
 * Strategy:
 *   - background: from section's background style
 *   - images: img-placeholder divs
 *   - text elements: h1/h2/h3/h4/h5/h6, p (with text content)
 *   - buttons: <button>, <a> with btn/button class
 *
 * Coordinates are estimated as % values based on DOM order + layout type.
 * This is explicitly best-effort; html_body is always kept as fallback.
 */
function extractElements(htmlBody, canvasHeight) {
  const elements = [];
  let zIndex = 0;

  const layout = detectLayout(htmlBody);

  // ── 1. Background ──────────────────────────────────────────────────────────
  const sectionTag = (htmlBody.match(/<section([^>]*)>/i) || ["", ""])[1];
  const sectionStyle = (sectionTag.match(/style="([^"]*)"/) || [, ""])[1];
  const bgColor = extractColor(getStyleProp(sectionStyle, "background(?:-color)?"));
  const bgGradient = sectionStyle.includes("gradient")
    ? (sectionStyle.match(/linear-gradient\([^)]+\)/) || [undefined])[0] ||
      (sectionStyle.match(/background:\s*([^;]+gradient[^;]*)/) || [, undefined])[1]
    : undefined;

  if (bgColor || bgGradient) {
    elements.push({
      id: "bg",
      type: "background",
      label: "섹션 배경",
      x: 0,
      y: 0,
      w: 100,
      h: 100,
      zIndex: zIndex++,
      style: {
        bgColor: bgColor || undefined,
        gradient: bgGradient || undefined,
      },
    });
  }

  // ── 2. Images (img-placeholder divs) ───────────────────────────────────────
  const imgRe = /<div[^>]+class="[^"]*img-placeholder[^"]*"([^>]*)>([\s\S]*?)<\/div>/gi;
  let imgMatch;
  let imgIndex = 0;
  while ((imgMatch = imgRe.exec(htmlBody)) !== null) {
    const attrStr = imgMatch[1];
    const innerContent = imgMatch[2];

    const aiPrompt = getDataAttr(attrStr, "ai-prompt") || "";
    const aiStyle = getDataAttr(attrStr, "ai-style") || "";
    const aiRatio = getDataAttr(attrStr, "ai-ratio") || "";

    // Label from <span class="img-label">
    const labelMatch = innerContent.match(/<span[^>]*class="[^"]*img-label[^"]*"[^>]*>([^<]*)<\/span>/i);
    const label = labelMatch ? labelMatch[1].trim() : `이미지 ${imgIndex + 1}`;

    // Estimate position based on layout and index
    let x, y, w, h;
    if (layout === "split") {
      // Left half for first image (split-lr), right for split-rl
      x = imgIndex % 2 === 0 ? 2 : 52;
      y = 10;
      w = 46;
      h = 80;
    } else {
      // Stack: centered image
      x = 5;
      y = elements.length > 1 ? 40 : 30;
      w = 90;
      h = 50;
    }

    elements.push({
      id: `img_${imgIndex}`,
      type: "image",
      label,
      x,
      y,
      w,
      h,
      zIndex: zIndex++,
      placeholder: {
        ai_prompt: aiPrompt,
        ...(aiStyle ? { ai_style: aiStyle } : {}),
        ...(aiRatio ? { ai_ratio: aiRatio } : {}),
      },
    });
    imgIndex++;
  }

  // ── 3. Text Elements (headings + paragraphs) ───────────────────────────────
  const textTags = extractTags(htmlBody, "h[1-6]|p");
  let textOrder = 0;

  // For split layout, text column starts at x=52 (right side)
  const textColX = layout === "split" ? 52 : 10;
  const textColW = layout === "split" ? 46 : 80;

  // Distribute text elements vertically across the top 80% of canvas
  // leaving room for images detected above
  const hasImage = imgIndex > 0;
  const textStartY = hasImage && layout !== "split" ? 5 : 5;
  const textBand = layout === "split" ? 90 : (hasImage ? 25 : 80);
  const textStep = textTags.length > 0 ? textBand / (textTags.length + 1) : 10;

  for (const el of textTags) {
    const text = el.text;
    if (!text) {
      textOrder++;
      continue;
    }

    // Skip purely decorative or empty elements
    if (text.length < 1) {
      textOrder++;
      continue;
    }

    const isHeading = /^h[1-6]$/.test(el.tag);
    const styleAttr = (el.attrs.match(/style="([^"]*)"/) || [, ""])[1];
    const colorValue = extractColor(getStyleProp(styleAttr, "color"));

    // Font size estimation
    let fontSize = undefined;
    const fsPx = el.attrs.match(/text-\[(\d+)px\]/) ||
                 styleAttr.match(/font-size:\s*(\d+)px/i);
    if (fsPx) fontSize = `${fsPx[1]}px`;
    else if (el.tag === "h1") fontSize = "36px";
    else if (el.tag === "h2") fontSize = "28px";
    else if (el.tag === "h3") fontSize = "22px";
    else if (isHeading) fontSize = "18px";

    // Font weight
    let fontWeight = undefined;
    if (/font-bold/.test(el.attrs)) fontWeight = "bold";
    else if (/font-semibold/.test(el.attrs)) fontWeight = "semibold";
    else if (/font-medium/.test(el.attrs)) fontWeight = "medium";
    else if (isHeading) fontWeight = "bold";

    // Text align
    let textAlign = undefined;
    if (/text-left/.test(el.attrs)) textAlign = "left";
    else if (/text-right/.test(el.attrs)) textAlign = "right";
    else if (/text-center/.test(el.attrs)) textAlign = "center";

    const yPos = textStartY + textStep * (textOrder + 1);

    elements.push({
      id: `text_${textOrder}`,
      type: "text",
      label: isHeading ? `제목 (${el.tag})` : "텍스트",
      x: textColX,
      y: Math.min(yPos, 90),
      w: textColW,
      h: Math.max(textStep - 2, 5),
      zIndex: zIndex++,
      content: text,
      style: {
        ...(fontSize ? { fontSize } : {}),
        ...(fontWeight ? { fontWeight } : {}),
        ...(colorValue ? { color: colorValue } : {}),
        ...(textAlign ? { textAlign } : {}),
      },
    });
    textOrder++;
  }

  // ── 4. Buttons ─────────────────────────────────────────────────────────────
  const buttonTags = extractTags(htmlBody, "button|a");
  let btnIndex = 0;
  for (const el of buttonTags) {
    const text = el.text;
    if (!text) continue;
    // Only include if it looks like a button (has btn class or is a <button>)
    if (el.tag !== "button" && !/\bbtn\b/.test(el.attrs) && !/button/.test(el.attrs)) {
      continue;
    }

    const styleAttr = (el.attrs.match(/style="([^"]*)"/) || [, ""])[1];
    const bgColor2 = extractColor(getStyleProp(styleAttr, "background(?:-color)?"));
    const colorValue = extractColor(getStyleProp(styleAttr, "color"));

    elements.push({
      id: `btn_${btnIndex}`,
      type: "button",
      label: `버튼: ${text.slice(0, 30)}`,
      x: 30,
      y: 85,
      w: 40,
      h: 8,
      zIndex: zIndex++,
      content: text,
      style: {
        ...(bgColor2 ? { bgColor: bgColor2 } : {}),
        ...(colorValue ? { color: colorValue } : {}),
        borderRadius: "8px",
        fontWeight: "semibold",
      },
    });
    btnIndex++;
  }

  return elements;
}

// ── figma_hints generation ───────────────────────────────────────────────────

/**
 * Generate figma_hints from composition, elements, and copywriting_guide.
 */
function generateFigmaHints(meta, elements, htmlBody) {
  const composition = meta.composition || resolveComposition(meta, htmlBody);
  const layout = detectLayout(htmlBody);

  let layout_structure = "";
  if (composition === "split" || layout === "split") {
    layout_structure = "2-column split layout (image left / text right). Canvas 860px.";
  } else if (composition === "stack") {
    layout_structure = "Single-column stacked layout, centered content. Canvas 860px.";
  } else if (composition === "composed") {
    layout_structure = "Composed layout with overlapping elements. Canvas 860px.";
  } else {
    layout_structure = `${composition || "stack"} layout. Canvas 860px.`;
  }

  const key_elements = [];

  // Add from elements array
  const imgEls = elements.filter((e) => e.type === "image");
  const textEls = elements.filter((e) => e.type === "text");
  const btnEls = elements.filter((e) => e.type === "button");

  if (imgEls.length > 0) {
    key_elements.push(`${imgEls.length}개 이미지 플레이스홀더`);
  }
  if (textEls.length > 0) {
    const headings = textEls.filter((e) => e.label.startsWith("제목")).length;
    const bodies = textEls.length - headings;
    if (headings > 0) key_elements.push(`제목 텍스트 ${headings}개`);
    if (bodies > 0) key_elements.push(`본문 텍스트 ${bodies}개`);
  }
  if (btnEls.length > 0) {
    key_elements.push(`버튼 ${btnEls.length}개`);
  }

  // Add from style_tags / copywriting_guide
  if (meta.style_tags && meta.style_tags.length > 0) {
    key_elements.push(`스타일: ${meta.style_tags.join(", ")}`);
  }
  if (meta.copywriting_guide) {
    // Add truncated guide as a hint
    const guide = meta.copywriting_guide.slice(0, 120);
    key_elements.push(`카피 가이드: ${guide}`);
  }

  return {
    layout_structure,
    key_elements,
  };
}

// ── Main Migration ───────────────────────────────────────────────────────────

function migrateFile(htmlFilePath) {
  const content = fs.readFileSync(htmlFilePath, "utf8");

  // 1. Parse metadata
  const meta = parseWidgetMeta(content);

  // 2. Extract HTML body
  const htmlBody = extractHtmlBody(content);

  // 3. Estimate canvas height
  const canvasHeight = estimateHeight(htmlBody);

  // 4. Extract elements (best effort)
  const elements = extractElements(htmlBody, canvasHeight);

  // 5. Generate figma_hints
  const figmaHints = generateFigmaHints(meta, elements, htmlBody);

  // 6. Assemble WidgetJSON
  const widgetJson = {
    widget_id: meta.widget_id,
    taxonomy_id: meta.taxonomy_id,
    category: meta.category,
    style_tags: meta.style_tags || [],
    theme: meta.theme || "light",
    composition: meta.composition || resolveComposition(meta, htmlBody),
    provenance: meta.provenance,
    status: meta.status || "new",

    ...(meta.copywriting_guide
      ? { copywriting_guide: meta.copywriting_guide }
      : {}),

    canvas: {
      width: CANVAS_WIDTH,
      height: canvasHeight,
    },

    elements,

    // Legacy fallback
    html_body: htmlBody,

    figma_hints: figmaHints,

    ...(meta.sample_data ? { sample_data: meta.sample_data } : {}),
  };

  // 7. Write .widget.json
  const jsonFilePath = htmlFilePath.replace(/\.widget\.html$/, ".widget.json");
  fs.writeFileSync(jsonFilePath, JSON.stringify(widgetJson, null, 2), "utf8");

  return jsonFilePath;
}

function main() {
  console.log(`Scanning for .widget.html files in: ${WIDGETS_DIR}\n`);

  const files = findWidgetHtmlFiles(WIDGETS_DIR);
  console.log(`Found ${files.length} .widget.html file(s)\n`);

  let success = 0;
  let failed = 0;
  const errors = [];

  for (const filePath of files) {
    const relPath = path.relative(process.cwd(), filePath);
    try {
      const outPath = migrateFile(filePath);
      const relOut = path.relative(process.cwd(), outPath);
      console.log(`  OK  ${relPath}`);
      console.log(`   -> ${relOut}`);
      success++;
    } catch (err) {
      console.error(`  FAIL ${relPath}`);
      console.error(`       ${err.message}`);
      errors.push({ file: relPath, error: err.message });
      failed++;
    }
  }

  console.log("\n─────────────────────────────────");
  console.log(`Total:   ${files.length}`);
  console.log(`Success: ${success}`);
  console.log(`Failed:  ${failed}`);
  if (errors.length > 0) {
    console.log("\nFailed files:");
    for (const e of errors) {
      console.log(`  ${e.file}: ${e.error}`);
    }
  }
  console.log("─────────────────────────────────");

  process.exit(failed > 0 ? 1 : 0);
}

main();
