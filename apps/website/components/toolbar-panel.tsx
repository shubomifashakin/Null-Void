"use client";

import { Circle, Hexagon, Minus, MousePointer2 } from "lucide-react";

import { useToolBar } from "@/stores/toolbar-state";
import { Role } from "@/types/room";

export type Tools = "cursor" | "circle" | "polygon" | "line";

const tools = [
  { id: "cursor", label: "Cursor", icon: <MousePointer2 size={20} /> },
  { id: "line", label: "Line", icon: <Minus size={20} /> },
  { id: "circle", label: "Circle", icon: <Circle size={20} /> },
  { id: "polygon", label: "Polygon", icon: <Hexagon size={20} /> },
];

export default function ToolbarPanel({ role }: { role: Role }) {
  const {
    tool: selectedTool,
    setTool,
    fillColor,
    fillOpacity,
    strokeColor,
    strokeWidth,
    setFillColor,
    setStrokeColor,
    setFillOpacity,
    setStrokeWidth,
  } = useToolBar();

  function handleToolChange(tool: Tools) {
    if (role === "VIEWER") {
      return setTool("cursor");
    }

    setTool(tool);
  }

  function handleFillColorChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFillColor(e.target.value);
  }

  function handleStrokeColorChange(e: React.ChangeEvent<HTMLInputElement>) {
    setStrokeColor(e.target.value);
  }

  function handleStrokeWidthChange(e: React.ChangeEvent<HTMLInputElement>) {
    setStrokeWidth(parseFloat(e.target.value));
  }

  function handleFillOpacityChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFillOpacity(parseFloat(e.target.value));
  }

  return (
    <div className="border-b border-border bg-card px-4 py-3 space-y-3">
      <div className="flex items-center justify-center gap-6">
        <div className="flex items-center gap-1 bg-background rounded p-1">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => handleToolChange(tool.id as Tools)}
              className={`w-8 h-8 cursor-pointer flex items-center justify-center rounded text-lg font-semibold transition-colors ${
                selectedTool === tool.id
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-card"
              }`}
              title={tool.label}
            >
              {tool.icon}
            </button>
          ))}
        </div>

        <div className="h-8 w-px bg-border" />

        <div className="flex items-center gap-4">
          <label
            htmlFor="fillColor"
            title="Fill Color"
            className="flex items-center gap-1.5 cursor-pointer group"
          >
            <span className="text-xs text-muted-foreground">Fill</span>
            <div className="relative w-6 h-6 rounded border border-border group-hover:border-primary/60 transition-colors overflow-hidden">
              <div
                className="absolute inset-0"
                style={{ backgroundColor: fillColor }}
              />
              <input
                type="color"
                id="fillColor"
                value={fillColor}
                onChange={handleFillColorChange}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
            </div>
          </label>

          <label
            htmlFor="strokeColor"
            title="Stroke Color"
            className="flex items-center gap-1.5 cursor-pointer group"
          >
            <span className="text-xs text-muted-foreground">Stroke</span>
            <div className="relative w-6 h-6 rounded border border-border group-hover:border-primary/60 transition-colors overflow-hidden">
              <div
                className="absolute inset-0"
                style={{ backgroundColor: strokeColor }}
              />
              <input
                type="color"
                id="strokeColor"
                value={strokeColor}
                onChange={handleStrokeColorChange}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
            </div>
          </label>

          <div className="flex items-center gap-1.5">
            <label
              htmlFor="strokeWidth"
              title="Stroke Width"
              className="text-xs text-muted-foreground"
            >
              Width
            </label>
            <input
              min="1"
              max="10"
              type="number"
              id="strokeWidth"
              value={strokeWidth}
              onChange={handleStrokeWidthChange}
              className="w-10 px-1.5 py-1 text-xs text-center bg-background border border-border rounded focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <label
              htmlFor="fillOpacity"
              title="Fill Opacity"
              className="text-xs text-muted-foreground"
            >
              Opacity
            </label>
            <input
              min="0"
              max="1"
              step="0.1"
              type="range"
              id="fillOpacity"
              value={fillOpacity}
              onChange={handleFillOpacityChange}
              className="w-20 cursor-pointer accent-primary"
            />
            <span className="text-xs text-muted-foreground tabular-nums w-7 text-right">
              {Math.round(fillOpacity * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
