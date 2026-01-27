import ColorHash from "color-hash";
import { forwardRef } from "react";

import { cn } from "../../lib/utils";
import { UserInfoWithRef } from "@/stores/room-state";

const hash = new ColorHash({ lightness: 0.3 });

export interface CursorProps {
  info: UserInfoWithRef;
}

export const Cursor = forwardRef<HTMLDivElement, CursorProps>(function Cursor(
  { info },
  ref
) {
  const color = hash.hex(info.userId);

  return (
    <div
      ref={ref}
      className={cn("fixed flex gap-1 rounded text-xs")}
      style={{
        transform: `translate(var(--x), var(--y))`,
      }}
    >
      <svg
        className="h-4 w-4"
        viewBox="0 0 96 104"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0.86065 0.697766L95.7812 51.5907L50.3553 59.6832L34.4976 103.014L0.86065 0.697766Z"
          fill={color}
        />
      </svg>

      <span
        className="relative -left-1.5 top-4 rounded-sm px-1.5 py-0.5 text-white"
        style={{ backgroundColor: color }}
      >
        {info.name}
      </span>
    </div>
  );
});
