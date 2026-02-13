"use client";

import type { AnalyzeMethod, InteractionMode } from "@/lib/types";
import { IconButton } from "./shared/icon-button";
import { LoadingSpinner } from "./shared/loading-spinner";

interface ToolbarProps {
  mode: InteractionMode;
  onModeChange: (mode: InteractionMode) => void;
  onAnalyze: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onExportWidget: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isAnalyzing: boolean;
  analyzeStep: AnalyzeMethod | null;
  analyzeMessage: string | null;
  hasImage: boolean;
  hasBounds: boolean;
  lastMethod: AnalyzeMethod | null;
}

const STEP_LABELS: Record<AnalyzeMethod, string> = {
  vision: "Pass 1: Gemini box_2d + Pass 2: HF Detection",
  fallback: "Fallback: Auto-detect",
  manual: "Manual Mode",
};

const STEP_COLORS: Record<AnalyzeMethod, string> = {
  vision: "text-blue-600 dark:text-blue-400",
  fallback: "text-amber-600 dark:text-amber-400",
  manual: "text-emerald-600 dark:text-emerald-400",
};

const METHOD_BADGES: Record<AnalyzeMethod, { label: string; className: string }> = {
  vision: {
    label: "2-Pass Pipeline",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  fallback: {
    label: "Auto-detect",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
  manual: {
    label: "Manual",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
};

export function Toolbar({
  mode,
  onModeChange,
  onAnalyze,
  onUndo,
  onRedo,
  onExport,
  onExportWidget,
  canUndo,
  canRedo,
  isAnalyzing,
  analyzeStep,
  analyzeMessage,
  hasImage,
  hasBounds,
  lastMethod,
}: ToolbarProps) {
  return (
    <header className="flex flex-col border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center gap-1 px-3 py-1.5">
        {/* Logo */}
        <span className="mr-3 text-sm font-bold text-zinc-800 dark:text-zinc-200">
          Mapping
        </span>

        <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700" />

        {/* Mode toggle */}
        <div className="ml-2 flex rounded-md border border-zinc-200 dark:border-zinc-700">
          <button
            onClick={() => onModeChange("select")}
            className={`px-2.5 py-1 text-xs font-medium transition-colors ${
              mode === "select"
                ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            Select
          </button>
          <button
            onClick={() => onModeChange("draw")}
            className={`border-l border-zinc-200 px-2.5 py-1 text-xs font-medium transition-colors dark:border-zinc-700 ${
              mode === "draw"
                ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            Draw
          </button>
        </div>

        <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700 ml-1" />

        {/* Analyze */}
        <IconButton
          label="Analyze image (2-Pass Pipeline → Auto-detect → Manual)"
          onClick={onAnalyze}
          disabled={!hasImage || isAnalyzing}
          className="ml-1 text-blue-600 dark:text-blue-400"
        >
          {isAnalyzing ? (
            <LoadingSpinner size={14} />
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          )}
          <span>Analyze</span>
        </IconButton>

        {/* Last method badge */}
        {lastMethod && !isAnalyzing && (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${METHOD_BADGES[lastMethod].className}`}
          >
            {METHOD_BADGES[lastMethod].label}
          </span>
        )}

        <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700 ml-1" />

        {/* Undo / Redo */}
        <IconButton label="Undo (Ctrl+Z)" onClick={onUndo} disabled={!canUndo}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7v6h6" />
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
          </svg>
        </IconButton>
        <IconButton label="Redo (Ctrl+Shift+Z)" onClick={onRedo} disabled={!canRedo}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 7v6h-6" />
            <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
          </svg>
        </IconButton>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Export Overlay */}
        <IconButton
          label="Export overlay HTML"
          onClick={onExport}
          disabled={!hasBounds}
          className="text-zinc-500 dark:text-zinc-400"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7,10 12,15 17,10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>Overlay</span>
        </IconButton>

        {/* Export Widget */}
        <IconButton
          label="Export JSON + Widget HTML"
          onClick={onExportWidget}
          disabled={!hasBounds}
          className="text-emerald-600 dark:text-emerald-400"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14,2 14,8 20,8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <span>Widget</span>
        </IconButton>
      </div>

      {/* Step progress bar */}
      {isAnalyzing && analyzeStep && (
        <div className="flex items-center gap-2 border-t border-zinc-100 px-3 py-1 dark:border-zinc-800/50">
          <LoadingSpinner size={12} />
          <span className={`text-xs font-medium ${STEP_COLORS[analyzeStep]}`}>
            {STEP_LABELS[analyzeStep]}
          </span>
          {analyzeMessage && (
            <span className="text-xs text-zinc-400">
              — {analyzeMessage}
            </span>
          )}
        </div>
      )}
    </header>
  );
}
