"use client";

import { useState } from "react";
import Image from "next/image";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Invite {
  id: string;
  roomName: string;
  invitedBy: string;
  invitedByImage: string;
  createdAt: string;
}

// Mock data
const MOCK_INVITES: Invite[] = [
  {
    id: "invite-1",
    roomName: "Q1 Planning",
    invitedBy: "Sarah Chen",
    invitedByImage: "https://avatars.githubusercontent.com/u/12345?v=4",
    createdAt: "2 days ago",
  },
  {
    id: "invite-2",
    roomName: "Design System",
    invitedBy: "Marcus Johnson",
    invitedByImage: "https://avatars.githubusercontent.com/u/23456?v=4",
    createdAt: "5 days ago",
  },
  {
    id: "invite-3",
    roomName: "Brand Workshop",
    invitedBy: "Emily Rodriguez",
    invitedByImage: "https://avatars.githubusercontent.com/u/34567?v=4",
    createdAt: "1 week ago",
  },
];

export default function InvitesList() {
  const [invites, setInvites] = useState(MOCK_INVITES);
  const [acceptedInvites, setAcceptedInvites] = useState<string[]>([]);

  const handleAccept = (inviteId: string) => {
    setAcceptedInvites([...acceptedInvites, inviteId]);
    setInvites(invites.filter((invite) => invite.id !== inviteId));
  };

  const handleDecline = (inviteId: string) => {
    setInvites(invites.filter((invite) => invite.id !== inviteId));
  };

  if (invites.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-muted-foreground mb-2">
            {acceptedInvites.length > 0 ? "All caught up!" : "No invites yet"}
          </p>
          {acceptedInvites.length > 0 && (
            <p className="text-sm text-muted-foreground">
              You have accepted {acceptedInvites.length} invites
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {invites.map((invite) => (
        <Card key={invite.id} className="p-6 bg-card border border-border">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <Image
                src={invite.invitedByImage || "/placeholder.svg"}
                alt={invite.invitedBy}
                className="w-12 h-12 rounded-full"
              />

              <div className="flex-1">
                <p className="font-semibold text-foreground">
                  Join <span className="text-primary">{invite.roomName}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Invited by{" "}
                  <span className="font-medium">{invite.invitedBy}</span> •{" "}
                  {invite.createdAt}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleDecline(invite.id)}
                className="border-border text-foreground hover:bg-background"
              >
                Decline
              </Button>
              <Button
                onClick={() => handleAccept(invite.id)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Accept
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
