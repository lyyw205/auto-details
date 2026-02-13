import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ANALYZE_PROMPT, box2dToBound } from "@/lib/gemini-prompt";
import { preprocessImage } from "@/lib/image-preprocess";
import { runDetectionPass } from "@/lib/detection-pass";
import { mergeBounds, deduplicateTileBounds } from "@/lib/merge-bounds";
import { GEMINI_MODEL, CANVAS_WIDTH } from "@/lib/constants";
import type { Bound, AnalyzeRequest, GeminiRawElement } from "@/lib/types";

export const maxDuration = 120; // 2-pass pipeline can take time with tiling

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your-api-key-here") {
      return NextResponse.json(
        { error: "NO_API_KEY", message: "GEMINI_API_KEY not configured" },
        { status: 422 }
      );
    }

    const body: AnalyzeRequest = await request.json();
    const { image, mediaType } = body;

    if (!image || !mediaType) {
      return NextResponse.json(
        { error: "Missing image or mediaType" },
        { status: 400 }
      );
    }

    // ── Step 0: Preprocess (860px resize + tiling) ──
    let preprocessed;
    try {
      preprocessed = await preprocessImage(image, mediaType);
      console.log(
        `[Preprocess] ${preprocessed.originalWidth}x${preprocessed.originalHeight} → ${preprocessed.resizedWidth}x${preprocessed.resizedHeight}, tiles: ${preprocessed.tiles.length}`
      );
    } catch (err) {
      console.error("[Preprocess] Failed:", err);
      return NextResponse.json(
        { error: "Image preprocessing failed", message: String(err) },
        { status: 500 }
      );
    }

    // ── Step 1: Gemini Pass (box_2d format) ──
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    let allGeminiBounds: Bound[] = [];
    let globalIndex = 0;

    for (const tile of preprocessed.tiles) {
      const result = await model.generateContent([
        ANALYZE_PROMPT,
        {
          inlineData: {
            mimeType: tile.mediaType,
            data: tile.base64,
          },
        },
      ]);

      const text = result.response.text();
      if (!text) continue;

      const cleaned = text
        .replace(/```(?:json)?\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
      const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
      if (!jsonMatch) continue;

      try {
        const rawElements: GeminiRawElement[] = JSON.parse(jsonMatch[0]);
        const tileBounds = rawElements.map((elem, i) =>
          box2dToBound(elem, globalIndex + i, tile.yOffsetPercent, tile.heightPercent)
        );
        allGeminiBounds.push(...tileBounds);
        globalIndex += rawElements.length;
      } catch {
        console.warn("[Pass 1] JSON parse failed for tile, skipping");
      }
    }

    // Deduplicate across tile overlaps
    if (preprocessed.isTiled) {
      allGeminiBounds = deduplicateTileBounds(allGeminiBounds);
    }

    console.log(`[Pass 1] Gemini: ${allGeminiBounds.length} bounds`);

    if (allGeminiBounds.length === 0) {
      return NextResponse.json(
        { error: "No elements detected by Gemini" },
        { status: 500 }
      );
    }

    // ── Step 2: HuggingFace Detection Pass ──
    let allDetections: import("@/lib/types").DetectionBox[] = [];

    try {
      for (const tile of preprocessed.tiles) {
        const tileHeight = Math.round(
          (tile.heightPercent / 100) * preprocessed.resizedHeight
        );
        const detections = await runDetectionPass(
          tile.buffer,
          CANVAS_WIDTH,
          tileHeight,
          tile.yOffsetPercent,
          tile.heightPercent
        );
        allDetections.push(...detections);
      }
    } catch (err) {
      console.warn("[Pass 2] Detection pass failed, using Pass 1 only:", err);
      allDetections = [];
    }

    // ── Step 3: Merge ──
    let finalBounds: Bound[];
    let pipeline;

    try {
      const mergeResult = mergeBounds(allGeminiBounds, allDetections);
      finalBounds = mergeResult.bounds;
      pipeline = {
        pass1Count: mergeResult.stats.pass1Count,
        pass2Count: mergeResult.stats.pass2Count,
        mergedCount: mergeResult.stats.mergedCount,
        tilesUsed: preprocessed.tiles.length,
      };
      console.log(
        `[Merge] ${pipeline.pass1Count} Gemini + ${pipeline.pass2Count} HF → ${pipeline.mergedCount} total`
      );
    } catch (err) {
      console.warn("[Merge] Failed, using Pass 1 only:", err);
      finalBounds = allGeminiBounds;
      pipeline = {
        pass1Count: allGeminiBounds.length,
        pass2Count: 0,
        mergedCount: allGeminiBounds.length,
        tilesUsed: preprocessed.tiles.length,
      };
    }

    return NextResponse.json({
      bounds: finalBounds,
      method: "vision",
      pipeline,
    });
  } catch (error) {
    console.error("Analyze error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
