"use client";

import { useToolBar } from "@/stores/toolbar-state";
import { Role } from "@/types/room";
import { Circle, Hexagon, MousePointer2 } from "lucide-react";

export type Tools = "cursor" | "circle" | "polygon" | "line";

const tools = [
  { id: "cursor", label: "Cursor", icon: <MousePointer2 size={20} /> },
  { id: "line", label: "Line", icon: "/" },
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

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label
              title="Fill Color"
              htmlFor="fillColor"
              className="text-xs text-muted-foreground"
            >
              Fill
            </label>

            <input
              type="color"
              id="fillColor"
              value={fillColor}
              onChange={handleFillColorChange}
              className="w-6 h-6 rounded cursor-pointer border border-border rounded-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <label
              title="Stroke Color"
              htmlFor="strokeColor"
              className="text-xs text-muted-foreground"
            >
              Stroke
            </label>

            <input
              type="color"
              id="strokeColor"
              value={strokeColor}
              onChange={handleStrokeColorChange}
              className="w-6 h-6 rounded cursor-pointer border border-border rounded-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <label
              title="Stroke Width"
              htmlFor="strokeWidth"
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
              className="w-12 px-2 py-1 text-xs bg-background border border-border rounded focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <label
              title="Fill Opacity"
              htmlFor="fillOpacity"
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
              className="w-20 cursor-pointer"
            />

            <span className="text-xs text-muted-foreground w-8">
              {Math.round(fillOpacity * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
