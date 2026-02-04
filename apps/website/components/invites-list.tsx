"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { getInvites, updateInviteStatus } from "@/data-service/mutations";

export default function InvitesList() {
  const router = useRouter();
  const queryClient = useQueryClient();

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
    queryKey: ["invites"],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      getInvites({ cursor: pageParam }),

    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.cursor! : undefined,

    select: (data) => data.pages.flatMap((page) => page.data),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: updateInviteStatus,
    mutationKey: ["update-invite"],

    onSuccess: (_, variables) => {
      toast.success(`Invite ${variables.status.toLowerCase()}`);
      queryClient.invalidateQueries({ queryKey: ["invites"] });
    },

    onError: (error) => {
      if (error.cause === 400) {
        return toast.error(error.message);
      }

      if (error.cause === 429) {
        return toast.error("Too many requests");
      }

      if (error.cause === 401) {
        toast.error("Unauthorized");

        return router.push("/login");
      }

      if (error.cause === 403) {
        return toast.error("Forbidden");
      }

      if (error.cause === 404) {
        return toast.error("Invite not found");
      }

      toast.error("Something went wrong");
    },
  });

  const handleAccept = (inviteId: string) => {
    mutate({ inviteId, status: "ACCEPTED" });
  };

  const handleDecline = (inviteId: string) => {
    mutate({ inviteId, status: "REJECTED" });
  };

  return (
    <div className="space-y-6">
      {isLoadingError && (
        <Card className="p-6 bg-card border-0 shadow-none items-center">
          <p className="text-destructive">Failed to load invites</p>

          <div>
            <Button
              size={"lg"}
              variant={"destructive"}
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </div>
        </Card>
      )}

      {isLoading && (
        <Card className="p-6 bg-card border-0 shadow-none items-center">
          <p className="text-muted-foreground text-sm">Loading invites...</p>
        </Card>
      )}

      {data && data.length > 0 && (
        <div className="space-y-4">
          {data.map((invite) => (
            <Card key={invite.id} className="p-6 bg-card border border-border">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-full overflow-hidden relative">
                    <Image
                      fill
                      alt={invite.invitersName}
                      className="object-cover"
                      src={
                        invite.invitersPicture ||
                        "https://avatars.githubusercontent.com/u/12345?v=4"
                      }
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-x-1.5">
                      <p className="font-semibold ">{invite.roomName}</p>

                      <span className="text-sm text-muted-foreground capitalize">
                        {" "}
                        • {invite.role.toLowerCase()}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Invited by{" "}
                      <span className="font-medium">{invite.invitersName}</span>{" "}
                      • Expires{" "}
                      {new Date(invite.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={isPending}
                    onClick={() => handleDecline(invite.id)}
                    className="border-border text-foreground cursor-pointer hover:bg-background"
                  >
                    Decline
                  </Button>

                  <Button
                    disabled={isPending}
                    onClick={() => handleAccept(invite.id)}
                    className="bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90"
                  >
                    Accept
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {isFetchingNextPage && (
            <div className="text-center py-4">
              <p className="text-muted-foreground text-sm">
                Loading invites...
              </p>
            </div>
          )}

          {isFetchNextPageError && (
            <Card className="p-6 bg-card border-0 shadow-none items-center">
              <p className="text-destructive">Failed to load invites</p>

              <div>
                <Button
                  size={"lg"}
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

            <p className="text-muted-foreground mb-2">No invites yet</p>
          </div>
        </div>
      )}
    </div>
  );
}
