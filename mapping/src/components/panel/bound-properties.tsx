"use client";

import type { Bound, BoundType, BoundStyle } from "@/lib/types";
import { ALL_BOUND_TYPES, BOUND_TYPE_LABELS } from "@/lib/constants";

interface BoundPropertiesProps {
  bound: Bound;
  onUpdate: (id: string, patch: Partial<Omit<Bound, "id">>) => void;
}

export function BoundProperties({ bound, onUpdate }: BoundPropertiesProps) {
  const updateStyle = (key: keyof BoundStyle, value: string) => {
    onUpdate(bound.id, {
      style: { ...bound.style, [key]: value || undefined },
    });
  };

  return (
    <div className="flex flex-col gap-3 p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        Properties
      </h3>

      {/* Label */}
      <label className="flex flex-col gap-1">
        <span className="text-xs text-zinc-500">Label</span>
        <input
          type="text"
          value={bound.label}
          onChange={(e) => onUpdate(bound.id, { label: e.target.value })}
          className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />
      </label>

      {/* Type */}
      <label className="flex flex-col gap-1">
        <span className="text-xs text-zinc-500">Type</span>
        <select
          value={bound.type}
          onChange={(e) =>
            onUpdate(bound.id, { type: e.target.value as BoundType })
          }
          className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        >
          {ALL_BOUND_TYPES.map((t) => (
            <option key={t} value={t}>
              {BOUND_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </label>

      {/* Content */}
      <label className="flex flex-col gap-1">
        <span className="text-xs text-zinc-500">Content</span>
        <textarea
          value={bound.content || ""}
          onChange={(e) => onUpdate(bound.id, { content: e.target.value })}
          rows={3}
          className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />
      </label>

      {/* Position */}
      <div>
        <span className="text-xs text-zinc-500">Position (%)</span>
        <div className="mt-1 grid grid-cols-2 gap-2">
          {(["x", "y", "w", "h"] as const).map((key) => (
            <label key={key} className="flex items-center gap-1">
              <span className="w-4 text-[10px] font-medium uppercase text-zinc-400">
                {key}
              </span>
              <input
                type="number"
                value={Math.round(bound[key] * 100) / 100}
                onChange={(e) =>
                  onUpdate(bound.id, { [key]: Number(e.target.value) })
                }
                step={0.5}
                min={0}
                max={100}
                className="w-full rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-xs tabular-nums dark:border-zinc-700 dark:bg-zinc-800"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Z-index */}
      <label className="flex flex-col gap-1">
        <span className="text-xs text-zinc-500">Z-Index</span>
        <input
          type="number"
          value={bound.zIndex}
          onChange={(e) =>
            onUpdate(bound.id, { zIndex: Number(e.target.value) })
          }
          min={0}
          className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />
      </label>

      {/* Style */}
      <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Style
        </h3>

        <div className="flex flex-col gap-2">
          {/* Font Size */}
          <label className="flex items-center gap-2">
            <span className="w-16 text-[10px] text-zinc-400">fontSize</span>
            <input
              type="text"
              value={bound.style?.fontSize || ""}
              onChange={(e) => updateStyle("fontSize", e.target.value)}
              placeholder="40px"
              className="w-full rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-xs dark:border-zinc-700 dark:bg-zinc-800"
            />
          </label>

          {/* Font Weight */}
          <label className="flex items-center gap-2">
            <span className="w-16 text-[10px] text-zinc-400">weight</span>
            <select
              value={bound.style?.fontWeight || ""}
              onChange={(e) => updateStyle("fontWeight", e.target.value)}
              className="w-full rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-xs dark:border-zinc-700 dark:bg-zinc-800"
            >
              <option value="">-</option>
              <option value="normal">normal</option>
              <option value="medium">medium</option>
              <option value="semibold">semibold</option>
              <option value="bold">bold</option>
            </select>
          </label>

          {/* Color */}
          <label className="flex items-center gap-2">
            <span className="w-16 text-[10px] text-zinc-400">color</span>
            <div className="flex w-full items-center gap-1">
              <input
                type="color"
                value={bound.style?.color || "#ffffff"}
                onChange={(e) => updateStyle("color", e.target.value)}
                className="h-5 w-5 cursor-pointer rounded border border-zinc-200 dark:border-zinc-700"
              />
              <input
                type="text"
                value={bound.style?.color || ""}
                onChange={(e) => updateStyle("color", e.target.value)}
                placeholder="#FFFFFF"
                className="w-full rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-xs dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>
          </label>

          {/* Text Align */}
          <label className="flex items-center gap-2">
            <span className="w-16 text-[10px] text-zinc-400">align</span>
            <select
              value={bound.style?.textAlign || ""}
              onChange={(e) => updateStyle("textAlign", e.target.value)}
              className="w-full rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-xs dark:border-zinc-700 dark:bg-zinc-800"
            >
              <option value="">-</option>
              <option value="left">left</option>
              <option value="center">center</option>
              <option value="right">right</option>
            </select>
          </label>

          {/* Background Color */}
          <label className="flex items-center gap-2">
            <span className="w-16 text-[10px] text-zinc-400">bgColor</span>
            <div className="flex w-full items-center gap-1">
              <input
                type="color"
                value={bound.style?.bgColor || "#000000"}
                onChange={(e) => updateStyle("bgColor", e.target.value)}
                className="h-5 w-5 cursor-pointer rounded border border-zinc-200 dark:border-zinc-700"
              />
              <input
                type="text"
                value={bound.style?.bgColor || ""}
                onChange={(e) => updateStyle("bgColor", e.target.value)}
                placeholder="#111111"
                className="w-full rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-xs dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
