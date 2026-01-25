"use client";

import { UserInfoPayload } from "@null-void/shared";

interface MembersPanelProps {
  isAdmin: boolean;
  members: UserInfoPayload[];
  onRemoveMember: (userId: string) => void;
}

function getRoleColor(role: UserInfoPayload["role"]) {
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

export default function MembersPanel({
  members,
  isAdmin,
  onRemoveMember,
}: MembersPanelProps) {
  return (
    <div className="space-y-2">
      {members.map((member) => (
        <div
          key={member.userId}
          className="flex items-center justify-between gap-2 p-3 bg-background rounded border border-border hover:border-primary/30 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${"bg-green-500"}`} />

              <p className="text-xs font-medium text-foreground truncate">
                {member.name}
              </p>
            </div>

            <p
              className={`text-xs px-2 py-0.5 rounded w-fit mt-1 ${getRoleColor(member.role)}`}
            >
              {member.role}
            </p>
          </div>

          {isAdmin && member.userId !== "1" && (
            <button
              onClick={() => onRemoveMember(member.userId)}
              className="text-xs px-2 py-1 text-destructive hover:bg-destructive/10 rounded transition-colors"
            >
              Remove
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
