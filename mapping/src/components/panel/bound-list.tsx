"use client";

import type { Bound } from "@/lib/types";
import { BoundListItem } from "./bound-list-item";

interface BoundListProps {
  bounds: Bound[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function BoundList({
  bounds,
  selectedId,
  onSelect,
  onDelete,
}: BoundListProps) {
  const sorted = [...bounds].sort((a, b) => b.zIndex - a.zIndex);

  if (sorted.length === 0) {
    return (
      <div className="px-3 py-6 text-center text-sm text-zinc-400">
        No elements detected yet.
        <br />
        Upload an image and click Analyze.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 p-2">
      {sorted.map((bound) => (
        <BoundListItem
          key={bound.id}
          bound={bound}
          isSelected={bound.id === selectedId}
          onSelect={onSelect}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
