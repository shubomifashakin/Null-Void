"use client";

import { UserInfoPayload } from "@null-void/shared";

import { getRoleColor } from "@/lib/utils";

interface MembersPanelProps {
  isAdmin: boolean;
  members: UserInfoPayload[];
  totalConnectedUsers: number;
  onRemoveMember: (userId: string) => void;
}

export default function MembersPanel({
  members,
  isAdmin,
  onRemoveMember,
  totalConnectedUsers,
}: MembersPanelProps) {
  return (
    <div className="border-t border-border pt-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">
        Active Members ({totalConnectedUsers})
      </h3>

      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member.userId}
            className="flex items-center justify-between gap-2 p-3 bg-background rounded border border-border hover:border-primary/30 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
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
                className="text-xs px-2 py-1 cursor-pointer text-destructive hover:bg-destructive/10 rounded transition-colors"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
