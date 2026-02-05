"use client";

import { Role } from "@/types/room";
import { UserInfoPayload } from "@null-void/shared";

interface CurrentUserPanelProps {
  user: UserInfoPayload;
  onLeaveRoom: () => void;
}

function getRoleColor(role: Role) {
  switch (role) {
    case "ADMIN":
      return "bg-primary/10 text-primary";

    case "EDITOR":
      return "bg-blue-500/10 text-blue-600";

    case "VIEWER":
      return "bg-muted text-muted-foreground";

    default:
      return "bg-muted text-muted-foreground";
  }
}

export default function CurrentUserPanel({
  user,
  onLeaveRoom,
}: CurrentUserPanelProps) {
  return (
    <div className="p-4 border-b border-border space-y-3 bg-background">
      <div>
        <p className="text-xs font-semibold text-muted-foreground capitalize">
          You
        </p>

        <div className="flex gap-x-3 items-center">
          <h3 className="text-sm font-semibold text-foreground mt-1">
            {user.name}
          </h3>

          <span
            className={`inline-block text-xs px-2 py-1 rounded ${getRoleColor(user.role)}`}
          >
            {user.role}
          </span>
        </div>
      </div>

      <button
        onClick={onLeaveRoom}
        className="w-full cursor-pointer px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 border border-destructive/30 rounded transition-colors"
      >
        Leave Room
      </button>
    </div>
  );
}
