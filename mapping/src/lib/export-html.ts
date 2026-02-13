import type { Bound } from "./types";
import { BOUND_TYPE_COLORS } from "./constants";

export function generateHTML(imageSrc: string, bounds: Bound[]): string {
  const sorted = [...bounds].sort((a, b) => a.zIndex - b.zIndex);

  const boundElements = sorted
    .map((b) => {
      const color = BOUND_TYPE_COLORS[b.type];
      return `    <div
      style="
        position: absolute;
        left: ${b.x}%;
        top: ${b.y}%;
        width: ${b.w}%;
        height: ${b.h}%;
        z-index: ${b.zIndex + 10};
        border: 2px solid ${color};
        background-color: ${color}15;
        box-sizing: border-box;
      "
      title="${b.label}: ${(b.content || "").replace(/"/g, "&quot;")}"
    >
      <span style="
        position: absolute;
        top: -18px;
        left: 0;
        background: ${color};
        color: white;
        font-size: 10px;
        padding: 1px 4px;
        border-radius: 3px;
        white-space: nowrap;
        font-family: system-ui, sans-serif;
      ">${b.label}</span>
    </div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Image Analysis Export</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      min-height: 100vh;
      background: #f4f4f5;
      padding: 2rem;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .container {
      position: relative;
      display: inline-block;
    }
    .container img {
      display: block;
      max-width: 100%;
      height: auto;
    }
  </style>
</head>
<body>
  <div class="container">
    <img src="${imageSrc}" alt="Analyzed image" />
${boundElements}
  </div>
</body>
</html>`;
}

export function downloadHTML(imageSrc: string, bounds: Bound[], fileName: string) {
  const html = generateHTML(imageSrc, bounds);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName.replace(/\.[^.]+$/, "")}-analysis.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
