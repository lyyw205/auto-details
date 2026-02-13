"use client";

import type { Bound } from "@/lib/types";
import { BoundList } from "./bound-list";
import { BoundProperties } from "./bound-properties";

interface SidePanelProps {
  bounds: Bound[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Omit<Bound, "id">>) => void;
}

export function SidePanel({
  bounds,
  selectedId,
  onSelect,
  onDelete,
  onUpdate,
}: SidePanelProps) {
  const selectedBound = bounds.find((b) => b.id === selectedId) || null;

  return (
    <aside className="flex w-72 flex-col border-l border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Elements ({bounds.length})
        </h2>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        <BoundList
          bounds={bounds}
          selectedId={selectedId}
          onSelect={onSelect}
          onDelete={onDelete}
        />
      </div>

      {/* Properties */}
      {selectedBound && (
        <div className="border-t border-zinc-200 dark:border-zinc-800">
          <BoundProperties bound={selectedBound} onUpdate={onUpdate} />
        </div>
      )}
    </aside>
  );
}
