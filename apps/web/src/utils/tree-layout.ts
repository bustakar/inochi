import { Edge, Node, Position } from "@xyflow/react";

const GRID_X_SPACING = 180; // Slightly wider for better spacing
const GRID_Y_SPACING = 160; // Slightly taller for labels

/**
 * layoutElements
 * Custom grid layout for "Classic RPG" look.
 * Forces nodes into strict rows based on difficulty/tier.
 */
export const layoutElements = (
  nodes: Node[],
  edges: Edge[],
  options: { direction?: "TB" | "BT" } = {}
) => {
  const direction = options.direction || "BT"; // Bottom-to-Top

  // Group nodes by difficulty
  const nodesByDifficulty = new Map<number, Node[]>();
  
  nodes.forEach((node) => {
    // Assuming difficulty is in data.difficulty
    const difficulty = (node.data as any).difficulty || 1;
    if (!nodesByDifficulty.has(difficulty)) {
      nodesByDifficulty.set(difficulty, []);
    }
    nodesByDifficulty.get(difficulty)?.push(node);
  });

  // Sort difficulties
  const difficulties = Array.from(nodesByDifficulty.keys()).sort((a, b) => a - b);
  
  const layoutedNodes: Node[] = [];

  difficulties.forEach((difficulty, rowIndex) => {
    const rowNodes = nodesByDifficulty.get(difficulty) || [];
    // Sort row nodes by title for deterministic order
    rowNodes.sort((a, b) => {
        const titleA = (a.data.title as string) || "";
        const titleB = (b.data.title as string) || "";
        return titleA.localeCompare(titleB);
    });

    // Center the row
    const rowWidth = (rowNodes.length - 1) * GRID_X_SPACING;
    const startX = -rowWidth / 2;

    // Calculate Y based on direction
    let y = 0;
    if (direction === "BT") {
       // Bottom-to-Top: Higher difficulties at top (smaller Y), Lower at bottom (larger Y)
       // difficulties array is sorted [1, 2, 3...]
       // We want difficulty 1 at bottom.
       // So we map index 0 (diff 1) to max Y.
       const inverseRowIndex = difficulties.length - 1 - rowIndex;
       y = inverseRowIndex * GRID_Y_SPACING;
    } else {
       // Top-to-Bottom: Difficulty 1 at top (Y=0)
       y = rowIndex * GRID_Y_SPACING;
    }

    rowNodes.forEach((node, colIndex) => {
      const x = startX + colIndex * GRID_X_SPACING;
      
      layoutedNodes.push({
        ...node,
        position: { x, y },
        targetPosition: direction === "BT" ? Position.Bottom : Position.Top,
        sourcePosition: direction === "BT" ? Position.Top : Position.Bottom,
      });
    });
  });

  return { nodes: layoutedNodes, edges };
};
