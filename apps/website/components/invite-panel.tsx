import { useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { toast } from "sonner";

import { Role } from "@null-void/shared";

import {
  getRoomInvites,
  revokeInvite,
  sendInvite,
} from "@/data-service/mutations";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { getRoleColor } from "@/lib/utils";

export default function InvitePanel({
  roomId,
  isAdmin,
}: {
  roomId: string;
  isAdmin: boolean;
}) {
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role | undefined>();

  const {
    data,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    isLoadingError,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["room-invites"],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      getRoomInvites({ cursor: pageParam, roomId }),

    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.cursor! : undefined,

    select: (data) => data.pages.flatMap((page) => page.data),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: sendInvite,
    mutationKey: ["invite-user"],

    onSuccess: () => {
      toast.info("Invitation sent successfully!");
      setEmail("");
      setRole(undefined);

      queryClient.invalidateQueries({ queryKey: ["room-invites"] });
    },

    onError: (error) => {
      if (error.cause === 400) {
        return toast.error(error.message);
      }

      if (error.cause === 429) {
        return toast.error("Too many requests");
      }

      toast.error("Failed to send invitation");
    },
  });

  const { mutate: revokeInviteFn, isPending: isRevoking } = useMutation({
    mutationFn: revokeInvite,
    mutationKey: ["revoke-invite"],

    onSuccess: () => {
      toast.info("Invitation Revoked");

      queryClient.invalidateQueries({ queryKey: ["room-invites"] });
    },

    onError: (error) => {
      if (error.cause === 400) {
        return toast.error(error.message);
      }

      if (error.cause === 429) {
        return toast.error("Too many requests");
      }

      toast.error("Failed to send invitation");
    },
  });

  function handleInvite() {
    if (!email || !role || !roomId) return;

    mutate({ email, role, roomId });
  }

  function handleRevokeInvite(inviteId: string) {
    revokeInviteFn({ inviteId, roomId });
  }

  return (
    <div className="p-4">
      <div className="space-y-4">
        {isAdmin && (
          <div className="border border-border rounded p-3 bg-background">
            <input
              type="email"
              value={email}
              placeholder="Enter email to invite..."
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-card border border-border rounded focus:outline-none focus:border-primary mb-2"
            />

            <select
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full px-3 py-2 text-xs bg-card border border-border rounded focus:outline-none focus:border-primary mb-2"
            >
              <option value={"VIEWER"}>Viewer</option>

              <option value={"EDITOR"}>Editor</option>

              <option value={"ADMIN"}>Admin</option>
            </select>

            <button
              onClick={handleInvite}
              disabled={!email || !role || !roomId || isPending}
              className="w-full px-3 py-2 cursor-pointer text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              Send Invite
            </button>
          </div>
        )}

        {isLoadingError && (
          <Card className="p-6 bg-card border-0 gap-y-2 shadow-none items-center">
            <p className="text-destructive text-sm">Failed to get invites</p>

            <div>
              <Button
                size={"sm"}
                variant={"destructive"}
                onClick={() => refetch()}
              >
                Retry
              </Button>
            </div>
          </Card>
        )}

        {isLoading && (
          <Card className="p-6 bg-card border-0 shadow-none flex flex-col items-center space-y-3">
            <div className="flex space-x-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="size-2 bg-primary/60 rounded-full animate-pulse"
                  style={{
                    animationDuration: "1.5s",
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
          </Card>
        )}

        {data && data.length > 0 && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">
                Pending
              </h4>

              {data.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between gap-2 p-3 bg-background rounded mb-2 border border-border"
                >
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="space-y-1">
                      <p
                        title={invite.email}
                        className="text-xs font-medium text-foreground truncate"
                      >
                        {invite.email}
                      </p>

                      <p
                        title={invite.invitersName}
                        className="text-xs text-muted-foreground"
                      >
                        By {invite.invitersName}
                      </p>
                    </div>

                    <p
                      className={`text-xs px-2 py-0.5 rounded w-fit mt-1 ${getRoleColor(invite.role)}`}
                    >
                      {invite.role}
                    </p>
                  </div>

                  {isAdmin && (
                    <button
                      title="Revoke invite"
                      disabled={isRevoking}
                      onClick={() => handleRevokeInvite(invite.id)}
                      className="text-xs px-2 py-1 cursor-pointer text-destructive hover:bg-destructive/10 rounded transition-colors"
                    >
                      {isRevoking ? "Revoking..." : "Revoke"}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {isFetchingNextPage && (
              <div className="text-center py-4">
                <p className="text-muted-foreground text-xs">
                  Loading invites...
                </p>
              </div>
            )}

            {isFetchNextPageError && (
              <Card className="p-6 bg-card gap-y-2 border-0 shadow-none items-center">
                <p className="text-destructive text-xs">
                  Failed to load invites
                </p>

                <div>
                  <Button
                    size={"sm"}
                    variant={"destructive"}
                    onClick={() => refetch()}
                  >
                    Retry
                  </Button>
                </div>
              </Card>
            )}

            {hasNextPage && !isFetchingNextPage && !isFetchNextPageError && (
              <div className="flex justify-center pt-8">
                <Button
                  size={"sm"}
                  onClick={() => fetchNextPage()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Load More
                </Button>
              </div>
            )}
          </div>
        )}

        {data && !data.length && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">No pending invites!</p>
          </div>
        )}
      </div>
    </div>
  );
}
