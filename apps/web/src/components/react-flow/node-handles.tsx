"use client";

import { Fragment } from "react";
import { Handle, Position } from "@xyflow/react";

const HANDLE_POSITIONS = [
  Position.Top,
  Position.Bottom,
  Position.Left,
  Position.Right,
] as const;

interface NodeHandlesProps {
  /**
   * Whether handles should be visible. If false, they're invisible but still functional for connections.
   */
  visible?: boolean;
}

export function NodeHandles({ visible = true }: NodeHandlesProps) {
  const baseClassName = visible
    ? "!bg-primary/50 !h-3 !w-3"
    : "!pointer-events-none !opacity-0";

  const getPositionClassName = (pos: (typeof HANDLE_POSITIONS)[number]) => {
    if (!visible) return baseClassName;
    switch (pos) {
      case Position.Top:
        return `${baseClassName} !-top-1.5`;
      case Position.Bottom:
        return `${baseClassName} !-bottom-1.5`;
      case Position.Left:
        return `${baseClassName} !-left-1.5`;
      case Position.Right:
        return `${baseClassName} !-right-1.5`;
      default:
        return baseClassName;
    }
  };

  return (
    <>
      {HANDLE_POSITIONS.map((pos) => {
        const id = pos.toLowerCase();
        const className = getPositionClassName(pos);
        return (
          <Fragment key={`target-${pos}`}>
            <Handle
              type="target"
              position={pos}
              id={id}
              className={className}
            />
            <Handle
              type="source"
              position={pos}
              id={id}
              className={className}
            />
          </Fragment>
        );
      })}
    </>
  );
}
