"use client";

import { useState } from "react";
import { Role } from "@/types/room";
import { UserInfoPayload } from "@null-void/shared";

import { getRoleColor } from "@/lib/utils";
import { toast } from "sonner";

interface MembersPanelProps {
  isAdmin: boolean;
  members: UserInfoPayload[];
  totalConnectedUsers: number;
  onRemoveMember: (userId: string) => void;
}

interface MembersPanelProps {
  isAdmin: boolean;
  members: UserInfoPayload[];
  onRemoveMember: (userId: string) => void;
  onPromoteMember: (userId: string, newRole: Role) => void;
}

export default function MembersPanel({
  members,
  isAdmin,
  onRemoveMember,
  onPromoteMember,
  totalConnectedUsers,
}: MembersPanelProps) {
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Record<string, Role>>({});

  function handlePromote(memberId: string, currentRole: Role) {
    const newRole = selectedRole[memberId];

    if (newRole === currentRole) {
      return toast.warning(`Select a different role`);
    }

    if (newRole && onPromoteMember) {
      onPromoteMember(memberId, newRole);
      setExpandedMemberId(null);
    }
  }

  return (
    <div className="border-t border-border pt-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">
        Active Members ({totalConnectedUsers})
      </h3>

      <div className="space-y-2">
        {members.map((member) => (
          <div key={member.userId}>
            <div className="flex items-center justify-between gap-2 p-3 bg-background rounded border border-border hover:border-primary/30 transition-colors">
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

              {isAdmin && (
                <button
                  onClick={() =>
                    setExpandedMemberId(
                      expandedMemberId === member.userId ? null : member.userId,
                    )
                  }
                  className="text-xs px-2 py-1 text-foreground hover:bg-primary/10 rounded transition-colors"
                >
                  ⋮
                </button>
              )}
            </div>

            {isAdmin && expandedMemberId === member.userId && (
              <div className="p-3 bg-background rounded border border-border border-t-0 space-y-2">
                <select
                  value={selectedRole[member.userId] || member.role}
                  onChange={(e) =>
                    setSelectedRole({
                      ...selectedRole,
                      [member.userId]: e.target.value as Role,
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-card border border-border rounded focus:outline-none focus:border-primary"
                >
                  <option value="VIEWER">Viewer</option>
                  <option value="EDITOR">Editor</option>
                  <option value="ADMIN">Admin</option>
                </select>

                <div className="flex gap-2">
                  <button
                    onClick={() => handlePromote(member.userId, member.role)}
                    className="flex-1 px-3 py-2 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                  >
                    Promote
                  </button>

                  <button
                    onClick={() => onRemoveMember(member.userId)}
                    className="flex-1 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 rounded transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
