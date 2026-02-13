import type { BoundType, DetectionBox } from "./types";
import { HF_MODEL, HF_MIN_CONFIDENCE } from "./constants";

/** English candidate labels grouped by BoundType for zero-shot detection */
const TYPE_LABELS: Record<string, string[]> = {
  text: ["heading", "text block", "paragraph", "caption"],
  image: ["photograph", "product image"],
  button: ["button"],
  icon: ["icon", "small graphic"],
  container: ["card", "panel"],
};

/** All candidate labels flattened */
const ALL_LABELS = Object.values(TYPE_LABELS).flat();

/** Reverse lookup: English label → BoundType */
const LABEL_TO_TYPE: Record<string, BoundType> = {};
for (const [type, labels] of Object.entries(TYPE_LABELS)) {
  for (const label of labels) {
    LABEL_TO_TYPE[label] = type as BoundType;
  }
}

/**
 * Classify a detection label to a BoundType.
 */
export function labelToBoundType(label: string): BoundType {
  return LABEL_TO_TYPE[label] || "other";
}

/** Raw HuggingFace API response element */
interface HFDetectionResult {
  label: string;
  score: number;
  box: { xmin: number; ymin: number; xmax: number; ymax: number };
}

/**
 * Run HuggingFace zero-shot object detection on an image tile
 * using the raw Inference API.
 *
 * Returns detections with coordinates converted to global percentage.
 */
export async function runDetectionPass(
  imageBuffer: Buffer,
  tileWidth: number,
  tileHeight: number,
  tileYOffsetPercent: number = 0,
  tileHeightPercent: number = 100
): Promise<DetectionBox[]> {
  const hfToken = process.env.HF_TOKEN;
  if (!hfToken) {
    console.log("[Pass 2] HF_TOKEN not set — skipping detection pass");
    return [];
  }

  try {
    const response = await fetch(
      `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: `data:image/png;base64,${imageBuffer.toString("base64")}`,
          parameters: {
            candidate_labels: ALL_LABELS,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[Pass 2] HuggingFace API error ${response.status}: ${errText}`);
      return [];
    }

    const result: HFDetectionResult[] = await response.json();

    // Filter by confidence and convert to percentage coordinates
    const detections: DetectionBox[] = [];

    for (const det of result) {
      if (det.score < HF_MIN_CONFIDENCE) continue;

      // Convert pixel → tile-local percentage → global percentage
      const xMinPct = (det.box.xmin / tileWidth) * 100;
      const yMinLocal = (det.box.ymin / tileHeight) * 100;
      const xMaxPct = (det.box.xmax / tileWidth) * 100;
      const yMaxLocal = (det.box.ymax / tileHeight) * 100;

      // Map to global Y
      const yMinGlobal = tileYOffsetPercent + (yMinLocal / 100) * tileHeightPercent;
      const yMaxGlobal = tileYOffsetPercent + (yMaxLocal / 100) * tileHeightPercent;

      detections.push({
        label: det.label,
        score: det.score,
        box: {
          xmin: xMinPct,
          ymin: yMinGlobal,
          xmax: xMaxPct,
          ymax: yMaxGlobal,
        },
      });
    }

    console.log(`[Pass 2] Detected ${detections.length} elements (from ${result.length} raw)`);
    return detections;
  } catch (error) {
    console.warn("[Pass 2] HuggingFace detection failed:", error);
    return [];
  }
}
