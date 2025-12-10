/**
 * Shared React Flow configuration constants for exercise trees
 */

export const TREE_EDGE_STYLE = {
  strokeWidth: 3,
  strokeDasharray: "8 4",
} as const;

export const DEFAULT_EDGE_OPTIONS = {
  type: "smoothstep" as const,
  style: TREE_EDGE_STYLE,
} as const;
