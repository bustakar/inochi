import { Edge, Node, Position } from "@xyflow/react";

const GRID_X_SPACING = 250; // Wider horizontal spacing for clarity
const GRID_Y_SPACING = 160; // Vertical spacing

// Internal type for layout calculation
type LayoutNode = {
  id: string;
  node?: Node;
  rank: number;
  isDummy: boolean;
  x: number;
  sources: string[]; // IDs of connected nodes from lower ranks
  targets: string[]; // IDs of connected nodes from higher ranks
};

/**
 * layoutElements
 * Smarter grid layout that prevents edge crossings and overlaps.
 * Uses "Dummy Nodes" to reserve space for edges passing through layers.
 */
export const layoutElements = (
  nodes: Node[],
  edges: Edge[],
  options: { direction?: "TB" | "BT" } = {},
) => {
  const direction = options.direction || "BT";

  // --- 1. Initialize Layout Graph ---
  const rows = new Map<number, LayoutNode[]>();
  const nodeMap = new Map<string, LayoutNode>();

  const getRow = (r: number) => {
    if (!rows.has(r)) rows.set(r, []);
    return rows.get(r)!;
  };

  // Initialize real nodes
  nodes.forEach((node) => {
    // Fallback to 1 if difficulty is missing
    const rank = (node.data as any).difficulty || 1;
    const entry: LayoutNode = {
      id: node.id,
      node,
      rank,
      isDummy: false,
      x: 0,
      sources: [],
      targets: [],
    };
    nodeMap.set(node.id, entry);
    getRow(rank).push(entry);
  });

  // --- 2. Insert Dummy Nodes for Long Edges ---
  // This reserves space in intermediate rows for edges that skip levels (e.g. 5 -> 7)
  edges.forEach((edge) => {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);

    if (source && target) {
      const diff = target.rank - source.rank;

      // If spanning more than 1 rank (e.g. 5->7, diff=2)
      if (diff > 1) {
        let prevId = source.id;

        // Create dummies for each skipped rank
        for (let r = source.rank + 1; r < target.rank; r++) {
          const dummyId = `__dummy_${edge.id}_${r}`;
          const dummy: LayoutNode = {
            id: dummyId,
            rank: r,
            isDummy: true,
            x: 0,
            sources: [prevId],
            targets: [],
          };

          // Link dummy to layout graph
          nodeMap.set(dummyId, dummy);
          getRow(r).push(dummy);

          // Update connectivity for layout heuristic
          // (We fake the connections so the layout algo aligns them)
          const prevNode = nodeMap.get(prevId);
          if (prevNode) {
            // Redirect previous node's target to this dummy
            // If it was the source, remove the original long-distance target
            if (prevId === source.id) {
              source.targets = source.targets.filter((t) => t !== target.id);
            }
            prevNode.targets.push(dummyId);
          }

          prevId = dummyId;
        }

        // Connect last dummy to final target
        const lastDummy = nodeMap.get(prevId);
        if (lastDummy) lastDummy.targets.push(target.id);
        target.sources.push(prevId);
      } else {
        // Standard edge (diff <= 1)
        source.targets.push(target.id);
        target.sources.push(source.id);
      }
    }
  });

  // --- 3. Iterative Layout (Barycenter Heuristic) ---
  // We sweep up and down, aligning nodes to the average X of their neighbors.
  const ranks = Array.from(rows.keys()).sort((a, b) => a - b);
  const ITERATIONS = 4;

  // Initial random spread to prevent stacking at 0
  rows.forEach((row) => {
    row.sort((a, b) => {
      // Put dummies in middle? Or just deterministic sort
      if (a.isDummy && !b.isDummy) return 1;
      if (!a.isDummy && b.isDummy) return -1;
      return a.id.localeCompare(b.id);
    });
    // Spread them out initially
    row.forEach((n, i) => (n.x = i * GRID_X_SPACING));
  });

  for (let i = 0; i < ITERATIONS; i++) {
    // Down Sweep (Align with parents/targets - e.g. pull inputs towards outputs)
    // Note: In 'BT' (Bottom-Top), "targets" are usually visually above.
    // We iterate High Rank -> Low Rank to align lower nodes with their upper parents
    [...ranks].reverse().forEach((r) => {
      const row = rows.get(r)!;
      row.forEach((n) => {
        if (n.targets.length > 0) {
          const sum = n.targets.reduce(
            (acc, id) => acc + (nodeMap.get(id)?.x || 0),
            0,
          );
          n.x = sum / n.targets.length;
        }
      });
      resolveOverlaps(row);
    });

    // Up Sweep (Align with children/sources)
    ranks.forEach((r) => {
      const row = rows.get(r)!;
      row.forEach((n) => {
        if (n.sources.length > 0) {
          const sum = n.sources.reduce(
            (acc, id) => acc + (nodeMap.get(id)?.x || 0),
            0,
          );
          n.x = sum / n.sources.length;
        }
      });
      resolveOverlaps(row);
    });
  }

  // Final Center Pass (Center the whole tree around 0)
  const allNodes = Array.from(nodeMap.values());
  if (allNodes.length > 0) {
    const minX = Math.min(...allNodes.map((n) => n.x));
    const maxX = Math.max(...allNodes.map((n) => n.x));
    const centerOffset = (minX + maxX) / 2;
    allNodes.forEach((n) => (n.x -= centerOffset));
  }

  // --- 4. Output Result ---
  const layoutedNodes: Node[] = [];
  const maxRank = Math.max(...ranks, 1);
  const minRank = Math.min(...ranks, 1);

  nodes.forEach((node) => {
    const entry = nodeMap.get(node.id);
    if (entry) {
      let y = 0;
      // Calculate Y based on rank and direction
      if (direction === "BT") {
        // Rank 1 at Bottom (Highest Y value)
        // If MaxRank is 10, Rank 1 is at Y = (10-1)*Spacing
        y = (maxRank - entry.rank) * GRID_Y_SPACING;
      } else {
        // Rank 1 at Top (Y=0)
        y = (entry.rank - minRank) * GRID_Y_SPACING;
      }

      layoutedNodes.push({
        ...node,
        position: { x: entry.x, y },
        targetPosition: direction === "BT" ? Position.Bottom : Position.Top,
        sourcePosition: direction === "BT" ? Position.Top : Position.Bottom,
      });
    }
  });

  return { nodes: layoutedNodes, edges };
};

/**
 * Helper: Sorts row by X and ensures minimum spacing
 */
function resolveOverlaps(row: LayoutNode[]) {
  // 1. Sort by requested X
  row.sort((a, b) => a.x - b.x);

  // 2. Push apart to ensure GRID_X_SPACING
  for (let i = 0; i < row.length - 1; i++) {
    const curr = row[i];
    const next = row[i + 1];
    if (next.x < curr.x + GRID_X_SPACING) {
      next.x = curr.x + GRID_X_SPACING;
    }
  }

  // 3. Optional: Center the group to prevent drifting right?
  // For simplicity, we just spread. The global center pass handles the drift.
}
