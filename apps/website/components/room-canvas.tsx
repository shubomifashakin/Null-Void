"use client";

import React from "react";

import { useRef, useEffect, useState } from "react";

interface RoomCanvasProps {
  tool: "cursor" | "circle" | "polygon" | "line";
  roomId: string;
}

interface DrawingState {
  isDrawing: boolean;
  startX: number;
  startY: number;
}

export default function RoomCanvas({ tool, roomId }: RoomCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    startX: 0,
    startY: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size to match container
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (tool === "cursor") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setDrawingState({
      isDrawing: true,
      startX: x,
      startY: y,
    });
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!drawingState.isDrawing || tool === "cursor") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Redraw canvas with new shape
    redrawCanvas(ctx, canvas, x, y);
  }

  function handleMouseUp(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!drawingState.isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Final draw
    redrawCanvas(ctx, canvas, x, y);
    setDrawingState({ ...drawingState, isDrawing: false });
  }

  function redrawCanvas(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    currentX: number,
    currentY: number
  ) {
    const { startX, startY } = drawingState;

    // Clear canvas
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set stroke style
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    if (tool === "line") {
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(currentX, currentY);
      ctx.stroke();
    } else if (tool === "circle") {
      const radius = Math.sqrt(
        Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2)
      );
      ctx.beginPath();
      ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (tool === "polygon") {
      // Simple triangle for polygon
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(currentX, currentY);
      ctx.lineTo(startX - (currentX - startX), currentY);
      ctx.closePath();
      ctx.stroke();
    }
  }

  return (
    <div className="flex-1 overflow-hidden bg-white">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          if (drawingState.isDrawing) {
            setDrawingState({ ...drawingState, isDrawing: false });
          }
        }}
        className={`w-full h-full block ${tool !== "cursor" ? "cursor-crosshair" : "cursor-default"}`}
      />
    </div>
  );
}
