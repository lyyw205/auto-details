import * as fs from "fs";
import * as path from "path";
import type { Bound } from "./types";
import { BOUND_TYPE_COLORS } from "./constants";

export function generateMappingHTML(
  imageBase64: string,
  mimeType: string,
  bounds: Bound[]
): string {
  const sorted = [...bounds].sort((a, b) => a.zIndex - b.zIndex);
  const imageSrc = `data:${mimeType};base64,${imageBase64}`;

  const boundElements = sorted
    .map((b) => {
      const color = BOUND_TYPE_COLORS[b.type] || "#6b7280";
      return `    <div
      class="bound"
      style="
        left: ${b.x}%;
        top: ${b.y}%;
        width: ${b.w}%;
        height: ${b.h}%;
        z-index: ${b.zIndex + 10};
        border-color: ${color};
        background-color: ${color}18;
      "
      data-id="${b.id}"
      data-type="${b.type}"
      title="${b.label}${b.content ? ": " + b.content.replace(/"/g, "&quot;") : ""}"
    >
      <span class="label" style="background: ${color};">${b.label}</span>
    </div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Image Mapping</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      min-height: 100vh;
      background: #18181b;
      padding: 2rem;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .container {
      position: relative;
      display: inline-block;
    }
    .container img {
      display: block;
      max-width: 90vw;
      max-height: 90vh;
      height: auto;
    }
    .bound {
      position: absolute;
      border: 2px solid;
      cursor: pointer;
      transition: background-color 0.15s;
    }
    .bound:hover {
      background-color: rgba(255,255,255,0.15) !important;
    }
    .label {
      position: absolute;
      top: -20px;
      left: 0;
      color: white;
      font-size: 10px;
      padding: 1px 5px;
      border-radius: 3px;
      white-space: nowrap;
      pointer-events: none;
      font-weight: 500;
    }
    .legend {
      position: fixed;
      bottom: 1rem;
      right: 1rem;
      background: #27272a;
      border: 1px solid #3f3f46;
      border-radius: 8px;
      padding: 12px 16px;
      color: #d4d4d8;
      font-size: 12px;
    }
    .legend h3 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #71717a;
      margin-bottom: 8px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 3px;
    }
    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 2px;
    }
  </style>
</head>
<body>
  <div class="container">
    <img src="${imageSrc}" alt="Mapped image" />
${boundElements}
  </div>
  <div class="legend">
    <h3>Elements (${bounds.length})</h3>
${sorted
  .map((b) => {
    const color = BOUND_TYPE_COLORS[b.type] || "#6b7280";
    return `    <div class="legend-item"><span class="legend-dot" style="background:${color}"></span>${b.label}</div>`;
  })
  .join("\n")}
  </div>
</body>
</html>`;
}

// CLI entry: node generate-mapping-html.ts <image> <bounds.json> <output.html>
if (require.main === module) {
  const [, , imagePath, boundsPath, outputPath] = process.argv;
  if (!imagePath || !boundsPath) {
    console.error("Usage: ts-node generate-mapping-html.ts <image> <bounds.json> [output.html]");
    process.exit(1);
  }

  const imageBuffer = fs.readFileSync(imagePath);
  const base64 = imageBuffer.toString("base64");
  const ext = path.extname(imagePath).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };
  const mimeType = mimeMap[ext] || "image/png";

  const bounds: Bound[] = JSON.parse(fs.readFileSync(boundsPath, "utf-8"));
  const html = generateMappingHTML(base64, mimeType, bounds);

  const out = outputPath || imagePath.replace(/\.[^.]+$/, "-mapping.html");
  fs.writeFileSync(out, html, "utf-8");
  console.log(`Written: ${out}`);
}
