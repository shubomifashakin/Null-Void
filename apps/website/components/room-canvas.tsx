"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Cursors } from "./cursors";
import { UserInfoWithRef } from "@/stores/room-state";
import { DrawEvent, FillStyle, Points } from "@null-void/shared";
import { v4 as uuid } from "uuid";

interface RoomCanvasProps {
  tool: "cursor" | "circle" | "polygon" | "line";
  connectedUsers: UserInfoWithRef[];
  drawEvents: DrawEvent[];
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  handleDraw: (event: DrawEvent) => void;
  handleMouseMove: (e: MouseEvent) => void;
}

export default function RoomCanvas({
  tool,
  canvasRef,
  connectedUsers,
  drawEvents,
  handleDraw,
  handleMouseMove,
}: RoomCanvasProps) {
  const [fillColor] = useState("rgba(255, 54, 51, 1)");
  const [strokeColor] = useState("#fc3");
  const [strokeWidth] = useState(2);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const lineStartRef = useRef<Points | null>(null);
  const circleCenterRef = useRef<Points | null>(null);
  const polygonPointsRef = useRef<Points[]>([]);
  const polygonHoverRef = useRef<Points | null>(null);
  const previewEventRef = useRef<DrawEvent | null>(null);

  const fillStyle: FillStyle | undefined = useMemo(() => {
    return {
      color: fillColor,
      opacity: 0.25,
    };
  }, [fillColor]);

  const getPoint = useCallback(
    (e: MouseEvent): Points | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    },
    [canvasRef],
  );

  const drawSingleEvent = useCallback(
    (ctx: CanvasRenderingContext2D, event: DrawEvent) => {
      ctx.lineWidth = event.strokeWidth;
      ctx.strokeStyle = event.strokeColor;

      if (event.type === "line") {
        ctx.beginPath();
        ctx.moveTo(event.from.x, event.from.y);
        ctx.lineTo(event.to.x, event.to.y);
        ctx.stroke();
        return;
      }

      if (event.type === "circle") {
        ctx.beginPath();
        ctx.arc(event.center.x, event.center.y, event.radius, 0, Math.PI * 2);

        if (event.fillStyle) {
          const prevAlpha = ctx.globalAlpha;
          ctx.globalAlpha = event.fillStyle.opacity;
          ctx.fillStyle = event.fillStyle.color;
          ctx.fill();
          ctx.globalAlpha = prevAlpha;
        }

        ctx.stroke();
        return;
      }

      if (event.type === "polygon") {
        if (event.points.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(event.points[0].x, event.points[0].y);
        for (let i = 1; i < event.points.length; i++) {
          ctx.lineTo(event.points[i].x, event.points[i].y);
        }
        ctx.closePath();

        if (event.fillStyle) {
          const prevAlpha = ctx.globalAlpha;
          ctx.globalAlpha = event.fillStyle.opacity;
          ctx.fillStyle = event.fillStyle.color;
          ctx.fill();
          ctx.globalAlpha = prevAlpha;
        }

        ctx.stroke();
      }
    },
    [],
  );

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    for (const event of drawEvents) {
      drawSingleEvent(ctx, event);
    }

    if (previewEventRef.current) {
      drawSingleEvent(ctx, previewEventRef.current);
    }
  }, [canvasRef, drawEvents, drawSingleEvent]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const nextWidth = Math.max(1, Math.floor(width * dpr));
      const nextHeight = Math.max(1, Math.floor(height * dpr));
      if (canvas.width !== nextWidth) canvas.width = nextWidth;
      if (canvas.height !== nextHeight) canvas.height = nextHeight;
      redraw();
    };

    resize();

    const observer = new ResizeObserver(() => {
      resize();
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, [canvasRef, redraw]);

  useEffect(() => {
    lineStartRef.current = null;
    circleCenterRef.current = null;
    polygonPointsRef.current = [];
    polygonHoverRef.current = null;
    previewEventRef.current = null;
    redraw();
  }, [tool, redraw]);

  const handleCanvasMouseDown = useCallback(
    (e: MouseEvent) => {
      if (tool === "cursor") return;
      const point = getPoint(e);
      if (!point) return;

      if (tool === "line") {
        lineStartRef.current = point;
        previewEventRef.current = null;
        return;
      }

      if (tool === "circle") {
        circleCenterRef.current = point;
        previewEventRef.current = null;
        return;
      }
    },
    [getPoint, tool],
  );

  const handleCanvasMouseUp = useCallback(
    (e: MouseEvent) => {
      if (tool === "cursor") return;
      const point = getPoint(e);
      if (!point) return;

      if (tool === "line") {
        const from = lineStartRef.current;
        if (!from) return;
        const event: DrawEvent = {
          type: "line",
          id: uuid(),
          strokeColor,
          strokeWidth,
          timestamp: Date.now().toString(),
          from,
          to: point,
        };
        lineStartRef.current = null;
        previewEventRef.current = null;
        handleDraw(event);
        redraw();
        return;
      }

      if (tool === "circle") {
        const center = circleCenterRef.current;
        if (!center) return;
        const radius = Math.hypot(point.x - center.x, point.y - center.y);
        const event: DrawEvent = {
          type: "circle",
          id: uuid(),
          strokeColor,
          strokeWidth,
          timestamp: Date.now().toString(),
          center,
          radius,
          fillStyle,
        };
        circleCenterRef.current = null;
        previewEventRef.current = null;
        handleDraw(event);
        redraw();
      }
    },
    [fillStyle, getPoint, handleDraw, redraw, strokeColor, strokeWidth, tool],
  );

  const handleCanvasClick = useCallback(
    (e: MouseEvent) => {
      if (tool !== "polygon") return;
      if (
        (e as unknown as { detail?: number }).detail &&
        (e as unknown as { detail?: number }).detail! > 1
      ) {
        return;
      }
      const point = getPoint(e);
      if (!point) return;
      polygonPointsRef.current = [...polygonPointsRef.current, point];
      polygonHoverRef.current = null;
      const points = polygonPointsRef.current;
      previewEventRef.current = {
        type: "polygon",
        id: uuid(),
        strokeColor,
        strokeWidth,
        timestamp: Date.now().toString(),
        points,
        fillStyle,
      };
      redraw();
    },
    [fillStyle, getPoint, redraw, strokeColor, strokeWidth, tool],
  );

  const handleCanvasDoubleClick = useCallback(
    (e: MouseEvent) => {
      if (tool !== "polygon") return;
      e.preventDefault();
      const points = polygonPointsRef.current;
      if (points.length < 3) return;
      const event: DrawEvent = {
        type: "polygon",
        id: uuid(),
        strokeColor,
        strokeWidth,
        timestamp: Date.now().toString(),
        points,
        fillStyle,
      };
      polygonPointsRef.current = [];
      polygonHoverRef.current = null;
      previewEventRef.current = null;
      handleDraw(event);
      redraw();
    },
    [fillStyle, handleDraw, redraw, strokeColor, strokeWidth, tool],
  );

  const handleCanvasMouseMove = useCallback(
    (e: MouseEvent) => {
      handleMouseMove(e);

      if (tool === "line") {
        const from = lineStartRef.current;
        if (!from) return;
        const point = getPoint(e);
        if (!point) return;
        previewEventRef.current = {
          type: "line",
          id: uuid(),
          strokeColor,
          strokeWidth,
          timestamp: Date.now().toString(),
          from,
          to: point,
        };
        redraw();
        return;
      }

      if (tool === "circle") {
        const center = circleCenterRef.current;
        if (!center) return;
        const point = getPoint(e);
        if (!point) return;
        const radius = Math.hypot(point.x - center.x, point.y - center.y);
        previewEventRef.current = {
          type: "circle",
          id: uuid(),
          strokeColor,
          strokeWidth,
          timestamp: Date.now().toString(),
          center,
          radius,
          fillStyle,
        };
        redraw();
        return;
      }

      if (tool === "polygon") {
        if (polygonPointsRef.current.length === 0) return;
        const hover = getPoint(e);
        if (!hover) return;
        polygonHoverRef.current = hover;
        const points = [...polygonPointsRef.current, hover];
        previewEventRef.current = {
          type: "polygon",
          id: uuid(),
          strokeColor,
          strokeWidth,
          timestamp: Date.now().toString(),
          points,
          fillStyle,
        };
        redraw();
      }
    },
    [
      fillStyle,
      getPoint,
      handleMouseMove,
      redraw,
      strokeColor,
      strokeWidth,
      tool,
    ],
  );

  return (
    <div
      ref={containerRef}
      className="flex-1 p-2 overflow-auto bg-white relative"
    >
      <Cursors users={connectedUsers} />

      <canvas
        ref={canvasRef}
        onMouseDown={(e) => handleCanvasMouseDown(e as unknown as MouseEvent)}
        onMouseUp={(e) => handleCanvasMouseUp(e as unknown as MouseEvent)}
        onClick={(e) => handleCanvasClick(e as unknown as MouseEvent)}
        onDoubleClick={(e) =>
          handleCanvasDoubleClick(e as unknown as MouseEvent)
        }
        onMouseMove={(e) => handleCanvasMouseMove(e as unknown as MouseEvent)}
        className={`block border w-full h-full ${tool !== "cursor" ? "cursor-crosshair" : "cursor-default"}`}
      />
    </div>
  );
}
