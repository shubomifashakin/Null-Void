"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { createRoom } from "@/data-service/mutations";

export default function RoomsList() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: createRoom,
    mutationKey: ["create-room"],

    onSuccess: (data) => {
      router.push(`/room/${data.id}`);
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

      toast.error("Something went wrong");
    },
  });

  function handleIsCreatingRoom() {
    setIsCreatingRoom(!isCreatingRoom);
  }

  const handleCreateRoom = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      mutate({
        name: name.trim(),
        description: description.trim(),
      });
    },
    [name, description, mutate]
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          onClick={handleIsCreatingRoom}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isCreatingRoom ? "Cancel" : "+ Create Room"}
        </Button>
      </div>

      {isCreatingRoom && (
        <Card className="p-6 bg-card border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Create a New Room
          </h3>

          <form onSubmit={handleCreateRoom} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Room Name
              </label>

              <input
                type="text"
                value={name}
                minLength={3}
                maxLength={20}
                placeholder="Enter room name"
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>

              <textarea
                rows={3}
                minLength={3}
                maxLength={30}
                value={description}
                placeholder="Describe your room"
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-border max-h-40 min-h-24 rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={handleIsCreatingRoom}
                className="border-border text-foreground hover:bg-background"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Create
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
