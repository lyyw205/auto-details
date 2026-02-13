import type { Bound } from "./types";

interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
  avgColor: [number, number, number];
  pixelCount: number;
}

function getImageData(
  imageSrc: string,
  maxDim: number = 200
): Promise<{ data: Uint8ClampedArray; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));
      ctx.drawImage(img, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      resolve({ data: imageData.data, width: w, height: h });
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageSrc;
  });
}

function colorDistance(
  a: [number, number, number],
  b: [number, number, number]
): number {
  return Math.sqrt(
    (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2
  );
}

function detectRegions(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  gridSize: number = 12
): Region[] {
  const cellW = Math.ceil(width / gridSize);
  const cellH = Math.ceil(height / gridSize);

  const grid: { color: [number, number, number]; label: number }[][] = [];

  for (let gy = 0; gy < gridSize; gy++) {
    grid[gy] = [];
    for (let gx = 0; gx < gridSize; gx++) {
      let r = 0,
        g = 0,
        b = 0,
        count = 0;
      const startX = gx * cellW;
      const startY = gy * cellH;
      const endX = Math.min(startX + cellW, width);
      const endY = Math.min(startY + cellH, height);

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const idx = (y * width + x) * 4;
          r += data[idx];
          g += data[idx + 1];
          b += data[idx + 2];
          count++;
        }
      }

      grid[gy][gx] = {
        color: [
          Math.round(r / count),
          Math.round(g / count),
          Math.round(b / count),
        ],
        label: -1,
      };
    }
  }

  // Flood-fill clustering by color similarity
  let labelCount = 0;
  const threshold = 40;

  for (let gy = 0; gy < gridSize; gy++) {
    for (let gx = 0; gx < gridSize; gx++) {
      if (grid[gy][gx].label !== -1) continue;

      const currentLabel = labelCount++;
      const queue: [number, number][] = [[gx, gy]];
      grid[gy][gx].label = currentLabel;

      while (queue.length > 0) {
        const [cx, cy] = queue.shift()!;
        const refColor = grid[cy][cx].color;

        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (
            nx >= 0 &&
            nx < gridSize &&
            ny >= 0 &&
            ny < gridSize &&
            grid[ny][nx].label === -1 &&
            colorDistance(refColor, grid[ny][nx].color) < threshold
          ) {
            grid[ny][nx].label = currentLabel;
            queue.push([nx, ny]);
          }
        }
      }
    }
  }

  // Bounding boxes per cluster
  const clusters = new Map<
    number,
    {
      minX: number;
      minY: number;
      maxX: number;
      maxY: number;
      rSum: number;
      gSum: number;
      bSum: number;
      count: number;
    }
  >();

  for (let gy = 0; gy < gridSize; gy++) {
    for (let gx = 0; gx < gridSize; gx++) {
      const label = grid[gy][gx].label;
      const color = grid[gy][gx].color;
      const existing = clusters.get(label);
      if (existing) {
        existing.minX = Math.min(existing.minX, gx);
        existing.minY = Math.min(existing.minY, gy);
        existing.maxX = Math.max(existing.maxX, gx);
        existing.maxY = Math.max(existing.maxY, gy);
        existing.rSum += color[0];
        existing.gSum += color[1];
        existing.bSum += color[2];
        existing.count++;
      } else {
        clusters.set(label, {
          minX: gx,
          minY: gy,
          maxX: gx,
          maxY: gy,
          rSum: color[0],
          gSum: color[1],
          bSum: color[2],
          count: 1,
        });
      }
    }
  }

  const regions: Region[] = [];
  clusters.forEach((c) => {
    const x = (c.minX / gridSize) * 100;
    const y = (c.minY / gridSize) * 100;
    const w = ((c.maxX - c.minX + 1) / gridSize) * 100;
    const h = ((c.maxY - c.minY + 1) / gridSize) * 100;

    if (w < 4 && h < 4) return;

    regions.push({
      x,
      y,
      w,
      h,
      avgColor: [
        Math.round(c.rSum / c.count),
        Math.round(c.gSum / c.count),
        Math.round(c.bSum / c.count),
      ],
      pixelCount: c.count,
    });
  });

  return regions;
}

export async function fallbackAnalyze(imageSrc: string): Promise<Bound[]> {
  const { data, width, height } = await getImageData(imageSrc);
  const regions = detectRegions(data, width, height);

  // Sort by area descending — larger regions get lower z-index
  regions.sort((a, b) => b.w * b.h - a.w * a.h);

  const bounds: Bound[] = regions.map((region, i) => {
    const [r, g, b] = region.avgColor;
    return {
      id: `bound-${Date.now()}-${i}`,
      type: "other" as const,
      label: `Region ${i + 1}`,
      x: Math.round(region.x * 100) / 100,
      y: Math.round(region.y * 100) / 100,
      w: Math.round(region.w * 100) / 100,
      h: Math.round(region.h * 100) / 100,
      zIndex: i,
      content: `rgb(${r},${g},${b})`,
    };
  });

  return bounds;
}
