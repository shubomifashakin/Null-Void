"use client";

import React from "react";
import { Cursors } from "./cursors";
import { UserInfoWithRef } from "@/stores/room-state";

interface RoomCanvasProps {
  tool: "cursor" | "circle" | "polygon" | "line";
  connectedUsers: UserInfoWithRef[];
  handleMouseMove: (e: MouseEvent) => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export default function RoomCanvas({
  tool,
  canvasRef,
  handleMouseMove,
  connectedUsers,
}: RoomCanvasProps) {
  return (
    <div className="flex-1 overflow-hidden bg-white">
      <Cursors users={connectedUsers} />

      <canvas
        ref={canvasRef}
        onMouseMove={(e) => handleMouseMove(e as unknown as MouseEvent)}
        className={`w-full h-full block ${tool !== "cursor" ? "cursor-crosshair" : "cursor-default"}`}
      />
    </div>
  );
}
