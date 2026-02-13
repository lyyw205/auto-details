import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ANALYZE_PROMPT } from "@/lib/gemini-prompt";
import { GEMINI_MODEL } from "@/lib/constants";
import type { Bound, AnalyzeRequest } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your-api-key-here") {
      return NextResponse.json(
        { error: "NO_API_KEY", message: "GEMINI_API_KEY not configured" },
        { status: 422 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const body: AnalyzeRequest = await request.json();
    const { image, mediaType } = body;

    if (!image || !mediaType) {
      return NextResponse.json(
        { error: "Missing image or mediaType" },
        { status: 400 }
      );
    }

    const result = await model.generateContent([
      ANALYZE_PROMPT,
      {
        inlineData: {
          mimeType: mediaType,
          data: image,
        },
      },
    ]);

    const text = result.response.text();
    if (!text) {
      return NextResponse.json(
        { error: "No response from Gemini" },
        { status: 500 }
      );
    }

    // Strip markdown code fences if present
    const cleaned = text.replace(/```(?:json)?\s*/g, "").replace(/```\s*/g, "").trim();

    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Could not parse JSON from response", raw: text },
        { status: 500 }
      );
    }

    const rawBounds = JSON.parse(jsonMatch[0]);
    const bounds: Bound[] = rawBounds.map(
      (b: Record<string, unknown>, i: number) => {
        const rawStyle = b.style as Record<string, string> | undefined;
        return {
          id: `bound-${Date.now()}-${i}`,
          type: b.type || "other",
          label: b.label || `Element ${i + 1}`,
          x: Number(b.x) || 0,
          y: Number(b.y) || 0,
          w: Number(b.w) || 10,
          h: Number(b.h) || 10,
          zIndex: Number(b.zIndex) || 0,
          content: (b.content as string) || "",
          ...(rawStyle && {
            style: {
              fontSize: rawStyle.fontSize || undefined,
              fontWeight: rawStyle.fontWeight || undefined,
              color: rawStyle.color || undefined,
              textAlign: rawStyle.textAlign || undefined,
              bgColor: rawStyle.bgColor || undefined,
            },
          }),
        };
      }
    );

    return NextResponse.json({ bounds, method: "vision" });
  } catch (error) {
    console.error("Analyze error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
