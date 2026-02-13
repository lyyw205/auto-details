import type { Bound, DetectionBox } from "./types";
import { IOU_MATCH_THRESHOLD, IOU_HIGH_CONFIDENCE } from "./constants";
import { labelToBoundType } from "./detection-pass";

interface MergeResult {
  bounds: Bound[];
  stats: {
    pass1Count: number;
    pass2Count: number;
    refined: number;
    added: number;
    mergedCount: number;
  };
}

/**
 * Calculate Intersection over Union (IoU) between a Bound (% coords)
 * and a DetectionBox (% coords).
 */
function calculateIoU(bound: Bound, det: DetectionBox): number {
  // Convert Bound {x, y, w, h} to {xmin, ymin, xmax, ymax}
  const bx1 = bound.x;
  const by1 = bound.y;
  const bx2 = bound.x + bound.w;
  const by2 = bound.y + bound.h;

  const dx1 = det.box.xmin;
  const dy1 = det.box.ymin;
  const dx2 = det.box.xmax;
  const dy2 = det.box.ymax;

  // Intersection
  const ix1 = Math.max(bx1, dx1);
  const iy1 = Math.max(by1, dy1);
  const ix2 = Math.min(bx2, dx2);
  const iy2 = Math.min(by2, dy2);

  if (ix2 <= ix1 || iy2 <= iy1) return 0;

  const interArea = (ix2 - ix1) * (iy2 - iy1);
  const boundArea = (bx2 - bx1) * (by2 - by1);
  const detArea = (dx2 - dx1) * (dy2 - dy1);
  const unionArea = boundArea + detArea - interArea;

  return unionArea > 0 ? interArea / unionArea : 0;
}

/**
 * Merge Pass 1 (Gemini) bounds with Pass 2 (HuggingFace) detections.
 *
 * Strategy:
 * - IoU >= IOU_HIGH_CONFIDENCE (0.5): Use detection coords + Gemini semantics
 * - IoU 0.3~0.5: Keep Gemini coords (matched but not refined)
 * - IoU < 0.3: No match
 * - Unmatched detections: Add as new elements
 */
export function mergeBounds(
  geminiBounds: Bound[],
  detections: DetectionBox[]
): MergeResult {
  if (detections.length === 0) {
    return {
      bounds: geminiBounds,
      stats: {
        pass1Count: geminiBounds.length,
        pass2Count: 0,
        refined: 0,
        added: 0,
        mergedCount: geminiBounds.length,
      },
    };
  }

  const merged = [...geminiBounds];
  const matchedDetIndices = new Set<number>();
  let refined = 0;

  // Match each Gemini bound with best-IoU detection
  for (let bi = 0; bi < merged.length; bi++) {
    let bestIoU = 0;
    let bestDetIdx = -1;

    for (let di = 0; di < detections.length; di++) {
      if (matchedDetIndices.has(di)) continue;
      const iou = calculateIoU(merged[bi], detections[di]);
      if (iou > bestIoU) {
        bestIoU = iou;
        bestDetIdx = di;
      }
    }

    if (bestDetIdx >= 0 && bestIoU >= IOU_MATCH_THRESHOLD) {
      matchedDetIndices.add(bestDetIdx);

      if (bestIoU >= IOU_HIGH_CONFIDENCE) {
        // High confidence: use detection coordinates, keep Gemini semantics
        const det = detections[bestDetIdx];
        merged[bi] = {
          ...merged[bi],
          x: det.box.xmin,
          y: det.box.ymin,
          w: det.box.xmax - det.box.xmin,
          h: det.box.ymax - det.box.ymin,
        };
        refined++;
      }
      // IoU 0.3~0.5: keep Gemini coords as-is (matched but not refined)
    }
  }

  // Add unmatched detections as new elements
  let added = 0;
  for (let di = 0; di < detections.length; di++) {
    if (matchedDetIndices.has(di)) continue;

    const det = detections[di];
    const w = det.box.xmax - det.box.xmin;
    const h = det.box.ymax - det.box.ymin;

    // Skip very small detections (likely noise)
    if (w < 1 || h < 0.5) continue;

    merged.push({
      id: `bound-hf-${Date.now()}-${di}`,
      type: labelToBoundType(det.label),
      label: det.label,
      x: det.box.xmin,
      y: det.box.ymin,
      w,
      h,
      zIndex: 1,
      content: "",
    });
    added++;
  }

  return {
    bounds: merged,
    stats: {
      pass1Count: geminiBounds.length,
      pass2Count: detections.length,
      refined,
      added,
      mergedCount: merged.length,
    },
  };
}

/**
 * Deduplicate bounds from overlapping tile regions.
 * When tiles overlap, the same element may be detected in both tiles.
 * We keep the one with the larger area (better detection).
 */
export function deduplicateTileBounds(allBounds: Bound[]): Bound[] {
  if (allBounds.length <= 1) return allBounds;

  const result: Bound[] = [];
  const used = new Set<number>();

  for (let i = 0; i < allBounds.length; i++) {
    if (used.has(i)) continue;

    let best = allBounds[i];
    let bestArea = best.w * best.h;

    for (let j = i + 1; j < allBounds.length; j++) {
      if (used.has(j)) continue;

      const iou = calculateIoUBounds(best, allBounds[j]);
      if (iou >= IOU_MATCH_THRESHOLD) {
        used.add(j);
        const jArea = allBounds[j].w * allBounds[j].h;
        if (jArea > bestArea) {
          best = allBounds[j];
          bestArea = jArea;
        }
      }
    }

    result.push(best);
  }

  return result;
}

/** IoU between two Bound objects (both in % coords) */
function calculateIoUBounds(a: Bound, b: Bound): number {
  const ax2 = a.x + a.w;
  const ay2 = a.y + a.h;
  const bx2 = b.x + b.w;
  const by2 = b.y + b.h;

  const ix1 = Math.max(a.x, b.x);
  const iy1 = Math.max(a.y, b.y);
  const ix2 = Math.min(ax2, bx2);
  const iy2 = Math.min(ay2, by2);

  if (ix2 <= ix1 || iy2 <= iy1) return 0;

  const interArea = (ix2 - ix1) * (iy2 - iy1);
  const aArea = a.w * a.h;
  const bArea = b.w * b.h;
  const unionArea = aArea + bArea - interArea;

  return unionArea > 0 ? interArea / unionArea : 0;
}
