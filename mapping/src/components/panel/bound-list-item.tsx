"use client";

import type { Bound } from "@/lib/types";
import { TypeBadge } from "@/components/shared/type-badge";

interface BoundListItemProps {
  bound: Bound;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function BoundListItem({
  bound,
  isSelected,
  onSelect,
  onDelete,
}: BoundListItemProps) {
  return (
    <div
      onClick={() => onSelect(bound.id)}
      className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors
        ${
          isSelected
            ? "bg-blue-50 ring-1 ring-blue-200 dark:bg-blue-950/30 dark:ring-blue-800"
            : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
        }`}
    >
      <TypeBadge type={bound.type} />
      <span className="flex-1 truncate text-zinc-700 dark:text-zinc-300">
        {bound.label}
      </span>
      <span className="text-[10px] text-zinc-400">z:{bound.zIndex}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(bound.id);
        }}
        className="rounded p-0.5 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
        title="Delete"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
