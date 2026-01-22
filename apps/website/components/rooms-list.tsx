"use client";

import { useState } from "react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Room {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  createdAt: string;
}

const ROOMS_PER_PAGE = 6;

// Mock data
const MOCK_ROOMS: Room[] = Array.from({ length: 25 }, (_, i) => ({
  id: `room-${i + 1}`,
  name: `Room ${i + 1}`,
  description: `A collaborative canvas for project ${i + 1}. Work together with your team in real-time.`,
  memberCount: Math.floor(Math.random() * 10) + 1,
  createdAt: new Date(
    Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
  ).toLocaleDateString(),
}));

export default function RoomsList() {
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  const totalPages = Math.ceil(MOCK_ROOMS.length / ROOMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROOMS_PER_PAGE;
  const paginatedRooms = MOCK_ROOMS.slice(
    startIndex,
    startIndex + ROOMS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      {/* Create Room Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setIsCreatingRoom(!isCreatingRoom)}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isCreatingRoom ? "Cancel" : "+ Create Room"}
        </Button>
      </div>

      {/* Create Room Form */}
      {isCreatingRoom && (
        <Card className="p-6 bg-card border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Create a New Room
          </h3>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Room Name
              </label>
              <input
                type="text"
                placeholder="Enter room name"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <textarea
                placeholder="Describe your room"
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreatingRoom(false)}
                className="border-border text-foreground hover:bg-background"
              >
                Cancel
              </Button>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Create
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Rooms Grid */}
      {paginatedRooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedRooms.map((room) => (
            <Card
              key={room.id}
              className="p-6 bg-card border border-border hover:border-primary/50 transition-colors cursor-pointer"
            >
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">
                  {room.name}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {room.description}
                </p>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">
                    {room.memberCount} members
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {room.createdAt}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No rooms yet. Create one to get started!
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="border-border text-foreground hover:bg-background disabled:opacity-50"
          >
            Previous
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              onClick={() => setCurrentPage(page)}
              className={
                currentPage === page
                  ? "bg-primary text-primary-foreground"
                  : "border-border text-foreground hover:bg-background"
              }
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="border-border text-foreground hover:bg-background disabled:opacity-50"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
