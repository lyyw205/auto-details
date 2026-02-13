"use client";

import type { BoundType } from "@/lib/types";
import { BOUND_TYPE_COLORS, BOUND_TYPE_LABELS } from "@/lib/constants";

interface TypeBadgeProps {
  type: BoundType;
  size?: "sm" | "md";
}

export function TypeBadge({ type, size = "sm" }: TypeBadgeProps) {
  const color = BOUND_TYPE_COLORS[type];
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm"
      }`}
      style={{
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      {BOUND_TYPE_LABELS[type]}
    </span>
  );
}
