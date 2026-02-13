"use client";

import { useState, useCallback } from "react";
import type { InteractionMode, AnalyzeMethod, AnalyzeRequest, AnalyzeResponse } from "@/lib/types";
import { downloadHTML } from "@/lib/export-html";
import { boundsToWidgetHTML } from "@/lib/bounds-to-widget";
import { fallbackAnalyze } from "@/lib/fallback-analyze";
import { useBounds } from "@/hooks/use-bounds";
import { useImageUpload } from "@/hooks/use-image-upload";
import { useCanvasInteractions } from "@/hooks/use-canvas-interactions";
import { useKeyboard } from "@/hooks/use-keyboard";
import { UploadDropzone } from "./upload/upload-dropzone";
import { Toolbar } from "./toolbar";
import { CanvasContainer } from "./canvas/canvas-container";
import { SidePanel } from "./panel/side-panel";

export function AppShell() {
  const { image, error: imageError, processFile } = useImageUpload();
  const {
    bounds,
    canUndo,
    canRedo,
    setAll,
    addBound,
    updateBound,
    deleteBound,
    undo,
    redo,
  } = useBounds();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<InteractionMode>("select");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeStep, setAnalyzeStep] = useState<AnalyzeMethod | null>(null);
  const [analyzeMessage, setAnalyzeMessage] = useState<string | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [lastMethod, setLastMethod] = useState<AnalyzeMethod | null>(null);
  const [pipelineInfo, setPipelineInfo] = useState<string | null>(null);

  const {
    containerRef,
    drawRect,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleBoundPointerDown,
    handleResizePointerDown,
  } = useCanvasInteractions({
    bounds,
    mode,
    onAddBound: addBound,
    onUpdateBound: updateBound,
    selectedId,
    onSelect: setSelectedId,
  });

  useKeyboard({
    selectedId,
    onDelete: (id) => {
      deleteBound(id);
      setSelectedId(null);
    },
    onUndo: undo,
    onRedo: redo,
    canUndo,
    canRedo,
  });

  // 3-step cascading analysis: Vision API → Fallback → Manual
  const handleAnalyze = useCallback(async () => {
    if (!image) return;
    setIsAnalyzing(true);
    setAnalyzeError(null);

    // ── Step 1: 2-Pass Pipeline (Gemini box_2d + HF Detection) ──
    setAnalyzeStep("vision");
    setAnalyzeMessage("Preprocessing image + running 2-pass pipeline...");
    setPipelineInfo(null);

    try {
      const base64 = image.src.split(",")[1];
      const mediaType = image.src.split(";")[0].split(":")[1] as AnalyzeRequest["mediaType"];

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mediaType }),
      });

      if (res.ok) {
        const data: AnalyzeResponse = await res.json();
        setAll(data.bounds);
        setSelectedId(null);
        setLastMethod("vision");
        if (data.pipeline) {
          setPipelineInfo(
            `${data.pipeline.pass1Count} Gemini → ${data.pipeline.pass2Count} HF → ${data.pipeline.mergedCount} total (${data.pipeline.tilesUsed} tile${data.pipeline.tilesUsed > 1 ? "s" : ""})`
          );
        }
        setAnalyzeMessage(null);
        setAnalyzeStep(null);
        setIsAnalyzing(false);
        return;
      }

      // Check if it's a no-API-key error or other failure
      const errorData = await res.json().catch(() => ({ error: "Unknown" }));
      const reason =
        errorData.error === "NO_API_KEY"
          ? "API key not configured"
          : errorData.message || errorData.error || "API call failed";

      console.warn(`Vision API failed: ${reason}. Falling back to auto-detect.`);
      setAnalyzeMessage(`Vision API failed (${reason}). Trying auto-detect...`);
    } catch (err) {
      const reason = err instanceof Error ? err.message : "Network error";
      console.warn(`Vision API error: ${reason}. Falling back to auto-detect.`);
      setAnalyzeMessage(`Vision API error. Trying auto-detect...`);
    }

    // ── Step 2: Fallback auto-detect ──
    setAnalyzeStep("fallback");
    setAnalyzeMessage("Analyzing image regions by color...");

    try {
      const detectedBounds = await fallbackAnalyze(image.src);

      if (detectedBounds.length > 0) {
        setAll(detectedBounds);
        setSelectedId(null);
        setLastMethod("fallback");
        setAnalyzeMessage(null);
        setAnalyzeStep(null);
        setIsAnalyzing(false);
        return;
      }

      setAnalyzeMessage("No regions detected. Switching to manual mode...");
    } catch (err) {
      console.warn("Fallback analyze failed:", err);
      setAnalyzeMessage("Auto-detect failed. Switching to manual mode...");
    }

    // ── Step 3: Manual mode ──
    setAnalyzeStep("manual");
    setAnalyzeMessage(null);
    setLastMethod("manual");
    setMode("draw");

    // Brief delay to show the step indicator before clearing
    await new Promise((r) => setTimeout(r, 800));

    setAnalyzeStep(null);
    setIsAnalyzing(false);
    setAnalyzeError(
      "Auto-analysis could not detect elements. Use Draw mode to manually create bounds."
    );
  }, [image, setAll]);

  const handleExport = useCallback(() => {
    if (!image || bounds.length === 0) return;
    downloadHTML(image.src, bounds, image.fileName);
  }, [image, bounds]);

  const handleExportWidget = useCallback(() => {
    if (!image || bounds.length === 0) return;
    const baseName = image.fileName.replace(/\.[^.]+$/, "");

    // 1. Download bounds JSON
    const jsonBlob = new Blob([JSON.stringify(bounds, null, 2)], { type: "application/json" });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const jsonLink = document.createElement("a");
    jsonLink.href = jsonUrl;
    jsonLink.download = `${baseName}.bounds.json`;
    document.body.appendChild(jsonLink);
    jsonLink.click();
    document.body.removeChild(jsonLink);
    URL.revokeObjectURL(jsonUrl);

    // 2. Estimate section height from image aspect ratio (860px wide canvas)
    const sectionHeight = Math.round((image.naturalHeight / image.naturalWidth) * 860);

    // 3. Generate widget HTML
    const widgetHTML = boundsToWidgetHTML(bounds, {
      widgetId: `section--ref-${baseName}`,
      taxonomyId: "Custom",
      category: "custom",
      sourceRef: `ref-${baseName}`,
      sectionHeight,
    });
    const widgetBlob = new Blob([widgetHTML], { type: "text/html" });
    const widgetUrl = URL.createObjectURL(widgetBlob);
    const widgetLink = document.createElement("a");
    widgetLink.href = widgetUrl;
    widgetLink.download = `${baseName}.widget.html`;
    document.body.appendChild(widgetLink);
    widgetLink.click();
    document.body.removeChild(widgetLink);
    URL.revokeObjectURL(widgetUrl);
  }, [image, bounds]);

  const handleSelect = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  // Upload screen
  if (!image) {
    return <UploadDropzone onFile={processFile} error={imageError} />;
  }

  return (
    <div className="flex h-screen flex-col">
      <Toolbar
        mode={mode}
        onModeChange={setMode}
        onAnalyze={handleAnalyze}
        onUndo={undo}
        onRedo={redo}
        onExport={handleExport}
        onExportWidget={handleExportWidget}
        canUndo={canUndo}
        canRedo={canRedo}
        isAnalyzing={isAnalyzing}
        analyzeStep={analyzeStep}
        analyzeMessage={analyzeMessage}
        hasImage={!!image}
        hasBounds={bounds.length > 0}
        lastMethod={lastMethod}
      />

      {pipelineInfo && !isAnalyzing && (
        <div className="flex items-center justify-between bg-blue-50 px-4 py-1.5 text-xs text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
          <span>Pipeline: {pipelineInfo}</span>
          <button
            onClick={() => setPipelineInfo(null)}
            className="ml-4 rounded px-2 py-0.5 text-[10px] font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30"
          >
            Dismiss
          </button>
        </div>
      )}

      {analyzeError && (
        <div className="flex items-center justify-between bg-amber-50 px-4 py-2 text-sm text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
          <span>{analyzeError}</span>
          <button
            onClick={() => setAnalyzeError(null)}
            className="ml-4 rounded px-2 py-0.5 text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-900/30"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <CanvasContainer
          imageSrc={image.src}
          bounds={bounds}
          selectedId={selectedId}
          mode={mode}
          drawRect={drawRect}
          containerRef={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onBoundPointerDown={handleBoundPointerDown}
          onResizePointerDown={handleResizePointerDown}
        />

        <SidePanel
          bounds={bounds}
          selectedId={selectedId}
          onSelect={handleSelect}
          onDelete={(id) => {
            deleteBound(id);
            if (selectedId === id) setSelectedId(null);
          }}
          onUpdate={updateBound}
        />
      </div>
    </div>
  );
}
