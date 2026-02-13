import sharp from "sharp";
import type { PreprocessedImage, ImageTile } from "./types";
import { CANVAS_WIDTH, TILE_HEIGHT, TILE_OVERLAP, TALL_IMAGE_RATIO } from "./constants";

/**
 * Preprocess image: resize to 860px width + tile if tall.
 * - Always resizes to CANVAS_WIDTH (860px) maintaining aspect ratio
 * - If height/width > TALL_IMAGE_RATIO, splits into overlapping tiles
 */
export async function preprocessImage(
  base64Data: string,
  mediaType: string
): Promise<PreprocessedImage> {
  const inputBuffer = Buffer.from(base64Data, "base64");
  const metadata = await sharp(inputBuffer).metadata();
  const originalWidth = metadata.width!;
  const originalHeight = metadata.height!;

  // Resize to 860px width, maintaining aspect ratio, always output PNG for consistency
  const resizedBuffer = await sharp(inputBuffer)
    .resize({ width: CANVAS_WIDTH, withoutEnlargement: false })
    .png()
    .toBuffer();

  const resizedMeta = await sharp(resizedBuffer).metadata();
  const resizedWidth = resizedMeta.width!;
  const resizedHeight = resizedMeta.height!;

  const ratio = resizedHeight / resizedWidth;
  const isTiled = ratio > TALL_IMAGE_RATIO;

  let tiles: ImageTile[];

  const outputMediaType = "image/png";

  if (!isTiled) {
    // Single tile — whole image
    const base64 = resizedBuffer.toString("base64");
    tiles = [
      {
        buffer: resizedBuffer,
        base64,
        mediaType: outputMediaType,
        yOffsetPercent: 0,
        heightPercent: 100,
      },
    ];
  } else {
    // Split into overlapping tiles
    tiles = [];
    const step = TILE_HEIGHT - TILE_OVERLAP;
    let yStart = 0;

    while (yStart < resizedHeight) {
      const tileH = Math.min(TILE_HEIGHT, resizedHeight - yStart);
      const tileBuffer = await sharp(resizedBuffer)
        .extract({ left: 0, top: yStart, width: resizedWidth, height: tileH })
        .toBuffer();

      const base64 = tileBuffer.toString("base64");
      const yOffsetPercent = (yStart / resizedHeight) * 100;
      const heightPercent = (tileH / resizedHeight) * 100;

      tiles.push({
        buffer: tileBuffer,
        base64,
        mediaType: outputMediaType,
        yOffsetPercent,
        heightPercent,
      });

      yStart += step;
      // Stop if we've covered the entire image
      if (yStart + TILE_OVERLAP >= resizedHeight) break;
    }
  }

  return {
    tiles,
    originalWidth,
    originalHeight,
    resizedWidth,
    resizedHeight,
    isTiled,
  };
}
